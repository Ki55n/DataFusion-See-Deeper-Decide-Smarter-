from langgraph.graph import StateGraph
from backend.my_agent.State import InputState, OutputState
from backend.my_agent.SQLAgent import SQLAgent
from backend.my_agent.DataFormatter import DataFormatter
from langgraph.graph import END
from typing import List

class WorkflowManager:
    def __init__(self, api_key: str, endpoint_url:str, model_name:str="gemini-1.5-pro"):
        self.sql_agent = SQLAgent(API_KEY=api_key, ENDPOINT_URL=endpoint_url, LLM_MODEL_NAME=model_name)
        self.data_formatter = DataFormatter(API_KEY=api_key, MODEL_NAME=model_name)

    def create_workflow(self) -> StateGraph:
        """Create and configure the workflow graph."""
        workflow = StateGraph(input=InputState, output=OutputState)

        # Add nodes to the graph
        workflow.add_node("parse_question", self.sql_agent.parse_question)
        workflow.add_node("get_unique_nouns", self.sql_agent.get_unique_nouns)
        workflow.add_node("generate_sql", self.sql_agent.generate_sql)
        workflow.add_node("validate_and_fix_sql", self.sql_agent.validate_and_fix_sql)
        workflow.add_node("execute_sql", self.sql_agent.execute_sql)
        workflow.add_node("format_results", self.sql_agent.format_results)
        workflow.add_node("choose_visualization", self.sql_agent.choose_visualization)
        workflow.add_node("format_data_for_visualization", self.data_formatter.format_data_for_visualization)
        workflow.add_node("summarize_visualization", self.data_formatter.summarize_visualization)
        
        # Define edges
        workflow.add_edge("parse_question", "get_unique_nouns")
        workflow.add_edge("get_unique_nouns", "generate_sql")
        workflow.add_edge("generate_sql", "validate_and_fix_sql")
        workflow.add_edge("validate_and_fix_sql", "execute_sql")
        workflow.add_edge("execute_sql", "format_results")
        workflow.add_edge("execute_sql", "choose_visualization")
        workflow.add_edge("choose_visualization", "format_data_for_visualization")
        workflow.add_edge("format_data_for_visualization", "summarize_visualization")
        workflow.add_edge("summarize_visualization", END)
        # workflow.add_edge("format_results", "summarize_visualization")
        workflow.add_edge("format_results", END)
        workflow.set_entry_point("parse_question")

        return workflow
    
    def returnGraph(self):
        return self.create_workflow().compile()

    def run_sql_agent(self, question: str, file_uuids: List[str], project_uuid: str) -> dict:
        """Run the SQL agent workflow and return the formatted answer and visualization recommendation."""
        app = self.create_workflow().compile()
        result = app.invoke({"question": question, "file_uuids": file_uuids, "project_uuid": project_uuid})
        return {
            "answer": result['answer'],
            "visualization": result['visualization'],
            "visualization_reason": result['visualization_reason'],
            "formatted_data_for_visualization": result['formatted_data_for_visualization']
        }