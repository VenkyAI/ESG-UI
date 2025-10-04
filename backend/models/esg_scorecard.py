from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Numeric,
    Float,
)
from sqlalchemy.sql import func
from backend.database import Base


# ------------------------------------------------------------------
# 📊 RAW ESG SCORES (Per-KPI level, drilldown)
# ------------------------------------------------------------------
class ESGRawScore(Base):
    __tablename__ = "esg_raw_scores"

    id = Column(Integer, primary_key=True, index=True)
    kpi_code = Column(String, ForeignKey("esg_kpis.kpi_code", ondelete="CASCADE"))
    user_weightage = Column(Numeric)
    normalized_score = Column(Numeric)
    weighted_score = Column(Numeric)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)


# ------------------------------------------------------------------
# 📈 FINAL ESG SCORES (Aggregated pillar + overall ESG score)
# ------------------------------------------------------------------
class ESGFinalScore(Base):
    __tablename__ = "esg_final_scores"

    id = Column(Integer, primary_key=True, index=True)
    environmental_score = Column(Numeric)
    social_score = Column(Numeric)
    governance_score = Column(Numeric)
    final_esg_score = Column(Numeric)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)


# ------------------------------------------------------------------
# 🧾 KPI MASTER (canonical list of KPIs)
# ------------------------------------------------------------------
class ESGKpi(Base):
    __tablename__ = "esg_kpis"

    kpi_code = Column(String, primary_key=True, index=True)
    kpi_description = Column(String, nullable=False)
    pillar = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    normalization_method = Column(String, nullable=True)
    framework_reference = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)


# ------------------------------------------------------------------
# ⚖️ PILLAR WEIGHTS
# ------------------------------------------------------------------
class ESGPillarWeight(Base):
    __tablename__ = "esg_pillar_weights"

    id = Column(Integer, primary_key=True, index=True)
    pillar = Column(String, nullable=False)
    pillar_weight = Column(Float, nullable=False)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)
    is_current = Column(Boolean, default=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ------------------------------------------------------------------
# ⚖️ KPI WEIGHTS
# ------------------------------------------------------------------
class ESGKpiWeight(Base):
    __tablename__ = "esg_kpi_weights"

    id = Column(Integer, primary_key=True, index=True)
    kpi_code = Column(String, ForeignKey("esg_kpis.kpi_code"), nullable=False)
    weight = Column(Numeric, nullable=False)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_current = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("company_id", "reporting_period", "kpi_code", name="uniq_kpi_weight"),
    )


# ------------------------------------------------------------------
# 📝 FORM SUBMISSIONS (with history)
# ------------------------------------------------------------------
class EsgFormSubmission(Base):
    __tablename__ = "esg_form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)
    form_field = Column(String, nullable=False)
    field_value = Column(String)
    methodology = Column(String)   # e.g., "input" or "kpi"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_kpi = Column(Boolean, default=False)
    is_current = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("company_id", "reporting_period", "form_field", name="uniq_form_submission"),
    )


# ------------------------------------------------------------------
# 🔗 KPI MAPPINGS
# ------------------------------------------------------------------
class ESGKpiMapping(Base):
    __tablename__ = "esg_kpi_mappings"

    id = Column(Integer, primary_key=True, index=True)
    form_field = Column(String, nullable=False)
    kpi_code = Column(String, ForeignKey("esg_kpis.kpi_code"), nullable=True)
    aggregation_method = Column(String, nullable=True, server_default="SUM")
    reporting_period = Column(Date, nullable=True)
    is_current = Column(Boolean, default=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
