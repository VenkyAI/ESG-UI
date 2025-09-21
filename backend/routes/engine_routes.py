from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
from datetime import date

from backend.database import SessionLocal
from backend.engine.esg_engine import run_esg_engine

router = APIRouter(prefix="/engine", tags=["ESG Engine"])


# -----------------------------
# DB Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Request Schema
# -----------------------------
class EngineRequest(BaseModel):
    company_id: int
    reporting_period: date
    raw_data: Dict[str, float]


# -----------------------------
# Routes
# -----------------------------
@router.post("/run")
def run_engine(payload: EngineRequest, db: Session = Depends(get_db)):
    """
    Run the ESG Engine and calculate scores.
    """
    result = run_esg_engine(
        db,
        company_id=payload.company_id,
        reporting_period=payload.reporting_period,
        raw_data=payload.raw_data,
    )
    return {
        "message": "ESG Engine run complete",
        "dashboard": {
            "environmental": result.environmental_score,
            "social": result.social_score,
            "governance": result.governance_score,
            "final": result.final_esg_score,
        },
    }
