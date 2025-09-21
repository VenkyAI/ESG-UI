from sqlalchemy import Column, Integer, String, Numeric, Date, Float, ForeignKey
from backend.database import Base

class ESGScore(Base):
    __tablename__ = "esg_scores"

    id = Column(Integer, primary_key=True, index=True)
    kpi_code = Column(String, ForeignKey("esg_kpis.kpi_code", ondelete="CASCADE"))
    user_weightage = Column(Numeric)
    normalized_score = Column(Numeric)
    weighted_score = Column(Numeric)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)


class ESGKpi(Base):   # ✅ single canonical KPI model
    __tablename__ = "esg_kpis"

    kpi_code = Column(String, primary_key=True, index=True)
    kpi_description = Column(String, nullable=False)
    pillar = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    normalization_method = Column(String, nullable=True)
    framework_reference = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)


class ESGDashboard(Base):
    __tablename__ = "esg_dashboard"

    id = Column(Integer, primary_key=True, index=True)
    environmental_score = Column(Numeric)
    social_score = Column(Numeric)
    governance_score = Column(Numeric)
    final_esg_score = Column(Numeric)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)


class ESGPillarWeight(Base):
    __tablename__ = "esg_pillar_weights"

    id = Column(Integer, primary_key=True, index=True)
    pillar = Column(String, nullable=False)
    pillar_weight = Column(Float, nullable=False)
    company_id = Column(Integer, nullable=False)
    reporting_period = Column(Date, nullable=False)


class ESGKpiMapping(Base):
    __tablename__ = "esg_kpi_mappings"

    id = Column(Integer, primary_key=True, index=True)
    form_field = Column(String, nullable=False)
    kpi_code = Column(String, ForeignKey("esg_kpis.kpi_code"), nullable=False)
