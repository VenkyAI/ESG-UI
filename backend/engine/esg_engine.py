# backend/engine/esg_engine.py

from sqlalchemy.orm import Session
from backend.models import esg_scorecard


def normalize_value(value, method: str):
    """
    Normalize a KPI raw value into [0, 100] based on method.
    """
    try:
        v = float(value) if value is not None else 0.0
    except Exception:
        v = 0.0

    method = (method or "Absolute").lower()

    if method == "percentage":
        # values like 0.7 → 70, 70 → 70
        return max(0.0, min(100.0, v * 100 if v <= 1 else v))

    elif method == "boolean":
        return 100.0 if str(value).lower() in ("true", "yes", "1") else 0.0

    elif method == "inverse":
        # lower is better (e.g. emissions, incidents)
        max_threshold = 1000.0  # TODO: make configurable later
        return max(0.0, min(100.0, 100.0 - (v / max_threshold * 100.0)))

    else:  # Absolute (direct scoring)
        return max(0.0, min(100.0, v))


def run_esg_engine(company_id: int, reporting_period, db: Session):
    """
    Run ESG scoring engine:
      - Normalize each KPI value into [0,100]
      - Overwrite existing scores for same company+period
      - Save raw scores into esg_raw_scores
      - Aggregate pillar scores
      - Save final ESG into esg_final_scores
      - Return results as dict
    """

    # -----------------------------
    # 1. Fetch form submissions
    # -----------------------------
    submissions = db.query(esg_scorecard.EsgFormSubmission).filter_by(
        company_id=company_id,
        reporting_period=reporting_period,
        is_current=True
    ).all()

    if not submissions:
        return {
            "company_id": company_id,
            "reporting_period": reporting_period,
            "pillar_scores": {"Environmental": 0.0, "Social": 0.0, "Governance": 0.0},
            "final_score": 0.0,
        }

    # -----------------------------
    # 2. Clear old scores for this reporting period
    # -----------------------------
    db.query(esg_scorecard.ESGRawScore).filter_by(
        company_id=company_id,
        reporting_period=reporting_period
    ).delete()

    db.query(esg_scorecard.ESGFinalScore).filter_by(
        company_id=company_id,
        reporting_period=reporting_period
    ).delete()

    db.commit()  # apply deletes before inserting fresh rows

    # -----------------------------
    # 3. Load mappings, weights
    # -----------------------------
    mappings = {
        m.form_field: {"kpi_code": m.kpi_code, "aggregation_method": m.aggregation_method or "SUM"}
        for m in db.query(esg_scorecard.ESGKpiMapping).filter_by(is_current=True).all()
    }

    kpi_weights = {
        w.kpi_code: float(w.weight)
        for w in db.query(esg_scorecard.ESGKpiWeight).filter_by(
            company_id=company_id,
            is_current=True
        ).all()
    }

    pillar_weights = {
        w.pillar: float(w.pillar_weight)
        for w in db.query(esg_scorecard.ESGPillarWeight).filter_by(
            company_id=company_id,
            is_current=True
        ).all()
    }

    # -----------------------------
    # 4. Group submissions by form_field and aggregate
    # -----------------------------
    grouped = {}
    for sub in submissions:
        ff = sub.form_field
        if ff not in mappings:
            continue
        grouped.setdefault(ff, []).append(sub)

    # -----------------------------
    # 5. Calculate KPI scores
    # -----------------------------
    pillar_scores = {"Environmental": [], "Social": [], "Governance": []}

    for form_field, subs in grouped.items():
        kpi_info = mappings[form_field]
        kpi_code = kpi_info["kpi_code"]
        agg_method = (kpi_info["aggregation_method"] or "SUM").upper()

        kpi = db.query(esg_scorecard.ESGKpi).filter_by(kpi_code=kpi_code).first()
        if not kpi:
            continue

        # Apply aggregation
        values = []
        for s in subs:
            try:
                values.append(float(s.field_value))
            except Exception:
                # handle booleans/strings gracefully
                if str(s.field_value).lower() in ("true", "yes", "disclosed"):
                    values.append(1.0)
                else:
                    values.append(0.0)

        if not values:
            continue

        if agg_method == "SUM":
            agg_value = sum(values)
        elif agg_method == "AVG":
            agg_value = sum(values) / len(values)
        elif agg_method == "LATEST":
            latest_sub = max(subs, key=lambda s: s.updated_at or s.created_at)
            try:
                agg_value = float(latest_sub.field_value)
            except Exception:
                agg_value = 0.0
        else:
            agg_value = values[0]  # fallback

        # Weight
        weight = kpi_weights.get(kpi_code, 1.0)

        # Normalize and weight
        normalized_score = normalize_value(agg_value, kpi.normalization_method)
        weighted_score = normalized_score * (weight / 100.0)

        # Save raw KPI score
        raw_score = esg_scorecard.ESGRawScore(
            company_id=company_id,
            reporting_period=reporting_period,
            kpi_code=kpi_code,
            user_weightage=weight,
            normalized_score=normalized_score,
            weighted_score=weighted_score,
        )
        db.add(raw_score)

        # Contribute to pillar aggregation
        pillar_scores[kpi.pillar].append(weighted_score)

    # -----------------------------
    # 6. Aggregate pillar scores
    # -----------------------------
    pillar_results = {}
    for pillar, scores in pillar_scores.items():
        pillar_results[pillar] = sum(scores) / len(scores) if scores else 0.0

    # -----------------------------
    # 7. Compute final ESG score
    # -----------------------------
    if pillar_weights:
        total_weight = sum(pillar_weights.values())
        final_score = (
            sum(
                pillar_results.get(p, 0.0) * pillar_weights.get(p, 0.0)
                for p in pillar_results
            ) / total_weight
            if total_weight > 0 else 0.0
        )
    else:
        final_score = sum(pillar_results.values()) / 3.0

    # -----------------------------
    # 8. Save final ESG
    # -----------------------------
    final_row = esg_scorecard.ESGFinalScore(
        company_id=company_id,
        reporting_period=reporting_period,
        environmental_score=pillar_results.get("Environmental", 0.0),
        social_score=pillar_results.get("Social", 0.0),
        governance_score=pillar_results.get("Governance", 0.0),
        final_esg_score=final_score,
    )
    db.add(final_row)

    db.commit()

    return {
        "company_id": company_id,
        "reporting_period": reporting_period,
        "pillar_scores": pillar_results,
        "final_score": final_score,
    }
