// frontend/src/pages/DashboardPage.jsx

import React, { useState } from "react";
import DashboardESGScore from "./DashboardESGScore";
import { COMPANY_ID } from "../config";

function DashboardPage() {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runEngine = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: fetch latest reporting period from backend
      const latestRes = await fetch(
        `http://127.0.0.1:8000/dashboard/latest-period/${COMPANY_ID}`
      );
      if (!latestRes.ok) throw new Error("Failed to fetch latest reporting period");
      const latestData = await latestRes.json();
      const period = latestData.latest_reporting_period;

      if (!period) {
        throw new Error("No reporting period found for this company");
      }

      // Step 2: run ESG engine for that reporting period
      const response = await fetch("http://127.0.0.1:8000/engine/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: COMPANY_ID,
          reporting_period: period,
        }),
      });

      if (!response.ok) throw new Error("Failed to run engine");
      const data = await response.json();

      // Save the latest scores from engine run
      setScores(data);
    } catch (err) {
      console.error("Error running ESG engine:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>📊 ESG Dashboard</h1>

      {/* Run Engine Button */}
      <button
        onClick={runEngine}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "Running..." : "Run ESG Engine"}
      </button>

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* Display Scores */}
      {scores && (
        <div style={{ marginTop: "20px" }}>
          <h3>Latest ESG Scores (Engine Run)</h3>
          <p>🌱 Environmental: {scores.pillar_scores?.Environmental?.toFixed(2)}</p>
          <p>🤝 Social: {scores.pillar_scores?.Social?.toFixed(2)}</p>
          <p>🏛 Governance: {scores.pillar_scores?.Governance?.toFixed(2)}</p>
          <p>
            <strong>📊 Final ESG Score: {scores.final_score?.toFixed(2)}</strong>
          </p>
        </div>
      )}

      {/* ESG Scoreboard widget */}
      <div style={{ marginTop: "40px" }}>
        <DashboardESGScore />
      </div>
    </div>
  );
}

export default DashboardPage;
