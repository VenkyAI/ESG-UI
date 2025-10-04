from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from backend.database import SessionLocal
from backend.models import esg_scorecard
from backend.schemas.dashboard_schemas import (
    KPIBase,
    KPIOut,
    KPIUpdate,
    ScoreRequest,
    PillarWeightBase,
    PillarWeightOut,
)
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
# KPI Endpoints
# -----------------------------
@router.post("/kpis", response_model=KPIOut)
def create_kpi(kpi: KPIBase, db: Session = Depends(get_db)):
    db_kpi = esg_scorecard.ESGKpi(**kpi.dict())
    db.add(db_kpi)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Insert failed: {str(e)}")
    db.refresh(db_kpi)
    return db_kpi


@router.get("/kpis", response_model=list[KPIOut])
def list_kpis(db: Session = Depends(get_db)):
    return db.query(esg_scorecard.ESGKpi).all()


@router.put("/kpis/{kpi_code}")
def update_kpi(kpi_code: str, kpi: KPIUpdate, db: Session = Depends(get_db)):
    db_kpi = db.query(esg_scorecard.ESGKpi).filter_by(kpi_code=kpi_code).first()
    if not db_kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    for field, value in kpi.dict(exclude_unset=True).items():
        setattr(db_kpi, field, value)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

    db.refresh(db_kpi)
    return {"message": "KPI updated successfully", "kpi_code": db_kpi.kpi_code}


@router.delete("/kpis/{kpi_code}")
def deactivate_kpi(kpi_code: str, db: Session = Depends(get_db)):
    db_kpi = db.query(esg_scorecard.ESGKpi).filter_by(kpi_code=kpi_code).first()
    if not db_kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    db_kpi.status = "inactive"

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Deactivate failed: {str(e)}")

    return {"message": "KPI deactivated", "kpi_code": db_kpi.kpi_code}


# -----------------------------
# Pillar Weights Endpoints
# -----------------------------
@router.get("/pillar-weights", response_model=list[PillarWeightOut])
def list_pillar_weights(db: Session = Depends(get_db)):
    rows = db.query(esg_scorecard.ESGPillarWeight).all()
    if not rows:
        return []

    grouped = {}
    for row in rows:
        key = (row.company_id, row.reporting_period)
        if key not in grouped:
            grouped[key] = {
                "company_id": row.company_id,
                "reporting_period": row.reporting_period,
                "environmental": 0,
                "social": 0,
                "governance": 0,
            }
        # convert back to percentage for frontend
        grouped[key][row.pillar.lower()] = float(row.pillar_weight) * 100

    return list(grouped.values())


@router.post("/pillar-weights", response_model=PillarWeightOut)
def set_pillar_weights(weights: PillarWeightBase, db: Session = Depends(get_db)):
    # ✅ Validation: sum must equal 100 (frontend sends percentages)
    total = weights.environmental + weights.social + weights.governance
    if abs(total - 100.0) > 1e-6:
        raise HTTPException(status_code=400, detail="Weights must sum to 100")

    # Delete old weights for company + period
    db.query(esg_scorecard.ESGPillarWeight).filter(
        esg_scorecard.ESGPillarWeight.company_id == weights.company_id,
        esg_scorecard.ESGPillarWeight.reporting_period == weights.reporting_period,
    ).delete()

    # Insert new set (store internally as fractions)
    db.add_all([
        esg_scorecard.ESGPillarWeight(
            pillar="Environmental",
            pillar_weight=weights.environmental / 100.0,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period,
        ),
        esg_scorecard.ESGPillarWeight(
            pillar="Social",
            pillar_weight=weights.social / 100.0,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period,
        ),
        esg_scorecard.ESGPillarWeight(
            pillar="Governance",
            pillar_weight=weights.governance / 100.0,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period,
        ),
    ])
    db.commit()
    return weights


# -----------------------------
# Score Calculation (Legacy)
# -----------------------------
@router.post("/calculate")
def calculate_scores(payload: ScoreRequest, db: Session = Depends(get_db)):
    """
    ⚠️ Legacy method.
    Real ESG computation is handled by /dashboard/scores (see below).
    This remains for backward compatibility but does not perform real scoring.
    """
    return {
        "message": "Deprecated – use /dashboard/scores instead",
        "company_id": payload.company_id,
        "reporting_period": payload.reporting_period,
        "environmental": 0,
        "social": 0,
        "governance": 0,
        "final_score": 0,
    }


# -----------------------------
# ESG Dashboard Scores (New)
# -----------------------------
@router.get("/scores/{company_id}/{reporting_period}", response_model=dict)
def get_scores(company_id: int, reporting_period: date, db: Session = Depends(get_db)):
    """
    Run ESG engine and return pillar + final scores for the dashboard.
    """
    results = run_esg_engine(company_id=company_id, reporting_period=reporting_period, db=db)

    return {
        "company_id": results["company_id"],
        "reporting_period": str(results["reporting_period"]),
        "pillar_scores": results["pillar_scores"],
        "final_score": results["final_score"],
    }
