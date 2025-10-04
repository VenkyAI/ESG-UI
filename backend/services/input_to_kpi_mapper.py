from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from backend.models.esg_scorecard import EsgFormSubmission

# Extended emission factors (kg CO2 per unit)
EMISSION_FACTORS = {
    "petrol_consumption": 2.31,        # kg CO2 per litre
    "diesel_consumption": 2.68,        # kg CO2 per litre
    "electricity_consumption": 0.82,   # kg CO2 per kWh
    "business_travel_distance": 0.15,  # kg CO2 per km
    "employee_commuting_distance": 0.12,  # kg CO2 per km
    # Add more fuels if schema expands
}


def map_inputs_to_kpis(db: Session, company_id: int, reporting_period: str):
    """
    Convert ESG Input methodology records into KPI methodology records.
    Ensures that the ESG Engine always has KPI data available.

    Rules:
    - User-entered KPI always overrides computed one
    - Scope 1 = Petrol + Diesel
    - Scope 2 = Electricity
    - Scope 3 = Business travel + commuting
    - Renewable ratio = Renewable ÷ Total (or renewable ÷ (renewable+nonrenewable))
    - Water ratios = Recycled ÷ Withdrawal, Discharged ÷ Withdrawal
    - Waste ratio = Disposed ÷ Generated
    """

    # Fetch all current input records
    inputs = db.query(EsgFormSubmission).filter_by(
        company_id=company_id,
        reporting_period=reporting_period,
        is_current=True,
        methodology="input"
    ).all()

    if not inputs:
        return {}

    # Convert to dict { field_name: numeric_value }
    input_data = {}
    for i in inputs:
        try:
            input_data[i.form_field] = float(i.field_value)
        except (ValueError, TypeError):
            continue

    kpis: dict[str, float] = {}

    # --- Scope 1 emissions: petrol + diesel ---
    scope1 = 0.0
    for f in ["petrol_consumption", "diesel_consumption"]:
        if f in input_data:
            scope1 += input_data[f] * EMISSION_FACTORS[f]
    if scope1 > 0:
        kpis["scope1_emissions"] = scope1

    # --- Scope 2 emissions: electricity ---
    if "electricity_consumption" in input_data:
        kpis["scope2_emissions"] = (
            input_data["electricity_consumption"] * EMISSION_FACTORS["electricity_consumption"]
        )

    # --- Scope 3 emissions: business travel + commuting ---
    scope3 = 0.0
    if "business_travel_distance" in input_data:
        scope3 += input_data["business_travel_distance"] * EMISSION_FACTORS["business_travel_distance"]
    if "employee_commuting_distance" in input_data:
        scope3 += input_data["employee_commuting_distance"] * EMISSION_FACTORS["employee_commuting_distance"]
    if scope3 > 0:
        kpis["scope3_emissions"] = scope3

    # --- Renewable energy ratio ---
    if "renewable_energy_consumption" in input_data:
        total = None
        if "total_energy_consumption" in input_data:
            total = input_data["total_energy_consumption"]
        elif "nonrenewable_energy_consumption" in input_data:
            total = input_data["renewable_energy_consumption"] + input_data["nonrenewable_energy_consumption"]

        if total and total > 0:
            kpis["renewable_energy_ratio"] = (
                input_data["renewable_energy_consumption"] / total
            )

    # --- Water recycling ratio ---
    if "freshwater_withdrawal" in input_data and "water_recycled" in input_data:
        withdrawal = input_data["freshwater_withdrawal"]
        if withdrawal > 0:
            kpis["water_recycling_ratio"] = (
                input_data["water_recycled"] / withdrawal
            )

    # --- Water balance ratio ---
    if "freshwater_withdrawal" in input_data and "water_discharged" in input_data:
        withdrawal = input_data["freshwater_withdrawal"]
        if withdrawal > 0:
            kpis["water_balance_ratio"] = (
                input_data["water_discharged"] / withdrawal
            )

    # --- Waste treatment ratio ---
    if "hazardous_waste_generated" in input_data and "hazardous_waste_disposed" in input_data:
        generated = input_data["hazardous_waste_generated"]
        if generated > 0:
            kpis["waste_treatment_ratio"] = (
                input_data["hazardous_waste_disposed"] / generated
            )

    # --- Upsert KPI records into esg_form_submissions ---
    for kpi_field, value in kpis.items():
        # ✅ Skip if user already entered this KPI
        user_kpi_exists = db.query(EsgFormSubmission).filter_by(
            company_id=company_id,
            reporting_period=reporting_period,
            form_field=kpi_field,
            is_current=True,
            is_kpi=True,
            methodology="kpi"
        ).first()

        if user_kpi_exists:
            print(f"[Mapper] Skipping {kpi_field} — user entry exists.")
            continue

        # Otherwise insert/update the computed KPI
        stmt = insert(EsgFormSubmission).values(
            company_id=company_id,
            reporting_period=reporting_period,
            form_field=kpi_field,
            field_value=str(value),
            is_current=True,
            is_kpi=True,
            methodology="kpi",
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["company_id", "reporting_period", "form_field"],
            set_={
                "field_value": str(value),
                "updated_at": func.now(),
                "is_current": True,
                "is_kpi": True,
                "methodology": "kpi",
            },
        )
        db.execute(stmt)

    db.commit()
    print(f"[Mapper] Computed KPIs: {kpis}")
    return kpis
