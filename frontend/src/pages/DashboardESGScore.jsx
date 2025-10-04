// frontend/src/pages/DashboardESGScore.jsx

import React, { useEffect, useState } from "react";

function DashboardESGScore() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchScore() {
      try {
        // Step 1: Get the latest reporting period from backend
        const latestRes = await fetch(
          "http://127.0.0.1:8000/dashboard/latest-period/1"
        );
        if (!latestRes.ok) {
          throw new Error(`HTTP error ${latestRes.status}`);
        }
        const latestData = await latestRes.json();
        const period = latestData.latest_reporting_period;

        if (!period) {
          throw new Error("No reporting period found");
        }

        // Step 2: Fetch ESG scores for that reporting period
        const res = await fetch(
          `http://127.0.0.1:8000/dashboard/scores/1/${period}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = await res.json();
        setScore(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, []);

  if (loading) return <p>Loading ESG scores...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!score) return <p>No ESG score data available</p>;

  return (
    <div className="esg-dashboard-score">
      <h2>ESG Dashboard Scores</h2>

      <p>
        Final ESG Score:{" "}
        {score?.final_score !== undefined
          ? score.final_score.toFixed(2)
          : "N/A"}
      </p>

      <h3>Pillar Scores</h3>
      <ul>
        <li>
          Environmental:{" "}
          {score?.pillar_scores?.Environmental !== undefined
            ? score.pillar_scores.Environmental.toFixed(2)
            : "N/A"}
        </li>
        <li>
          Social:{" "}
          {score?.pillar_scores?.Social !== undefined
            ? score.pillar_scores.Social.toFixed(2)
            : "N/A"}
        </li>
        <li>
          Governance:{" "}
          {score?.pillar_scores?.Governance !== undefined
            ? score.pillar_scores.Governance.toFixed(2)
            : "N/A"}
        </li>
      </ul>
    </div>
  );
}

export default DashboardESGScore;
