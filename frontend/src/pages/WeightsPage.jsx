import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

const DEFAULT_PILLARS = [
  { pillar: "Environmental", pillar_weight: 0, is_current: true },
  { pillar: "Social", pillar_weight: 0, is_current: true },
  { pillar: "Governance", pillar_weight: 0, is_current: true },
];

function WeightsPage() {
  const [pillarWeights, setPillarWeights] = useState(DEFAULT_PILLARS);
  const [kpiWeights, setKpiWeights] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const companyId = 1;

  // ---------------- Fetch Pillar Weights ----------------
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/weights/pillars", {
        params: { company_id: companyId },
      })
      .then((res) => {
        const data = res.data || [];
        const merged = DEFAULT_PILLARS.map((def) => {
          const found = data.find((p) => p.pillar === def.pillar);
          return found ? found : def;
        });
        setPillarWeights(merged);
      })
      .catch((err) => {
        console.error("Error fetching pillar weights:", err);
        setSnackbar({
          open: true,
          message: "Failed to fetch pillar weights",
          severity: "error",
        });
      });
  }, [companyId]);

  // ---------------- Fetch KPI Weights ----------------
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/weights/kpis", {
        params: { company_id: companyId },
      })
      .then((res) => setKpiWeights(res.data || []))
      .catch((err) => {
        console.error("Error fetching KPI weights:", err);
        setSnackbar({
          open: true,
          message: "Failed to fetch KPI weights",
          severity: "error",
        });
      });
  }, [companyId]);

  // ---------------- Handlers ----------------
  const handlePillarChange = (index, value) => {
    const updated = [...pillarWeights];
    updated[index].pillar_weight = parseFloat(value) || 0;
    setPillarWeights(updated);
  };

  const handleKpiChange = (index, value) => {
    const updated = [...kpiWeights];
    updated[index].weight = parseFloat(value) || 0;
    setKpiWeights(updated);
  };

  // ---------------- Save Pillar Weights ----------------
  const savePillarWeights = async () => {
    try {
      if (pillarWeights.length > 0) {
        // Use today's date as reporting_period
        const today = new Date().toISOString().split("T")[0];

        const payload = pillarWeights.map((p) => ({
          company_id: companyId,
          reporting_period: today,
          pillar: p.pillar,
          pillar_weight: Number(p.pillar_weight),
        }));

        await axios.post("http://127.0.0.1:8000/weights/pillars", payload);
      }
      setSnackbar({
        open: true,
        message: "Pillar weights saved successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error saving pillar weights:", err);
      const msg = err.response?.data?.detail
        ? JSON.stringify(err.response.data.detail)
        : "Error saving Pillar weights. Please check the values.";
      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    }
  };

  // ---------------- Save KPI Weights ----------------
  const saveKpiWeights = async () => {
    try {
      if (kpiWeights.length > 0) {
        const today = new Date().toISOString().split("T")[0];

        const payload = kpiWeights.map((kpi) => ({
          company_id: companyId,
          reporting_period: today,
          kpi_code: kpi.kpi_code,
          weight: Number(kpi.weight),
        }));

        await axios.post("http://127.0.0.1:8000/weights/kpis", payload);
      }
      setSnackbar({
        open: true,
        message: "KPI weights saved successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error saving KPI weights:", err);
      const msg = err.response?.data?.detail
        ? JSON.stringify(err.response.data.detail)
        : "Error saving KPI weights. Please check the values.";
      setSnackbar({
        open: true,
        message: msg,
        severity: "error",
      });
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        ESG Weights
      </Typography>

      {/* Pillar Weights Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Pillar Weights (%)</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {pillarWeights.map((p, idx) => (
            <Grid size={{ xs: 12, sm: 4 }} key={p.pillar}>
              <TextField
                fullWidth
                type="number"
                label={p.pillar}
                value={p.pillar_weight}
                onChange={(e) => handlePillarChange(idx, e.target.value)}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={savePillarWeights}>
          Save Pillar Weights
        </Button>
      </Paper>

      {/* KPI Weights Section */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">KPI Weights (%)</Typography>
        {kpiWeights.map((kpi, idx) => (
          <Grid
            container
            spacing={2}
            alignItems="center"
            key={kpi.kpi_code}
            sx={{ mt: 1 }}
          >
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography>{kpi.kpi_code}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography>{kpi.kpi_description}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                value={kpi.weight}
                onChange={(e) => handleKpiChange(idx, e.target.value)}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
          </Grid>
        ))}
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveKpiWeights}>
          Save KPI Weights
        </Button>
      </Paper>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {typeof snackbar.message === "string"
            ? snackbar.message
            : JSON.stringify(snackbar.message)}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default WeightsPage;
