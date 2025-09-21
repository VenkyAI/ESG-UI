# backend/schemas/kpi_mapping_schemas.py

from pydantic import BaseModel


# -----------------------------
# Input Schema (used for create/update)
# -----------------------------
class KpiMappingIn(BaseModel):
    form_field: str
    kpi_code: str


# -----------------------------
# Output Schema (used for GET responses)
# -----------------------------
class KpiMappingOut(KpiMappingIn):
    id: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2
