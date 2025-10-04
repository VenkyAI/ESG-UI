# backend/schemas/engine_schemas.py

from pydantic import BaseModel
from typing import Dict

class EngineRunRequest(BaseModel):
    company_id: int
    reporting_period: str  # ISO date string: YYYY-MM-DD

class EngineRunResponse(BaseModel):
    pillar_scores: Dict[str, float]
    final_score: float
