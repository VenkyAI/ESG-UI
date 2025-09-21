import logging
import os
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from backend.routes import dashboard_routes
from backend.routes import kpi_mapping_routes
from backend.routes import kpi_routes
from backend.routes import engine_routes   # 👈 added

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create FastAPI app
app = FastAPI(title="ESG UI API")

# Enable CORS for frontend (React dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def root():
    return {"message": "ESG UI backend is running"}

# ✅ Legacy schema (object → fields array)
@app.get("/schema")
def get_schema():
    schema_path = os.path.join(os.path.dirname(__file__), "schemas", "esg_validation_schema.json")
    try:
        with open(schema_path, "r") as f:
            raw_schema = json.load(f)

        fields = []
        for name, definition in raw_schema.items():
            field = {"name": name}
            field.update(definition)
            fields.append(field)

        return {"fields": fields}
    except Exception as e:
        return {"error": f"Schema not found or invalid: {e}"}

# ✅ Flat schema (preferred for frontend)
@app.get("/schema/flat")
def get_flat_schema():
    schema_file = Path("backend/schemas/esg_validation_schema_flat.json")
    if not schema_file.exists():
        return {"detail": "Flat schema not found"}
    with open(schema_file, "r") as f:
        return json.load(f)

# ✅ Include routers
app.include_router(dashboard_routes.router)
app.include_router(kpi_mapping_routes.router)
app.include_router(kpi_routes.router)
app.include_router(engine_routes.router)   # 👈 added
