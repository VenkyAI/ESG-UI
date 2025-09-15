# ESG-UI

**GUI for inputting ESG (Environmental, Social, Governance) metrics**  
This repository hosts the schema and configuration used by the ESG input portal.  
It is designed to be multi-standard (ISO, TCFD, EU, BRSR) and multi-tenant (company-level isolation).  

---

## 📌 Overview
The ESG-UI provides:
- A **schema (`esg_schema_gui.json`)** for defining ESG input fields.
- Flat versions (`esg_schema_gui_flat.json`, `esg_schema_gui_flat.csv`) for ingestion by other tools (profilers, DB loaders).
- BRSR (India) compliance out-of-the-box, along with ISO, TCFD, and EU frameworks.
- Normalized field names for Postgres + API use.

---

## 📂 Files
- `esg_schema_gui.json` → Nested JSON schema grouped by Environmental / Social / Governance.
- `esg_schema_gui_flat.json` → Flat JSON table for ingestion.
- `esg_schema_gui_flat.csv` → CSV table for ingestion.

---

## 🏗 Usage

### 1. Clone the Repo
```bash
git clone https://github.com/VenkyAI/ESG-UI.git
cd ESG-UI
2. Working with the Schema

Use the flat CSV/JSON for ingestion into profilers or DB design.

Use the nested JSON for generating UI forms or APIs.

3. Postgres Example

Flexible storage in Postgres:

CREATE TABLE esg_metrics (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL,
    year INT NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

4. Querying JSONB
-- Fetch carbon emissions for a company in 2024
SELECT metrics->>'carbon_emissions'
FROM esg_metrics
WHERE company_id = 'company-uuid' AND year = 2024;

🌍 Standards Supported

ISO 14064, ISO 50001, ISO 14046

TCFD Recommendations

GRI Standards

EU CSRD / directives

BRSR (India SEBI framework)

📜 License

MIT License
 (to be finalized)

✨ Next Steps

Integrate schema with ESG GUI frontend (React).

Deploy backend APIs (FastAPI) for submissions.

Connect to Postgres RDS for storage.