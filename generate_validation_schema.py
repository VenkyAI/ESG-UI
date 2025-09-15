import pandas as pd
import re
import json

file_path = "ESG_Profiler_Logic_v2.xlsx"   # Excel file in project root
output_file = "esg_validation_schema.json"

def parse_threshold(threshold):
    min_val, max_val, pattern = None, None, None
    if pd.isna(threshold):
        return min_val, max_val, pattern
    min_match = re.search(r"min_threshold\s*=\s*([0-9.]+)", str(threshold))
    if min_match:
        min_val = float(min_match.group(1))
    max_match = re.search(r"max_threshold\s*=\s*([0-9.]+)", str(threshold))
    if max_match:
        max_val = float(max_match.group(1))
    pattern_match = re.search(r"pattern\s*=\s*(.+)", str(threshold))
    if pattern_match:
        pattern = pattern_match.group(1).strip()
    return min_val, max_val, pattern

df = pd.read_excel(file_path, sheet_name="Profiler_Logic")

validation_schema = {}

for _, row in df.iterrows():
    field = row["Column"]
    field_type = row["Type"]
    min_val, max_val, pattern = parse_threshold(row.get("Threshold"))
    entry = {
        "type": field_type,
        "description": str(row["Description"]).strip(),
        "category": row["Category"],
        "reference": row["Reference"]
    }
    if field_type == "numeric":
        if min_val is not None: entry["min"] = min_val
        if max_val is not None: entry["max"] = max_val
    if field_type == "regex" and pattern:
        entry["pattern"] = pattern
    validation_schema[field] = entry

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(validation_schema, f, indent=2)

print(f"✅ Validation schema written to {output_file}")
