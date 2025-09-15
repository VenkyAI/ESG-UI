from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from pathlib import Path
import psycopg2   # 👈 missing import
import re

app = FastAPI()

# Allow frontend (React) to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in prod, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
UI_SCHEMA_PATH = BASE_DIR / "esg_schema_gui.json"
VALIDATION_SCHEMA_PATH = BASE_DIR / "esg_validation_schema.json"

# Load schemas
with open(UI_SCHEMA_PATH, "r", encoding="utf-8") as f:
    ESG_UI_SCHEMA = json.load(f)

with open(VALIDATION_SCHEMA_PATH, "r", encoding="utf-8") as f:
    ESG_VALIDATION_SCHEMA = json.load(f)


@app.get("/schema")
def get_schema():
    """Return schema for frontend UI rendering"""
    return ESG_UI_SCHEMA


@app.get("/validation-schema")
def get_validation_schema():
    """Return schema used for backend validation rules"""
    return ESG_VALIDATION_SCHEMA


# ✅ Model for submissions
class ESGSubmission(BaseModel):
    company_id: str
    year: int
    metrics: dict


# ✅ Endpoint to save data
@app.post("/submit")
def submit_data(data: ESGSubmission):
    # ✅ Validation loop
    for field, rules in ESG_VALIDATION_SCHEMA.items():   # 👈 fixed name
        if field in data.metrics:
            value = data.metrics[field]

            if rules["type"] == "numeric":
                try:
                    val = float(value)
                    if "min" in rules and val < rules["min"]:
                        return {"status": "error", "message": f"{field} must be ≥ {rules['min']}"}
                    if "max" in rules and val > rules["max"]:
                        return {"status": "error", "message": f"{field} must be ≤ {rules['max']}"}
                except ValueError:
                    return {"status": "error", "message": f"{field} must be a number"}

            if rules["type"] == "regex":
                if not re.match(rules["pattern"], str(value)):
                    return {"status": "error", "message": f"{field} must match {rules['pattern']}"}

            if rules["type"] == "boolean":
                if not isinstance(value, bool):
                    return {"status": "error", "message": f"{field} must be true/false"}

    # ✅ If all validations pass → insert into DB
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
