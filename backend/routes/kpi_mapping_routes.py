from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import SessionLocal
from backend.models.esg_scorecard import ESGKpiMapping
from backend.schemas.kpi_mapping_schemas import KpiMappingIn, KpiMappingOut

# Router
router = APIRouter(prefix="/kpi-mappings", tags=["KPI Mappings"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# CRUD Routes
# -----------------------------

# ✅ Create new mapping
@router.post("/", response_model=KpiMappingOut)
def create_mapping(mapping: KpiMappingIn, db: Session = Depends(get_db)):
    db_mapping = ESGKpiMapping(
        form_field=mapping.form_field,
        kpi_code=mapping.kpi_code,
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping


# ✅ List all mappings
@router.get("/", response_model=List[KpiMappingOut])
def list_mappings(db: Session = Depends(get_db)):
    return db.query(ESGKpiMapping).all()


# ✅ Get mapping by ID
@router.get("/{mapping_id}", response_model=KpiMappingOut)
def get_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mapping


# ✅ Update mapping
@router.put("/{mapping_id}", response_model=KpiMappingOut)
def update_mapping(mapping_id: int, updated: KpiMappingIn, db: Session = Depends(get_db)):
    mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    mapping.form_field = updated.form_field
    mapping.kpi_code = updated.kpi_code

    db.commit()
    db.refresh(mapping)
    return mapping


# ✅ Delete mapping
@router.delete("/{mapping_id}")
def delete_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted successfully", "id": mapping_id}
