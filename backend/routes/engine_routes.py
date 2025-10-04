from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models import esg_scorecard
from backend.engine import esg_engine
from backend.schemas.engine_schemas import EngineRunRequest, EngineRunResponse

router = APIRouter(prefix="/engine", tags=["engine"])


@router.get("/weights-check")
def check_weights(company_id: int, reporting_period: str, db: Session = Depends(get_db)):
    """
    Verify pillar weights sum to 100% and each pillar’s KPI weights also sum to 100%.
    """
    period = datetime.strptime(reporting_period, "%Y-%m-%d").date()

    pillar_weights = (
        db.query(esg_scorecard.ESGPillarWeight)
        .filter_by(company_id=company_id, reporting_period=period)
        .all()
    )
    kpi_weights = (
        db.query(esg_scorecard.ESGKpiWeight)
        .filter_by(company_id=company_id, reporting_period=period)
        .all()
    )

    pillar_total = sum(float(pw.pillar_weight) for pw in pillar_weights)
    pillar_sum_ok = abs(pillar_total - 100.0) < 0.001

    kpi_totals = {}
    kpi_sum_ok = True
    for pillar in {pw.pillar for pw in pillar_weights}:
        pillar_kpis = [
            kw for kw in kpi_weights if kw.kpi_code.startswith(pillar[:3].upper())
        ]
        total = sum(float(kw.weight) for kw in pillar_kpis)
        kpi_totals[pillar] = total
        if abs(total - 100.0) > 0.001:
            kpi_sum_ok = False

    return {
        "pillar_weights": {"total": pillar_total, "details": {pw.pillar: float(pw.pillar_weight) for pw in pillar_weights}},
        "kpi_weights": {"totals": kpi_totals},
        "validations": {"pillar_sum_ok": pillar_sum_ok, "kpi_sum_ok": kpi_sum_ok},
    }


@router.post("/run", response_model=EngineRunResponse)
def run_engine(req: EngineRunRequest, db: Session = Depends(get_db)):
    """
    Run ESG Engine for a company & reporting period (factual version).
    Persists results to esg_scores & esg_dashboard.
    """
    period = datetime.strptime(req.reporting_period, "%Y-%m-%d").date()

    scores = esg_engine.run_esg_engine(req.company_id, period, db)

    # ✅ Fix: unpack results directly into EngineRunResponse
    return EngineRunResponse(**scores)


@router.get("/score")
def calculate_score(company_id: int, reporting_period: str, db: Session = Depends(get_db)):
    """
    Calculate ESG scores directly (GET variant).
    """
    period = datetime.strptime(reporting_period, "%Y-%m-%d").date()
    scores = esg_engine.run_esg_engine(company_id, period, db)
    return {"dashboard": scores}
