import React, { useState, useEffect } from "react";

function KpiMappingPage() {
  const [mappings, setMappings] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [newMapping, setNewMapping] = useState({
    form_field: "",
    kpi_code: "",
    aggregation_method: "SUM",
    is_current: true,
  });
  const [kpis, setKpis] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editMapping, setEditMapping] = useState({});

  // Fetch all mappings
  const fetchMappings = async () => {
    try {
      const response = await fetch("http://localhost:8000/kpi-mappings/");
      if (!response.ok) throw new Error("Failed to fetch mappings");
      const data = await response.json();
      setMappings(data);
    } catch (error) {
      console.error("Error loading mappings:", error);
    }
  };

  // Fetch all KPIs for dropdown
  const fetchKpis = async () => {
    try {
      const response = await fetch("http://localhost:8000/kpis/");
      if (!response.ok) throw new Error("Failed to fetch KPIs");
      const data = await response.json();
      setKpis(data);
    } catch (error) {
      console.error("Error loading KPIs:", error);
    }
  };

  // Fetch available form fields for dropdown
  const fetchFormFields = async () => {
    try {
      const response = await fetch("http://localhost:8000/kpi-mappings/form-fields");
      if (!response.ok) throw new Error("Failed to fetch form fields");
      const data = await response.json();
      setFormFields(data);
    } catch (error) {
      console.error("Error loading form fields:", error);
    }
  };

  useEffect(() => {
    fetchMappings();
    fetchKpis();
    fetchFormFields();
  }, []);

  // Handle form input changes
  const handleChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditMapping({ ...editMapping, [name]: value });
    } else {
      setNewMapping({ ...newMapping, [name]: value });
    }
  };

  // Create new mapping
  const handleAdd = async () => {
    if (!newMapping.form_field) {
      alert("Please select a Form Field before saving a mapping.");
      return;
    }
    if (!newMapping.kpi_code) {
      alert("Please select a KPI Code before saving a mapping.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/kpi-mappings/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMapping),
      });
      if (!response.ok) throw new Error("Failed to create mapping");
      setNewMapping({
        form_field: "",
        kpi_code: "",
        aggregation_method: "SUM",
        is_current: true,
      });
      fetchMappings();
    } catch (error) {
      console.error("Error adding mapping:", error);
    }
  };

  // Start editing
  const handleEdit = (mapping) => {
    setEditingId(mapping.id);
    setEditMapping({ ...mapping });
  };

  // Save edit
  const handleSave = async (id) => {
    if (!editMapping.form_field) {
      alert("Please select a Form Field before saving.");
      return;
    }
    if (!editMapping.kpi_code) {
      alert("Please select a KPI Code before saving.");
      return;
    }
    try {
      const payload = { ...editMapping, is_current: true };
      const response = await fetch(`http://localhost:8000/kpi-mappings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update mapping");
      setEditingId(null);
      fetchMappings();
    } catch (error) {
      console.error("Error updating mapping:", error);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditMapping({});
  };

  // Delete mapping
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/kpi-mappings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete mapping");
      fetchMappings();
    } catch (error) {
      console.error("Error deleting mapping:", error);
    }
  };

  return (
    <div>
      <h2>KPI Mapping Management</h2>

      {/* Add New Mapping */}
      <div>
        <h3>Add Mapping</h3>
        <select
          name="form_field"
          value={newMapping.form_field}
          onChange={handleChange}
        >
          <option value="">-- Select Form Field --</option>
          {formFields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          name="kpi_code"
          value={newMapping.kpi_code}
          onChange={handleChange}
        >
          <option value="">-- Select KPI Code --</option>
          {kpis.map((k) => (
            <option key={k.kpi_code} value={k.kpi_code}>
              {k.kpi_code} - {k.kpi_description}
            </option>
          ))}
        </select>
        <select
          name="aggregation_method"
          value={newMapping.aggregation_method}
          onChange={handleChange}
        >
          <option value="SUM">SUM</option>
          <option value="AVG">AVG</option>
          <option value="LATEST">LATEST</option>
        </select>
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* Mappings Table */}
      <h3>Saved Mappings</h3>
      <table
        border="1"
        cellPadding="5"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Form Field</th>
            <th>KPI Code</th>
            <th>Aggregation</th>
            <th>Is Current</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mappings.length > 0 ? (
            mappings.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  {editingId === m.id ? (
                    <select
                      name="form_field"
                      value={editMapping.form_field || ""}
                      onChange={(e) => handleChange(e, true)}
                    >
                      <option value="">-- Select Form Field --</option>
                      {formFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  ) : (
                    m.form_field
                  )}
                </td>
                <td>
                  {editingId === m.id ? (
                    <select
                      name="kpi_code"
                      value={editMapping.kpi_code || ""}
                      onChange={(e) => handleChange(e, true)}
                    >
                      <option value="">-- Select KPI Code --</option>
                      {kpis.map((k) => (
                        <option key={k.kpi_code} value={k.kpi_code}>
                          {k.kpi_code} - {k.kpi_description}
                        </option>
                      ))}
                    </select>
                  ) : (
                    m.kpi_code
                  )}
                </td>
                <td>
                  {editingId === m.id ? (
                    <select
                      name="aggregation_method"
                      value={editMapping.aggregation_method || "SUM"}
                      onChange={(e) => handleChange(e, true)}
                    >
                      <option value="SUM">SUM</option>
                      <option value="AVG">AVG</option>
                      <option value="LATEST">LATEST</option>
                    </select>
                  ) : (
                    m.aggregation_method || "SUM"
                  )}
                </td>
                <td>{m.is_current ? "Yes" : "No"}</td>
                <td>{m.updated_at}</td>
                <td>
                  {editingId === m.id ? (
                    <>
                      <button onClick={() => handleSave(m.id)}>Save</button>
                      <button onClick={handleCancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(m)}>Edit</button>
                      <button onClick={() => handleDelete(m.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No mappings saved yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default KpiMappingPage;
