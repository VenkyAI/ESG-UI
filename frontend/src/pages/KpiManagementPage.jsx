import React, { useEffect, useState } from "react";

function KpiManagementPage() {
  const [kpis, setKpis] = useState([]);
  const [formData, setFormData] = useState({
    kpi_code: "",
    kpi_description: "",
    pillar: "",
    unit: "",
    normalization_method: "",
    framework_reference: "",
    status: "active"
  });
  const [editing, setEditing] = useState(false);

  // Load KPIs on page load
  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/kpis/");
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error("Error loading KPIs:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await fetch(
          `http://127.0.0.1:8000/kpis/${formData.kpi_code}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
          }
        );
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch("http://127.0.0.1:8000/kpis/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("Insert failed");
      }

      setFormData({
        kpi_code: "",
        kpi_description: "",
        pillar: "",
        unit: "",
        normalization_method: "",
        framework_reference: "",
        status: "active"
      });
      setEditing(false);
      loadKpis();
    } catch (err) {
      console.error("Error saving KPI:", err);
    }
  };

  const handleEdit = (kpi) => {
    setFormData({
      kpi_code: kpi.kpi_code,
      kpi_description: kpi.kpi_description,
      pillar: kpi.pillar,
      unit: kpi.unit,
      normalization_method: kpi.normalization_method,
      framework_reference: kpi.framework_reference,
      status: kpi.status || "active"
    });
    setEditing(true);
  };

  const handleDeactivate = async (kpiCode) => {
    const confirmDeactivate = window.confirm(
      `Are you sure you want to deactivate KPI ${kpiCode}?`
    );
    if (!confirmDeactivate) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/kpis/${kpiCode}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Deactivate failed");
      loadKpis();
    } catch (err) {
      console.error("Error deactivating KPI:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>KPI Management</h2>

      {/* KPI Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="KPI Code"
          value={formData.kpi_code}
          onChange={(e) =>
            setFormData({ ...formData, kpi_code: e.target.value })
          }
          required
          disabled={editing}
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Description"
          value={formData.kpi_description}
          onChange={(e) =>
            setFormData({ ...formData, kpi_description: e.target.value })
          }
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />
        <select
          value={formData.pillar}
          onChange={(e) => setFormData({ ...formData, pillar: e.target.value })}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        >
          <option value="">Select Pillar</option>
          <option value="Environmental">Environmental</option>
          <option value="Social">Social</option>
          <option value="Governance">Governance</option>
        </select>
        <input
          type="text"
          placeholder="Unit"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />

        {/* Normalization dropdown */}
        <select
          value={formData.normalization_method}
          onChange={(e) =>
            setFormData({ ...formData, normalization_method: e.target.value })
          }
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        >
          <option value="">Select Normalization Method</option>
          <option value="Absolute">Absolute</option>
          <option value="Percentage">Percentage</option>
          <option value="Inverse">Inverse</option>
          <option value="Index">Index</option>
        </select>

        <input
          type="text"
          placeholder="Framework Reference"
          value={formData.framework_reference}
          onChange={(e) =>
            setFormData({ ...formData, framework_reference: e.target.value })
          }
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />

        <button
          type="submit"
          style={{
            background: "#4CAF50",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          {editing ? "Update KPI" : "Add KPI"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setFormData({
                kpi_code: "",
                kpi_description: "",
                pillar: "",
                unit: "",
                normalization_method: "",
                framework_reference: "",
                status: "active"
              });
            }}
            style={{
              background: "#ccc",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* KPI Table */}
      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>Code</th>
            <th>Description</th>
            <th>Pillar</th>
            <th>Unit</th>
            <th>Normalization</th>
            <th>Framework</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {kpis.length > 0 ? (
            kpis.map((kpi) => (
              <tr
                key={kpi.kpi_code}
                style={{
                  backgroundColor:
                    kpi.status === "inactive" ? "#ffe5e5" : "white"
                }}
              >
                <td>{kpi.kpi_code}</td>
                <td>{kpi.kpi_description}</td>
                <td>{kpi.pillar}</td>
                <td>{kpi.unit}</td>
                <td>{kpi.normalization_method}</td>
                <td>{kpi.framework_reference}</td>
                <td>{kpi.status || "active"}</td>
                <td>
                  <button
                    onClick={() => handleEdit(kpi)}
                    disabled={kpi.status === "inactive"}
                    style={{
                      background: "#007BFF",
                      color: "white",
                      padding: "5px 10px",
                      marginRight: "5px",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(kpi.kpi_code)}
                    disabled={kpi.status === "inactive"}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No KPIs found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default KpiManagementPage;
