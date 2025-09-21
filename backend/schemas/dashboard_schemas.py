from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# -----------------------------
# KPI Schemas
# -----------------------------
class KPIBase(BaseModel):
    kpi_code: str
    kpi_description: str
    pillar: str
    unit: Optional[str] = None
    normalization_method: Optional[str] = None
    framework_reference: Optional[str] = None


class KPIOut(KPIBase):
    status: str

    class Config:
        orm_mode = True


class KPIUpdate(BaseModel):
    kpi_description: Optional[str] = None
    pillar: Optional[str] = None
    unit: Optional[str] = None
    normalization_method: Optional[str] = None
    framework_reference: Optional[str] = None
    status: Optional[str] = None

class KpiMappingIn(BaseModel):
    form_field: str
    kpi_code: str

class KpiMappingOut(KpiMappingIn):
    id: int
    class Config:
        orm_mode = True

# -----------------------------
# Score Schemas
# -----------------------------
class ScoreRequest(BaseModel):
    company_id: int
    reporting_period: date


class ScoreOut(BaseModel):
    kpi_code: str
    normalized_score: float
    weighted_score: float

    class Config:
        orm_mode = True


class DashboardOut(BaseModel):
    company_id: int
    reporting_period: date
    environmental_score: float
    social_score: float
    governance_score: float
    overall_score: float


# -----------------------------
# Pillar Weights Schemas
# -----------------------------
class PillarWeightBase(BaseModel):
    company_id: int
    reporting_period: date
    environmental: float
    social: float
    governance: float


class PillarWeightOut(PillarWeightBase):
    class Config:
        orm_mode = True
