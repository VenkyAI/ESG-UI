import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

function ESGForm({ schema }) {
  const categories = Object.keys(schema);
  const [tab, setTab] = useState(0);

  // Standards selected per category
  const [selectedStandards, setSelectedStandards] = useState(
    categories.reduce((acc, c) => ({ ...acc, [c]: [] }), {})
  );

  const [formData, setFormData] = useState({});

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStandardChange = (category, std, checked) => {
    setSelectedStandards((prev) => {
      const updated = checked
        ? [...prev[category], std]
        : prev[category].filter((s) => s !== std);
      return { ...prev, [category]: updated };
    });
  };

  const renderFields = (category, fields) => {
    return fields
      .filter((f) => {
        const active = selectedStandards[category];
        if (active.length === 0) return true;

        // ✅ normalize standards: match if any selected standard is contained in field standards
        return f.standards.some((s) =>
          active.some((sel) => s.toUpperCase().includes(sel.toUpperCase()))
        );
      })
      .map((f) => (
        <Box key={f.field} sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ fontWeight: "bold", mr: 1 }}>
              {f.label}
            </Typography>
            <Tooltip title={f.description}>
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Render input type */}
          {f.type === "numeric" && (
            <TextField
              type="number"
              fullWidth
              variant="outlined"
              size="small"
              value={formData[f.field] || ""}
              onChange={(e) => handleInputChange(f.field, e.target.value)}
            />
          )}
          {f.type === "boolean" && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[f.field] || false}
                  onChange={(e) =>
                    handleInputChange(f.field, e.target.checked)
                  }
                />
              }
              label="Yes"
            />
          )}
          {(f.type === "text" || f.type === "regex" || !f.type) && (
            <TextField
              type="text"
              fullWidth
              variant="outlined"
              size="small"
              placeholder={
                f.type === "regex" ? "Enter value (pattern expected)" : ""
              }
              value={formData[f.field] || ""}
              onChange={(e) => handleInputChange(f.field, e.target.value)}
            />
          )}
        </Box>
      ));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📊 ESG Metrics Form
      </Typography>

      {/* ESG Tabs */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        {categories.map((c, i) => (
          <Tab key={c} label={c} value={i} />
        ))}
      </Tabs>

      {/* Standards selector per tab */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          <b>Select Reporting Standards ({categories[tab]})</b>
        </Typography>
        {["ISO", "TCFD", "EU", "BRSR"].map((std) => (
          <FormControlLabel
            key={std}
            control={
              <Checkbox
                checked={selectedStandards[categories[tab]].includes(std)}
                onChange={(e) =>
                  handleStandardChange(categories[tab], std, e.target.checked)
                }
              />
            }
            label={std}
          />
        ))}
      </Box>

      {/* Render fields for active tab */}
      <Box>{renderFields(categories[tab], schema[categories[tab]])}</Box>

      {/* Submit Button */}
     <Button
  variant="contained"
  color="primary"
  sx={{ mt: 3 }}
  onClick={() => {
    const payload = {
      company_id: "123e4567-e89b-12d3-a456-426614174000", // hardcoded for now
      year: new Date().getFullYear(),
      metrics: formData,
    };

    console.log("Submitting payload:", payload); // ✅ debug log

    fetch("http://127.0.0.1:8000/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => console.log("Server response:", data))
      .catch((err) => console.error("Submit error:", err));
  }}
>
  Submit
</Button>
    </Box>
  );
}

export default ESGForm;
