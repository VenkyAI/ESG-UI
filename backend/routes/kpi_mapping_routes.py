from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from backend.database import SessionLocal
from backend.models.esg_scorecard import ESGKpiMapping
from backend.schemas.kpi_mapping_schemas import KpiMappingIn, KpiMappingOut, AggregationMethod
from sqlalchemy import text


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
    # Guardrails
    if not mapping.form_field:
        raise HTTPException(status_code=400, detail="Form field cannot be empty")
    if not mapping.kpi_code:
        raise HTTPException(status_code=400, detail="KPI code cannot be empty")

    # Step 1: mark old mapping inactive (if exists for same form_field & period)
    db.query(ESGKpiMapping).filter(
        ESGKpiMapping.form_field == mapping.form_field,
        ESGKpiMapping.reporting_period == mapping.reporting_period,
        ESGKpiMapping.is_current == True,
    ).update({"is_current": False}, synchronize_session=False)

    # Step 2: insert new mapping as current
    db_mapping = ESGKpiMapping(
        form_field=mapping.form_field,
        kpi_code=mapping.kpi_code,
        aggregation_method=(mapping.aggregation_method or AggregationMethod.SUM).value,
        reporting_period=mapping.reporting_period,
        is_current=True,
        updated_at=datetime.utcnow(),
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping


# ✅ List all mappings
@router.get("/", response_model=List[KpiMappingOut])
def list_mappings(db: Session = Depends(get_db)):
    return db.query(ESGKpiMapping).all()


# ✅ List distinct form fields from submissions (for dropdowns)
# Moved ABOVE dynamic routes to avoid collision
@router.get("/form-fields", response_model=List[str])
def list_form_fields(db: Session = Depends(get_db)):
    results = db.execute(
        text(
            "SELECT DISTINCT form_field "
            "FROM esg_form_submissions "
            "WHERE is_kpi = TRUE AND form_field IS NOT NULL "
            "ORDER BY form_field"
        )
    ).fetchall()
    return [str(r[0]) for r in results if r[0] is not None]


# ✅ Get mapping by ID
@router.get("/{mapping_id}", response_model=KpiMappingOut)
def get_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mapping


# ✅ Get current mappings for a reporting period
@router.get("/current/{reporting_period}", response_model=List[KpiMappingOut])
def get_current_mappings(reporting_period: str, db: Session = Depends(get_db)):
    return (
        db.query(ESGKpiMapping)
        .filter(
            ESGKpiMapping.reporting_period == reporting_period,
            ESGKpiMapping.is_current == True,
        )
        .all()
    )


# ✅ Get mapping history for a form_field
@router.get("/history/{form_field}", response_model=List[KpiMappingOut])
def get_mapping_history(form_field: str, db: Session = Depends(get_db)):
    return (
        db.query(ESGKpiMapping)
        .filter(ESGKpiMapping.form_field == form_field)
        .order_by(ESGKpiMapping.updated_at.desc())
        .all()
    )


# ✅ Update mapping (preserve history)
@router.put("/{mapping_id}", response_model=KpiMappingOut)
def update_mapping(mapping_id: int, updated: KpiMappingIn, db: Session = Depends(get_db)):
    # Guardrails
    if not updated.form_field:
        raise HTTPException(status_code=400, detail="Form field cannot be empty")
    if not updated.kpi_code:
        raise HTTPException(status_code=400, detail="KPI code cannot be empty")

    old_mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not old_mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    # Step 1: mark old mapping inactive
    old_mapping.is_current = False
    db.commit()

    # Step 2: insert new mapping as current
    new_mapping = ESGKpiMapping(
        form_field=updated.form_field,
        kpi_code=updated.kpi_code,
        aggregation_method=(
            updated.aggregation_method or old_mapping.aggregation_method or AggregationMethod.SUM
        ).value,
        reporting_period=updated.reporting_period,
        is_current=True,
        updated_at=datetime.utcnow(),
    )
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping


# ✅ Delete mapping
@router.delete("/{mapping_id}")
def delete_mapping(mapping_id: int, db: Session = Depends(get_db)):
    mapping = db.query(ESGKpiMapping).filter(ESGKpiMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted successfully", "id": mapping_id}
