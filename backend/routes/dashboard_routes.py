# backend/routes/dashboard_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from backend.database import SessionLocal
from backend.models import esg_scorecard
from backend.engine.esg_engine import run_esg_engine

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# -----------------------------
# Dependency for DB session
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# ESG Dashboard Scores (Canonical Endpoint)
# -----------------------------
@router.get("/scores/{company_id}/{reporting_period}", response_model=dict)
def get_scores(company_id: int, reporting_period: date, db: Session = Depends(get_db)):
    """
    Run ESG engine, persist results into esg_raw_scores & esg_final_scores,
    and return pillar + final scores for the dashboard.
    """
    results = run_esg_engine(company_id=company_id, reporting_period=reporting_period, db=db)

    return {
        "company_id": results["company_id"],
        "reporting_period": str(results["reporting_period"]),
        "pillar_scores": results["pillar_scores"],
        "final_score": results["final_score"],
    }


# -----------------------------
# Latest Reporting Period (helper for frontend)
# -----------------------------
@router.get("/latest-period/{company_id}", response_model=dict)
def get_latest_period(company_id: int, db: Session = Depends(get_db)):
    """
    Return the latest reporting period for a company where submissions exist.
    This ignores mappings/weights dates and just looks at form submissions (is_current = true).
    """
    row = (
        db.query(esg_scorecard.EsgFormSubmission.reporting_period)
        .filter_by(company_id=company_id, is_current=True)
        .order_by(esg_scorecard.EsgFormSubmission.reporting_period.desc())
        .first()
    )

    return {"latest_reporting_period": str(row[0]) if row else None}
