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
    ScoreOut,
    DashboardOut,
    PillarWeightBase,   # POST input schema
    PillarWeightOut     # GET output schema
)

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
    db_kpi = esg_scorecard.ESGKPI(**kpi.dict())
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
    return db.query(esg_scorecard.ESGKPI).all()


@router.put("/kpis/{kpi_code}")
def update_kpi(kpi_code: str, kpi: KPIUpdate, db: Session = Depends(get_db)):
    db_kpi = db.query(esg_scorecard.ESGKPI).filter_by(kpi_code=kpi_code).first()
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
    db_kpi = db.query(esg_scorecard.ESGKPI).filter_by(kpi_code=kpi_code).first()
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
                "governance": 0
            }
        grouped[key][row.pillar.lower()] = row.pillar_weight

    return list(grouped.values())


@router.post("/pillar-weights", response_model=PillarWeightOut)
def set_pillar_weights(weights: PillarWeightBase, db: Session = Depends(get_db)):
    # Validation: sum must equal 1.0
    total = weights.environmental + weights.social + weights.governance
    if abs(total - 1.0) > 1e-6:
        raise HTTPException(status_code=400, detail="Weights must sum to 1.0")

    # Delete old weights for company + period
    db.query(esg_scorecard.ESGPillarWeight).filter(
        esg_scorecard.ESGPillarWeight.company_id == weights.company_id,
        esg_scorecard.ESGPillarWeight.reporting_period == weights.reporting_period
    ).delete()

    # Insert new set
    db.add_all([
        esg_scorecard.ESGPillarWeight(
            pillar="Environmental",
            pillar_weight=weights.environmental,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period
        ),
        esg_scorecard.ESGPillarWeight(
            pillar="Social",
            pillar_weight=weights.social,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period
        ),
        esg_scorecard.ESGPillarWeight(
            pillar="Governance",
            pillar_weight=weights.governance,
            company_id=weights.company_id,
            reporting_period=weights.reporting_period
        )
    ])
    db.commit()
    return weights


# -----------------------------
# Score Calculation
# -----------------------------
# -----------------------------
# Calculate ESG Scores
# -----------------------------
# -----------------------------
# Calculate ESG Scores
# -----------------------------
@router.post("/calculate")
def calculate_scores(payload: ScoreRequest, db: Session = Depends(get_db)):
    company_id = payload.company_id
    reporting_period = payload.reporting_period

    # 1. Clear out any existing scores for this company/period (avoid duplicates)
    db.query(esg_scorecard.ESGScore).filter(
        esg_scorecard.ESGScore.company_id == company_id,
        esg_scorecard.ESGScore.reporting_period == reporting_period
    ).delete()
    db.commit()

    # 2. Get active KPIs
    kpis = db.query(esg_scorecard.ESGKPI).filter(
        esg_scorecard.ESGKPI.status == "active"
    ).all()
    if not kpis:
        raise HTTPException(status_code=400, detail="No active KPIs found")

    # 3. Get weights for this company/period
    weights = db.query(esg_scorecard.ESGPillarWeight).filter(
        esg_scorecard.ESGPillarWeight.company_id == company_id,
        esg_scorecard.ESGPillarWeight.reporting_period == reporting_period
    ).all()
    if not weights:
        raise HTTPException(status_code=400, detail="No weights found for this company and period")

    # Flatten weights (we expect only one record per company/period)
    weight_map = {w.pillar: w.pillar_weight for w in weights}

    new_scores = []
    pillar_totals = {"Environmental": 0, "Social": 0, "Governance": 0}
    pillar_counts = {"Environmental": 0, "Social": 0, "Governance": 0}

    for kpi in kpis:
        # Mock normalized score (replace with real calculation if available)
        normalized = 70 if kpi.pillar == "Environmental" else (80 if kpi.pillar == "Social" else 90)

        user_weightage = weight_map.get(kpi.pillar, 0)
        weighted = normalized * user_weightage

        score = esg_scorecard.ESGScore(
            kpi_code=kpi.kpi_code,
            user_weightage=user_weightage,
            normalized_score=normalized,
            weighted_score=weighted,
            company_id=company_id,
            reporting_period=reporting_period,
        )
        new_scores.append(score)

        pillar_totals[kpi.pillar] += weighted
        pillar_counts[kpi.pillar] += 1

    # 4. Insert fresh scores
    db.add_all(new_scores)
    db.commit()

    # 5. Compute pillar-level averages
    env_score = pillar_totals["Environmental"] / pillar_counts["Environmental"] if pillar_counts["Environmental"] else 0
    soc_score = pillar_totals["Social"] / pillar_counts["Social"] if pillar_counts["Social"] else 0
    gov_score = pillar_totals["Governance"] / pillar_counts["Governance"] if pillar_counts["Governance"] else 0

    final_esg_score = env_score + soc_score + gov_score

    # 6. Upsert dashboard record
    existing_dashboard = db.query(esg_scorecard.ESGDashboard).filter(
        esg_scorecard.ESGDashboard.company_id == company_id,
        esg_scorecard.ESGDashboard.reporting_period == reporting_period
    ).first()

    if existing_dashboard:
        existing_dashboard.environmental_score = env_score
        existing_dashboard.social_score = soc_score
        existing_dashboard.governance_score = gov_score
        existing_dashboard.final_esg_score = final_esg_score
    else:
        dashboard_entry = esg_scorecard.ESGDashboard(
            company_id=company_id,
            reporting_period=reporting_period,
            environmental_score=env_score,
            social_score=soc_score,
            governance_score=gov_score,
            final_esg_score=final_esg_score,
        )
        db.add(dashboard_entry)

    db.commit()

    return {
        "message": "Scores calculated successfully",
        "company_id": company_id,
        "reporting_period": reporting_period,
        "environmental": env_score,
        "social": soc_score,
        "governance": gov_score,
        "final_score": final_esg_score,
    }
