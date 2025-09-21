from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import SessionLocal
from backend.models.esg_scorecard import ESGKpi  # model for esg_kpis table

# Router
router = APIRouter(prefix="/kpis", tags=["KPIs"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Pydantic Schema
# -----------------------------
from pydantic import BaseModel

class KpiOut(BaseModel):
    kpi_code: str
    kpi_description: str
    pillar: str
    unit: str
    normalization_method: str
    framework_reference: str
    status: str

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2


# -----------------------------
# CRUD Routes
# -----------------------------

# ✅ List all KPIs
@router.get("/", response_model=List[KpiOut])
def list_kpis(db: Session = Depends(get_db)):
    return db.query(ESGKpi).all()


# ✅ Get KPI by code
@router.get("/{kpi_code}", response_model=KpiOut)
def get_kpi(kpi_code: str, db: Session = Depends(get_db)):
    kpi = db.query(ESGKpi).filter(ESGKpi.kpi_code == kpi_code).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    return kpi
