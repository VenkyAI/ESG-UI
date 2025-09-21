import React, { useState, useEffect } from "react";

function WeightsPage() {
  const [environmental, setEnvironmental] = useState("");
  const [social, setSocial] = useState("");
  const [governance, setGovernance] = useState("");
  const [weights, setWeights] = useState([]);

  // Load saved weights
  useEffect(() => {
    const loadWeights = async () => {
      try {
        const res = await fetch("http://localhost:8000/dashboard/pillar-weights");
        if (!res.ok) throw new Error("Failed to fetch weights");
        const data = await res.json();
        setWeights(data);
      } catch (err) {
        console.error("Error loading weights:", err);
      }
    };
    loadWeights();
  }, []);

  const handleSave = async () => {
    const env = parseFloat(environmental);
    const soc = parseFloat(social);
    const gov = parseFloat(governance);

    if (isNaN(env) || isNaN(soc) || isNaN(gov)) {
      alert("All three weights must be numbers");
      return;
    }

    const total = env + soc + gov;
    if (Math.abs(total - 1.0) > 0.0001) {
      alert("The sum of weights must equal 1.0");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/dashboard/pillar-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmental: env,
          social: soc,
          governance: gov,
          company_id: 1,
          reporting_period: "2024-01-01"
        }),
      });

      if (!res.ok) throw new Error("Failed to save weights");

      const data = await res.json();
      setWeights(data);
      setEnvironmental("");
      setSocial("");
      setGovernance("");
    } catch (err) {
      console.error("Error saving weights:", err);
    }
  };

  return (
    <div>
      <h2>Pillar Weights Management</h2>

      <table style={{ marginBottom: "10px" }}>
        <tbody>
          <tr>
            <td><label>Environmental:</label></td>
            <td>
              <input
                type="number"
                value={environmental}
                onChange={(e) => setEnvironmental(e.target.value)}
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td><label>Social:</label></td>
            <td>
              <input
                type="number"
                value={social}
                onChange={(e) => setSocial(e.target.value)}
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td><label>Governance:</label></td>
            <td>
              <input
                type="number"
                value={governance}
                onChange={(e) => setGovernance(e.target.value)}
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td colSpan="2">
              <button onClick={handleSave}>Save Weights</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Saved Weights</h3>
      {weights.length > 0 ? (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Company</th>
              <th>Period</th>
              <th>Environmental</th>
              <th>Social</th>
              <th>Governance</th>
            </tr>
          </thead>
          <tbody>
            {weights.map((row, idx) => (
              <tr key={idx}>
                <td>{row.company_id}</td>
                <td>{row.reporting_period}</td>
                <td>{row.environmental}</td>
                <td>{row.social}</td>
                <td>{row.governance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No weights saved yet</p>
      )}
    </div>
  );
}

export default WeightsPage;
