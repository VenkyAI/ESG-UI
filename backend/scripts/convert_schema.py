import json
from pathlib import Path

# Input/Output files
INPUT_FILE = Path("backend/schemas/esg_validation_schema.json")
OUTPUT_FILE = Path("backend/schemas/esg_validation_schema_flat.json")

with open(INPUT_FILE, "r") as f:
    old_schema = json.load(f)

new_schema = []
for field_name, details in old_schema.items():
    new_schema.append({
        "name": field_name,
        "label": field_name.replace("_", " ").title(),  # auto-generate label
        "type": details.get("type", "text"),
        "description": details.get("description", ""),
        "category": details.get("category", ""),
        "reference": details.get("reference", ""),
        "min": details.get("min"),
        "max": details.get("max"),
        "pattern": details.get("pattern")
    })

with open(OUTPUT_FILE, "w") as f:
    json.dump(new_schema, f, indent=2)

print(f"Converted schema saved to {OUTPUT_FILE}")
