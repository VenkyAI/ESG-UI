import React, { useEffect, useState } from "react";
import ESGForm from "./components/ESGForm.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import KpiManagementPage from "./pages/KpiManagementPage.jsx";
import WeightsPage from "./pages/WeightsPage.jsx";
import KpiMappingPage from "./pages/KpiMappingPage.jsx";

function App() {
  const [schema, setSchema] = useState(null);
  const [activeTab, setActiveTab] = useState("form"); // default tab

  useEffect(() => {
    fetch("http://127.0.0.1:8000/schema/flat")
      .then((res) => res.json())
      .then((data) => setSchema(data))
      .catch((err) => console.error("Error loading schema:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🌍 ESG UI</h1>

      {/* Navigation buttons in correct workflow order */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("form")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: activeTab === "form" ? "#4CAF50" : "#ddd",
            color: activeTab === "form" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ESG Form
        </button>
        <button
          onClick={() => setActiveTab("kpis")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: activeTab === "kpis" ? "#4CAF50" : "#ddd",
            color: activeTab === "kpis" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          KPI Management
        </button>
        <button
          onClick={() => setActiveTab("kpi-mapping")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: activeTab === "kpi-mapping" ? "#4CAF50" : "#ddd",
            color: activeTab === "kpi-mapping" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          KPI Mapping
        </button>
        <button
          onClick={() => setActiveTab("weights")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: activeTab === "weights" ? "#4CAF50" : "#ddd",
            color: activeTab === "weights" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Weights
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "10px 20px",
            background: activeTab === "dashboard" ? "#4CAF50" : "#ddd",
            color: activeTab === "dashboard" ? "#fff" : "#000",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </div>

      {/* Content area */}
      {activeTab === "form" &&
        (schema ? <ESGForm schema={schema} /> : <p>Loading schema...</p>)}
      {activeTab === "kpis" && <KpiManagementPage />}
      {activeTab === "kpi-mapping" && <KpiMappingPage />}
      {activeTab === "weights" && <WeightsPage />}
      {activeTab === "dashboard" && <DashboardPage />}
    </div>
  );
}

export default App;
