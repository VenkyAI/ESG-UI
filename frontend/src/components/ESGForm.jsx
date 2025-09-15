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
  Snackbar,
  Alert,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

// ✅ Import validation schema
import validationSchema from "../esg_validation_schema.json";

function ESGForm({ schema }) {
  const categories = Object.keys(schema);
  const [tab, setTab] = useState(0);

  // Standards selected per category
  const [selectedStandards, setSelectedStandards] = useState(
    categories.reduce((acc, c) => ({ ...acc, [c]: [] }), {})
  );

  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
      .map((f) => {
        const rules = validationSchema[f.field];
        let errorText = "";
        const value = formData[f.field];

        // ✅ Numeric validation
        if (rules?.type === "numeric") {
          const val = parseFloat(value);
          if (rules.min !== undefined && !isNaN(val) && val < rules.min) {
            errorText = `Must be ≥ ${rules.min}`;
          }
          if (rules.max !== undefined && !isNaN(val) && val > rules.max) {
            errorText = `Must be ≤ ${rules.max}`;
          }
        }

        // ✅ Regex validation
        if (rules?.type === "regex") {
          if (value && rules.pattern) {
            const pattern = new RegExp(rules.pattern);
            if (!pattern.test(value)) {
              errorText = `Must match: ${rules.pattern}`;
            }
          }
        }

        // ✅ Boolean validation
        if (rules?.type === "boolean") {
          if (value !== undefined && typeof value !== "boolean") {
            errorText = "Must be true/false";
          }
        }

        return (
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

            {/* Render input type with validation */}
            {f.type === "numeric" && (
              <TextField
                type="number"
                fullWidth
                variant="outlined"
                size="small"
                value={value || ""}
                onChange={(e) => handleInputChange(f.field, e.target.value)}
                error={!!errorText}
                helperText={errorText}
              />
            )}

            {f.type === "boolean" && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!value}
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
                value={value || ""}
                onChange={(e) => handleInputChange(f.field, e.target.value)}
                error={!!errorText}
                helperText={errorText}
              />
            )}
          </Box>
        );
      });
  };

  const handleSubmit = () => {
    const payload = {
      company_id: "123e4567-e89b-12d3-a456-426614174000", // hardcoded for now
      year: new Date().getFullYear(),
      metrics: formData,
    };

    console.log("Submitting payload:", payload);

    fetch("http://127.0.0.1:8000/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setSnackbar({
            open: true,
            message: "✅ ESG data saved successfully!",
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: `❌ Error: ${data.message}`,
            severity: "error",
          });
        }
      })
      .catch((err) => {
        setSnackbar({
          open: true,
          message: `❌ Submit error: ${err.message}`,
          severity: "error",
        });
      });
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
        onClick={handleSubmit}
      >
        Submit
      </Button>

      {/* ✅ Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ESGForm;
