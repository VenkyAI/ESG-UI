import logging
import json
import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import routers
from backend.routes import dashboard_routes
from backend.routes import kpi_mapping_routes
from backend.routes import kpi_routes
from backend.routes import engine_routes   # 👈 added
from backend.routes import weight_routes
from backend.routes import form_routes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create FastAPI app
app = FastAPI(title="ESG UI API")

# Enable CORS for frontend (React dev server + AWS later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def root():
    return {"message": "ESG UI backend is running"}


# ✅ Pydantic model for schema fields (aligned with flat JSON)
class SchemaField(BaseModel):
    name: str
    type: str
    label: Optional[str] = None
    method: Optional[str] = None
    theme: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    reference: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    pattern: Optional[str] = None


# ✅ Unified schema endpoint (reads from flat JSON)
@app.get("/schema", response_model=List[SchemaField])
def get_schema():
    base_dir = os.path.dirname(__file__)
    schema_path = os.path.join(base_dir, "schemas", "esg_validation_schema_flat.json")
    if not os.path.exists(schema_path):
        return []
    try:
        with open(schema_path, "r") as f:
            schema_list = json.load(f)
        return schema_list
    except Exception:
        return []


# ✅ Include routers
app.include_router(dashboard_routes.router)
app.include_router(kpi_mapping_routes.router)
app.include_router(kpi_routes.router)
app.include_router(engine_routes.router)   # 👈 added
app.include_router(weight_routes.router)
app.include_router(form_routes.router)
