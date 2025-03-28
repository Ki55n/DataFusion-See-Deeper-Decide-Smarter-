import logging
import os
import sqlite3

import httpx
import pandas as pd
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from backend.analysis import AdvancedVisualizer
from backend.cleaning import AdvancedDataPipeline

# from backend_dateja.my_agent.main import graph
from backend.my_agent.WorkflowManager import WorkflowManager
from backend.my_agent.LLMManager import LLMManager

logger = logging.getLogger(__name__)


# Data model for the SQL query execution request
class QueryRequest(BaseModel):
    project_uuid: str
    file_uuids: List[str]
    question: str


class CleaningRequest(BaseModel):
    file_uuid: str
    action: str  # options: handle_inconsistent_formats, handle_missing_values, handle_duplicates, handle_high_dimensionality


class AnalysisRequest(BaseModel):
    file_uuid: str
    action: str  # options: basic_insights, insights,


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load credentials
load_dotenv(dotenv_path=".env", override=True)
API_KEY = os.getenv("GOOGLE_API_KEY")
LLM_MODEL_NAME = os.getenv("GEMINI_LLM_MODEL")
ENDPOINT_URL = os.getenv("DB_ENDPOINT_URL")
CLEANED_TABLE_NAME = "data_cleaned"
ANALYSED_TABLE_NAME = "data_analysed"
# define csv_agent_graph
csv_agent_graph = WorkflowManager(
    api_key=API_KEY,
    endpoint_url=ENDPOINT_URL,
    model_name=LLM_MODEL_NAME,
).returnGraph()

# define summarizer llm agent
summarizer_llm = LLMManager(api_key=API_KEY, model_name=LLM_MODEL_NAME)

def table_exists(conn, table_name_prefix):
    cursor = conn.cursor()
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    has_cleaned_table = False
    for table in tables:
        table_name, create_statement = table
        if table_name_prefix in table_name:
            has_cleaned_table = True

    if has_cleaned_table is False:
        raise HTTPException(status_code=404, detail=f"Cleaned Table does not exist in the database")
    
    return True

@app.post("/call-model")
async def call_model(request: QueryRequest):
    project_uuid = request.project_uuid
    file_uuids = request.file_uuids
    question = request.question
    print(request)
    # Check if both uuid and query are provided
    if not file_uuids or not question or not project_uuid:
        raise HTTPException(status_code=400, detail="Missing uuids or query")
    try:
        async with httpx.AsyncClient() as client:
            uploads_dir = await client.get(f"{ENDPOINT_URL}/get-uploads-dir")
            uploads_dir = uploads_dir.json()

        for id in file_uuids:
            # Connect to SQLite and save the cleaned data
            db_file_path = os.path.join(uploads_dir, f"{id}.sqlite")
            print("db path: ", db_file_path)
            # table_name = CLEANED_TABLE_NAME
            conn = sqlite3.connect(db_file_path)

            if table_exists(conn=conn, table_name_prefix=CLEANED_TABLE_NAME) is False:
                conn.close()
                raise HTTPException(
                    status_code=404,
                    detail=f"Table '{CLEANED_TABLE_NAME}' does not exist in the database",
                )
            else:
                conn.close()
        print("Executing invoke")
        response = csv_agent_graph.invoke(request)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    return response


@app.post("/data-cleaning-pipeline")
async def data_cleaning_pipeline(file_uuid: str):
    try:
        async with httpx.AsyncClient() as client:
            responses = await client.get(
                f"{ENDPOINT_URL}/get-file-dataframe/{file_uuid}"
            )

            uploads_dir = await client.get(f"{ENDPOINT_URL}/get-uploads-dir")
            uploads_dir = uploads_dir.json()
            df = []
            for res in responses.json():
                df.append(pd.read_json(res))

        # Connect to SQLite and save the cleaned data
        db_path = os.path.join(uploads_dir, f"{file_uuid}.sqlite")

        conn = sqlite3.connect(db_path)
        try:
            # if isinstance(df, list):
            for idx, dataframe in enumerate(df):
                pipeline = AdvancedDataPipeline(dataframe)
                cleaned_df = pipeline.run_all()[0]
                cleaned_df.to_sql(f"{CLEANED_TABLE_NAME}_{idx+1}", 
                                conn, 
                                if_exists="replace", 
                                index=False)

            return {"message": "Finished data cleaning."}
        except Exception as e:
            logger.exception("Error saving data to SQLite.")
            raise HTTPException(
                status_code=500, detail=f"Failed to save cleaned data: {str(e)}"
            )
        finally:
            conn.close()

    except Exception as e:
        logger.exception("Error during the data cleaning pipeline.")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/data-analysis-pipeline")
async def handle_data_analysis(file_uuid: str):
    try:
        async with httpx.AsyncClient() as client:
            responses = await client.get(
                f"{ENDPOINT_URL}/get-file-dataframe/{file_uuid}?table_prefix={CLEANED_TABLE_NAME}"
            )
            df = []
            for res in responses.json():
                df.append(pd.read_json(res))
            uploads_dir = await client.get(f"{ENDPOINT_URL}/get-uploads-dir")
            uploads_dir = uploads_dir.json()

        # Connect to SQLite and save the cleaned data
        db_path = os.path.join(uploads_dir, f"{file_uuid}.sqlite")

        try:
            # Connect to (or create) the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            # if isinstance(df, list):
            for idx, dataframe in enumerate(df):
                visualizer = AdvancedVisualizer(dataframe, api_key=API_KEY)
                markdown_response = visualizer.handle_request("generate_report")

                # Create a table for storing Markdown content
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {ANALYSED_TABLE_NAME}_{idx+1} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        report_name TEXT NOT NULL,
                        markdown_content TEXT NOT NULL
                    )
                """)

                # Insert Markdown content into the table
                cursor.execute(
                    f"""
                    INSERT INTO {ANALYSED_TABLE_NAME}_{idx+1} (report_name, markdown_content) 
                    VALUES (?, ?)
                """,
                    ("Data Insights", markdown_response),
                )

            # Commit and close the connection
            conn.commit()
            return {"message": "Finished data analysis."}
        except Exception as e:
            logger.exception("Error saving data to SQLite.")
            raise HTTPException(
                status_code=500, detail=f"Failed to save analyzed data: {str(e)}"
            )
        finally:
            conn.close()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Basic hello world endpoint
@app.get("/")
async def root():
    return {"message": "This is an ai-server."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
