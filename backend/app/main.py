from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import psycopg2
from pathlib import Path

app = FastAPI(title="ESG-UI Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load schema
SCHEMA_PATH = Path(__file__).resolve().parent.parent.parent / "esg_schema_gui.json"
with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    ESG_SCHEMA = json.load(f)

@app.get("/schema")
def get_schema():
    return ESG_SCHEMA

# ✅ New model for submissions
class ESGSubmission(BaseModel):
    company_id: str
    year: int
    metrics: dict

# ✅ New endpoint to save data
@app.post("/submit")
def submit_data(data: ESGSubmission):
    try:
        conn = psycopg2.connect(
            dbname="esgdb",
            user="esguser",
            password="esgpass",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO esg_metrics (company_id, year, metrics)
            VALUES (%s, %s, %s)
            """,
            (data.company_id, data.year, json.dumps(data.metrics))
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "ESG data saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
