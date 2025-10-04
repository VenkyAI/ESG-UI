from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from enum import Enum


class AggregationMethod(str, Enum):
    SUM = "SUM"
    AVG = "AVG"
    LATEST = "LATEST"


class KpiMappingBase(BaseModel):
    form_field: str
    kpi_code: str
    reporting_period: Optional[date] = None
    aggregation_method: Optional[AggregationMethod] = None  # ✅ now Enum


class KpiMappingIn(KpiMappingBase):
    """Schema for creating or updating a mapping"""
    pass


class KpiMappingOut(KpiMappingBase):
    """Schema for returning a mapping"""
    id: int
    is_current: bool
    updated_at: datetime

    class Config:
        from_attributes = True
