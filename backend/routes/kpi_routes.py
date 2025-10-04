from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import SessionLocal
from backend.models.esg_scorecard import ESGKpi  # model for esg_kpis table
from pydantic import BaseModel

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
# Pydantic Schemas
# -----------------------------
class KpiIn(BaseModel):
    kpi_code: str
    kpi_description: str
    pillar: str
    unit: str
    normalization_method: str
    framework_reference: str
    status: str = "active"  # default if not passed


class KpiOut(KpiIn):
    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2


# -----------------------------
# CRUD Routes
# -----------------------------

# ✅ Create new KPI
@router.post("/", response_model=KpiOut)
def create_kpi(kpi: KpiIn, db: Session = Depends(get_db)):
    # check for duplicate KPI code
    existing = db.query(ESGKpi).filter(ESGKpi.kpi_code == kpi.kpi_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="KPI code already exists")

    db_kpi = ESGKpi(
        kpi_code=kpi.kpi_code,
        kpi_description=kpi.kpi_description,
        pillar=kpi.pillar,
        unit=kpi.unit,
        normalization_method=kpi.normalization_method,
        framework_reference=kpi.framework_reference,
        status=kpi.status,
    )
    db.add(db_kpi)
    db.commit()
    db.refresh(db_kpi)
    return db_kpi


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


# ✅ Update KPI
@router.put("/{kpi_code}", response_model=KpiOut)
def update_kpi(kpi_code: str, updated: KpiIn, db: Session = Depends(get_db)):
    kpi = db.query(ESGKpi).filter(ESGKpi.kpi_code == kpi_code).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    kpi.kpi_description = updated.kpi_description
    kpi.pillar = updated.pillar
    kpi.unit = updated.unit
    kpi.normalization_method = updated.normalization_method
    kpi.framework_reference = updated.framework_reference
    kpi.status = updated.status

    db.commit()
    db.refresh(kpi)
    return kpi


# ✅ Delete KPI (Hard delete only)
@router.delete("/{kpi_code}")
def delete_kpi(kpi_code: str, db: Session = Depends(get_db)):
    kpi = db.query(ESGKpi).filter(ESGKpi.kpi_code == kpi_code).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")

    db.delete(kpi)
    db.commit()
    return {"message": f"KPI {kpi_code} deleted successfully"}
