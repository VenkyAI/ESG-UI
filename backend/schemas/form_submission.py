from pydantic import BaseModel, validator
from datetime import date, datetime
from typing import Optional, Union, Any
import json
import os
import re

# Load schema for validation
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "esg_validation_schema_flat.json")
with open(SCHEMA_PATH, "r") as f:
    VALIDATION_SCHEMA = {entry["name"]: entry for entry in json.load(f)}


class FormSubmissionBase(BaseModel):
    company_id: int
    reporting_period: date
    form_field: str
    field_value: Optional[Union[str, float, bool]] = None
    is_kpi: Optional[bool] = False
    methodology: Optional[str] = None   # "input" or "kpi"

    # ✅ Validation against schema type rules
    @validator("field_value", pre=True, always=True)
    def validate_field_value(cls, v, values):
        field_name = values.get("form_field")
        if not field_name or v is None:
            return v

        rule = VALIDATION_SCHEMA.get(field_name)
        if not rule:
            return v  # no rule → skip validation

        field_type = rule.get("type")

        # Numeric fields
        if field_type == "numeric":
            try:
                num = float(v)
            except ValueError:
                raise ValueError(f"Field '{field_name}' must be numeric")
            if num < 0:
                raise ValueError(f"Negative values are not allowed for '{field_name}'")
            return num

        # Boolean fields
        if field_type == "boolean":
            if str(v).lower() in ["true", "1", "yes"]:
                return True
            if str(v).lower() in ["false", "0", "no"]:
                return False
            raise ValueError(f"Field '{field_name}' must be boolean (true/false)")

        # Regex-validated fields
        if field_type == "regex":
            pattern = rule.get("pattern")
            if pattern and not re.match(pattern, str(v).lower()):
                raise ValueError(
                    f"Field '{field_name}' must match pattern: {pattern}"
                )
            return str(v).lower()

        # Fallback: accept as string
        return str(v)


class FormSubmissionIn(FormSubmissionBase):
    """Schema for creating or updating a form submission"""
    pass


class FormSubmissionOut(FormSubmissionBase):
    """Schema for returning a form submission"""
    id: int
    is_current: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True   # ✅ for Pydantic v2 ORM mode
