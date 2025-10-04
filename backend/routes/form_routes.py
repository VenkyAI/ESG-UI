from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from typing import List

from backend.database import get_db
from backend.models.esg_scorecard import EsgFormSubmission
from backend.schemas.form_submission import FormSubmissionIn, FormSubmissionOut
from backend.services.input_to_kpi_mapper import map_inputs_to_kpis

router = APIRouter(prefix="/form-submissions", tags=["form-submissions"])


# ---------------------------------------------------------------------
# Helper: Upsert a single record (re-usable for both batch & single)
# ---------------------------------------------------------------------
def _upsert_single(req: FormSubmissionIn, db: Session):
    company_id = req.company_id
    reporting_period = req.reporting_period
    form_field = req.form_field
    field_value = req.field_value
    is_kpi = req.is_kpi
    methodology = req.methodology

    # ✅ Validation: block negative numeric values
    if field_value is not None:
        try:
            val = float(field_value)
            if val < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Negative values are not allowed for field: {form_field}"
                )
        except ValueError:
            # Non-numeric values (bool, text, etc.) are fine
            pass

    # Mark previous as not current
    db.query(EsgFormSubmission).filter_by(
        company_id=company_id,
        form_field=form_field,
        reporting_period=reporting_period
    ).update({"is_current": False}, synchronize_session=False)

    # Insert or update
    stmt = insert(EsgFormSubmission).values(
        company_id=company_id,
        reporting_period=reporting_period,
        form_field=form_field,
        field_value=field_value,
        is_current=True,
        is_kpi=is_kpi,
        methodology=methodology,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["company_id", "reporting_period", "form_field"],
        set_={
            "field_value": field_value,
            "updated_at": func.now(),
            "is_current": True,
            "is_kpi": is_kpi,
            "methodology": methodology,
        }
    )
    db.execute(stmt)
    db.commit()

    # ✅ Auto-map inputs → KPIs
    if methodology == "input":
        try:
            map_inputs_to_kpis(db, company_id, reporting_period)
        except Exception as e:
            print(f"[WARN] Input→KPI mapping failed: {e}")

    saved = db.query(EsgFormSubmission).filter_by(
        company_id=company_id, reporting_period=reporting_period, form_field=form_field
    ).first()
    return saved


# ---------------------------------------------------------------------
# Create or update a single submission (legacy-compatible)
# ---------------------------------------------------------------------
@router.post("/", response_model=FormSubmissionOut)
def upsert_form_submission(req: FormSubmissionIn, db: Session = Depends(get_db)):
    return _upsert_single(req, db)


# ---------------------------------------------------------------------
# NEW: Batch upsert route — accepts a list of FormSubmissionIn
# ---------------------------------------------------------------------
@router.post("/batch", response_model=List[FormSubmissionOut])
def upsert_form_submissions(reqs: List[FormSubmissionIn], db: Session = Depends(get_db)):
    if not reqs:
        raise HTTPException(status_code=400, detail="Empty submission list.")

    results = []
    for req in reqs:
        result = _upsert_single(req, db)
        if result:
            results.append(result)
    return results


# ---------------------------------------------------------------------
# Fetch current ESG snapshot
# ---------------------------------------------------------------------
@router.get("/current", response_model=List[FormSubmissionOut])
def get_current(
    company_id: int,
    methodology: str | None = Query(None, description="input or kpi"),
    db: Session = Depends(get_db)
):
    query = db.query(EsgFormSubmission).filter_by(company_id=company_id, is_current=True)
    if methodology:
        query = query.filter(EsgFormSubmission.methodology == methodology)

    submissions = query.all()
    if not submissions:
        raise HTTPException(status_code=404, detail="No current submissions found")
    return submissions


# ---------------------------------------------------------------------
# Fetch historic ESG records (no date range — use is_current=False)
# ---------------------------------------------------------------------
@router.get("/historic", response_model=List[FormSubmissionOut])
def get_historic(
    company_id: int,
    methodology: str | None = Query(None, description="input or kpi"),
    db: Session = Depends(get_db)
):
    query = db.query(EsgFormSubmission).filter(
        EsgFormSubmission.company_id == company_id,
        EsgFormSubmission.is_current == False
    )
    if methodology:
        query = query.filter(EsgFormSubmission.methodology == methodology)

    submissions = query.order_by(
        EsgFormSubmission.reporting_period.desc(),
        EsgFormSubmission.updated_at.desc()
    ).all()

    if not submissions:
        raise HTTPException(status_code=404, detail="No historic submissions found")
    return submissions
