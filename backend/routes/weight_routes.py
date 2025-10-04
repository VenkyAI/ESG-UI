from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from backend.database import SessionLocal
from backend.models.esg_scorecard import ESGKpiWeight, ESGKpi, ESGPillarWeight

router = APIRouter(prefix="/weights", tags=["Weights"])


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
# Schemas
# -----------------------------
class KpiWeightIn(BaseModel):
    company_id: int
    reporting_period: Optional[date] = None  # now optional
    kpi_code: str
    weight: float


class KpiWeightOut(BaseModel):
    kpi_code: str
    kpi_description: str
    pillar: str
    weight: float | None

    class Config:
        from_attributes = True


class PillarWeightIn(BaseModel):
    company_id: int
    reporting_period: Optional[date] = None  # now optional
    pillar: str
    pillar_weight: float


class PillarWeightOut(BaseModel):
    pillar: str
    pillar_weight: float | None

    class Config:
        from_attributes = True


# -----------------------------
# KPI Weight Routes
# -----------------------------
@router.post("/kpis")
def save_kpi_weights(weights: List[KpiWeightIn], db: Session = Depends(get_db)):
    if not weights:
        raise HTTPException(status_code=400, detail="No KPI weights provided")

    company_id = weights[0].company_id
    period = weights[0].reporting_period or date.today()

    # 1. Validate pillar totals
    pillar_totals: dict[str, float] = {}
    for w in weights:
        pillar = db.query(ESGKpi.pillar).filter(ESGKpi.kpi_code == w.kpi_code).scalar()
        if not pillar:
            raise HTTPException(status_code=400, detail=f"KPI code {w.kpi_code} not found")
        pillar_totals.setdefault(pillar, 0.0)
        pillar_totals[pillar] += float(w.weight)

    for pillar, total in pillar_totals.items():
        if abs(total - 100.0) > 1e-6:
            raise HTTPException(
                status_code=400,
                detail=f"KPI weights for pillar {pillar} must sum to 100 (got {total})",
            )

    # 2. Mark old weights as not current
    db.query(ESGKpiWeight).filter(
        ESGKpiWeight.company_id == company_id,
        ESGKpiWeight.reporting_period == period,
        ESGKpiWeight.is_current == True,
    ).update({ESGKpiWeight.is_current: False}, synchronize_session=False)

    # 3. Insert new weights as current
    for w in weights:
        db.add(
            ESGKpiWeight(
                company_id=w.company_id,
                reporting_period=w.reporting_period or period,
                kpi_code=w.kpi_code,
                weight=float(w.weight),
                is_current=True,
            )
        )
    db.commit()

    return {
        "status": "ok",
        "inserted": len(weights),
        "company_id": company_id,
        "reporting_period": str(period),
    }


@router.get("/kpis", response_model=List[KpiWeightOut])
def get_kpi_weights(
    company_id: int = 1,
    reporting_period: date = date.today(),
    db: Session = Depends(get_db),
):
    kpis = db.query(ESGKpi).all()
    if not kpis:
        raise HTTPException(status_code=404, detail="No KPIs configured")

    weights = {
        w.kpi_code: float(w.weight)
        for w in db.query(ESGKpiWeight)
        .filter(
            ESGKpiWeight.company_id == company_id,
            ESGKpiWeight.reporting_period == reporting_period,
            ESGKpiWeight.is_current == True,
        )
        .all()
    }

    return [
        KpiWeightOut(
            kpi_code=k.kpi_code,
            kpi_description=k.kpi_description,
            pillar=k.pillar,
            weight=weights.get(k.kpi_code, 0.0),
        )
        for k in kpis
    ]


# -----------------------------
# Pillar Weight Routes
# -----------------------------
@router.post("/pillars")
def save_pillar_weights(weights: List[PillarWeightIn], db: Session = Depends(get_db)):
    if not weights:
        raise HTTPException(status_code=400, detail="No pillar weights provided")

    company_id = weights[0].company_id
    period = weights[0].reporting_period or date.today()

    # 1. Validate total = 100
    total = sum(float(w.pillar_weight) for w in weights)
    if abs(total - 100.0) > 1e-6:
        raise HTTPException(
            status_code=400, detail=f"Pillar weights must sum to 100 (got {total})"
        )

    # 2. Mark existing as not current
    db.query(ESGPillarWeight).filter(
        ESGPillarWeight.company_id == company_id,
        ESGPillarWeight.reporting_period == period,
        ESGPillarWeight.is_current == True,
    ).update({"is_current": False}, synchronize_session=False)

    # 3. Insert new as current
    for w in weights:
        db.add(
            ESGPillarWeight(
                company_id=w.company_id,
                reporting_period=w.reporting_period or period,
                pillar=w.pillar,
                pillar_weight=float(w.pillar_weight),
                is_current=True,
            )
        )

    db.commit()

    return {
        "status": "ok",
        "inserted": len(weights),
        "company_id": company_id,
        "reporting_period": str(period),
    }


@router.get("/pillars", response_model=List[PillarWeightOut])
def get_pillar_weights(
    company_id: int = 1,
    reporting_period: date = date.today(),
    db: Session = Depends(get_db),
):
    pillars = ["Environmental", "Social", "Governance"]

    weights = {
        w.pillar: float(w.pillar_weight)
        for w in db.query(ESGPillarWeight)
        .filter(
            ESGPillarWeight.company_id == company_id,
            ESGPillarWeight.reporting_period == reporting_period,
        )
        .all()
    }

    return [PillarWeightOut(pillar=p, pillar_weight=weights.get(p, 0.0)) for p in pillars]
