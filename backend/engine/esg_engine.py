from sqlalchemy.orm import Session
from datetime import date
from backend.models.esg_scorecard import ESGKpi, ESGScore, ESGDashboard, ESGPillarWeight


# -----------------------------
# Normalization helper
# -----------------------------
def normalize_value(value: float, method: str) -> float:
    """Normalize raw values according to KPI normalization method."""
    if value is None:
        return 0.0

    try:
        value = float(value)
    except Exception:
        return 0.0

    if not method:
        return value

    method = method.lower()

    if method == "percentage":
        return value / 100.0
    elif method == "inverse":
        return 1.0 / value if value else 0.0
    elif method == "absolute":
        return value / 1000.0
    elif method == "index":
        return value / 100.0
    else:
        return value


# -----------------------------
# ESG Engine main
# -----------------------------
def run_esg_engine(db: Session, company_id: int, reporting_period: date, raw_data: dict):
    """
    Run ESG scoring engine using pillar weights.
    raw_data: dict of {kpi_code: value}, e.g.
        { "SOC-01": 45, "ENV-TEST1": 1000 }
    """

    pillar_scores = {"Environmental": [], "Social": [], "Governance": []}

    # Iterate over KPIs
    kpis = db.query(ESGKpi).all()
    for kpi in kpis:
        raw_value = raw_data.get(kpi.kpi_code)
        if raw_value is None:
            continue

        normalized = normalize_value(raw_value, kpi.normalization_method)

        score = ESGScore(
            kpi_code=kpi.kpi_code,
            user_weightage=1,
            normalized_score=normalized,
            weighted_score=normalized,
            company_id=company_id,
            reporting_period=reporting_period,
        )
        db.add(score)

        if kpi.pillar in pillar_scores:
            pillar_scores[kpi.pillar].append(normalized)

    db.commit()

    # -----------------------------
    # Get pillar weights
    # -----------------------------
    weights = db.query(ESGPillarWeight).filter(
        ESGPillarWeight.company_id == company_id,
        ESGPillarWeight.reporting_period == reporting_period
    ).all()

    # If no exact match, get the latest available weights for company
    if not weights:
        weights = (
            db.query(ESGPillarWeight)
            .filter(ESGPillarWeight.company_id == company_id)
            .order_by(ESGPillarWeight.reporting_period.desc())
            .all()
        )

    weight_map = {w.pillar: w.pillar_weight for w in weights}

    def avg(values):
        return sum(values) / len(values) if values else 0.0

    env = avg(pillar_scores["Environmental"])
    soc = avg(pillar_scores["Social"])
    gov = avg(pillar_scores["Governance"])

    total_weight = sum(weight_map.values()) if weight_map else 0
    if total_weight > 0:
        final = (
            env * weight_map.get("Environmental", 0) +
            soc * weight_map.get("Social", 0) +
            gov * weight_map.get("Governance", 0)
        ) / total_weight
    else:
        final = (env + soc + gov) / 3.0

    # -----------------------------
    # Save dashboard record
    # -----------------------------
    dashboard = ESGDashboard(
        environmental_score=env,
        social_score=soc,
        governance_score=gov,
        final_esg_score=final,
        company_id=company_id,
        reporting_period=reporting_period,
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)

    return dashboard
