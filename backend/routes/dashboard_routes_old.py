from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from backend.database import SessionLocal
from backend.models import esg_scorecard
from backend.schemas.dashboard_schemas import KPIBase

# Define router
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------------------
# CRUD + Dashboard Endpoints
# ----------------------------

from backend.schemas.dashboard_schemas import KPIBase, KPIOut

@router.post("/kpis")
def create_kpi(kpi: KPIBase, db: Session = Depends(get_db)):
    try:
        new_kpi = esg_scorecard.ESGKPI(**kpi.dict())
        db.add(new_kpi)
        db.commit()
        db.refresh(new_kpi)
        print("✅ KPI inserted:", new_kpi.kpi_code)
        return kpi.dict()   # ✅ Just return plain dict
    except Exception as e:
        db.rollback()
        print("❌ ERROR inserting KPI:", str(e))
        raise HTTPException(status_code=500, detail=f"Insert failed: {e}")


@router.get("/kpis")
def list_kpis(db: Session = Depends(get_db)):
    """List all KPI definitions"""
    return db.query(esg_scorecard.ESGKPI).all()


@router.post("/scores")
def add_score(score: dict, db: Session = Depends(get_db)):
    """Add a raw score entry for a KPI"""
    new_score = esg_scorecard.ESGScore(**score)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score


@router.get("/{company_id}/{year}")
def get_dashboard(company_id: int, year: int, db: Session = Depends(get_db)):
    """Return final ESG dashboard scores for given company + year"""
    dashboard = (
        db.query(esg_scorecard.ESGDashboard)
        .filter(
            esg_scorecard.ESGDashboard.company_id == company_id,
            esg_scorecard.ESGDashboard.reporting_period == date(year, 1, 1),
        )
        .first()
    )

    if not dashboard:
        raise HTTPException(status_code=404, detail="No dashboard found")

    return {
        "environmental": dashboard.environmental_score,
        "social": dashboard.social_score,
        "governance": dashboard.governance_score,
        "final_esg": dashboard.final_esg_score,
    }


@router.post("/calculate")
def calculate_dashboard(payload: dict, db: Session = Depends(get_db)):
    """
    Calculate pillar and final ESG scores for a company.
    Expected payload:
    {
        "company_id": 1,
        "year": 2024,
        "scores": [
            {"kpi_code": "ENV-01", "normalized_score": 70, "weight": 0.2},
            {"kpi_code": "SOC-01", "normalized_score": 80, "weight": 0.3},
            {"kpi_code": "GOV-01", "normalized_score": 90, "weight": 0.5}
        ]
    }
    """
    company_id = payload["company_id"]
    year = payload["year"]
    scores = payload["scores"]

    # Save individual KPI scores
    total_env, total_soc, total_gov = 0, 0, 0
    weight_env, weight_soc, weight_gov = 0, 0, 0

    for s in scores:
        new_score = esg_scorecard.ESGScore(
            kpi_code=s["kpi_code"],
            normalized_score=s["normalized_score"],
            weighted_score=s["normalized_score"] * s["weight"],
            user_weightage=s["weight"],
            company_id=company_id,
            reporting_period=date(year, 1, 1),
        )
        db.add(new_score)

        # Aggregate by pillar
        kpi = db.query(esg_scorecard.ESGKPI).filter_by(kpi_code=s["kpi_code"]).first()
        if kpi and kpi.pillar == "Environmental":
            total_env += new_score.weighted_score
            weight_env += s["weight"]
        elif kpi and kpi.pillar == "Social":
            total_soc += new_score.weighted_score
            weight_soc += s["weight"]
        elif kpi and kpi.pillar == "Governance":
            total_gov += new_score.weighted_score
            weight_gov += s["weight"]

    # Compute pillar scores
    env_score = total_env / weight_env if weight_env else 0
    soc_score = total_soc / weight_soc if weight_soc else 0
    gov_score = total_gov / weight_gov if weight_gov else 0
    final_score = (env_score * 0.4) + (soc_score * 0.3) + (gov_score * 0.3)

    # Save dashboard
    dashboard = esg_scorecard.ESGDashboard(
        company_id=company_id,
        reporting_period=date(year, 1, 1),
        environmental_score=env_score,
        social_score=soc_score,
        governance_score=gov_score,
        final_esg_score=final_score,
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)

    return {
        "environmental": env_score,
        "social": soc_score,
        "governance": gov_score,
        "final": final_score,
    }
@router.get("/ping")
def ping():
    return {"ok": True}
