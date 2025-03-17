#!/bin/bash

# Navigate to the directory where routers.py is located and start the first FastAPI app (on port 8000)
cd $HOME/datafusion/backend/sqlite_server
# fastapi run sqlite_routers.py --host 0.0.0.0 --port 8000 &
uvicorn sqlite_router:router --host 0.0.0.0 --port 8000 &

# Navigate to the directory where main.py is located and start the second FastAPI app (on port 8001)
cd $HOME/datafusion
# fastapi run main.py --host 0.0.0.0 --port 8001
uvicorn main:app --host 0.0.0.0 --port 8001

