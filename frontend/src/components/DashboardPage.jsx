import React, { useState } from "react";

function DashboardPage() {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);

  const runEngine = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/engine/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: 1,
          reporting_period: "2025-09-21",
          raw_data: {
            "SOC-01": 45,
            "ENV-TEST1": 1000
          }
        }),
      });

      if (!response.ok) throw new Error("Failed to run engine");
      const data = await response.json();
      setScores(data.dashboard);
    } catch (error) {
      console.error("Error running ESG engine:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>📊 ESG Dashboard</h2>

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
          marginBottom: "20px"
        }}
      >
        {loading ? "Running..." : "Run ESG Engine"}
      </button>

      {/* Display Scores */}
      {scores && (
        <div style={{ marginTop: "20px" }}>
          <h3>Latest ESG Scores</h3>
          <p>🌱 Environmental: {scores.environmental}</p>
          <p>🤝 Social: {scores.social}</p>
          <p>🏛 Governance: {scores.governance}</p>
          <p><strong>📊 Final ESG Score: {scores.final}</strong></p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
