import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Chip,
  Divider,
  Stack,
  Button,
  Snackbar,
  Alert,
  InputAdornment,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import RecyclingIcon from "@mui/icons-material/Recycling";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import GroupsIcon from "@mui/icons-material/Groups";
import GavelIcon from "@mui/icons-material/Gavel";
import ShieldMoonIcon from "@mui/icons-material/ShieldMoon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const API = {
  schema: `${API_BASE}/schema`,
  submit: `${API_BASE}/form-submissions/`,
  current: `${API_BASE}/form-submissions/current`,
  historic: `${API_BASE}/form-submissions/historic`,
};

const themeIcon = (theme) => {
  const map = {
    Carbon: <WhatshotIcon />,
    Energy: <EnergySavingsLeafIcon />,
    Water: <WaterDropIcon />,
    Waste: <RecyclingIcon />,
    "Climate Risk": <ShieldMoonIcon />,
    Workforce: <GroupsIcon />,
    Governance: <GavelIcon />,
  };
  return map[theme] || <InfoOutlinedIcon />;
};

const isRegexEnum = (f) => f.type === "regex" && typeof f.pattern === "string";
const enumOptions = (pattern) => {
  const m = pattern.match(/\(([^)]+)\)/);
  return m ? m[1].split("|") : [];
};

// =====================================================================
//                             ESGForm
// =====================================================================
export default function ESGForm({ schema }) {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState(new Date());
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });
  const [openAccordions, setOpenAccordions] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [historicData, setHistoricData] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState("current");

  const toggleAccordion = (key) =>
    setOpenAccordions((p) => ({ ...p, [key]: !p[key] }));

  // ---------------- Fetches ----------------
  const fetchCurrentData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API.current, { params: { company_id: 1, is_current: true } });
      const arr = Array.isArray(data) ? data : data?.data || [];
      const map = {};
      arr.forEach((r) => {
        map[r.form_field] = { value: r.field_value, reporting_period: r.reporting_period };
      });
      setCurrentData(map);
      setDialogTab("current");
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to load current ESG data." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistoricData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API.historic, { params: { company_id: 1, is_current: false } });
      const arr = Array.isArray(data) ? data : data?.data || [];
      const map = {};
      arr.forEach((r) => {
        map[r.form_field] = { value: r.field_value, reporting_period: r.reporting_period };
      });
      setHistoricData(map);
      setDialogTab("historic");
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to load historic ESG data." });
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- Handlers ----------------
  const setField = useCallback((name, val) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  }, []);

  const handleSubmit = async () => {
    try {
      const payload = Object.entries(values).map(([name, val]) => ({
        company_id: 1,
        reporting_period: period.toISOString().slice(0, 10),
        form_field: name,
        field_value: val,
        is_kpi: Boolean(values[`${name}_isKpi`]),
      }));
      await axios.post(API.submit, payload);
      setSnackbar({ open: true, severity: "success", msg: "Form saved successfully." });
    } catch (e) {
      console.error("Error submitting:", e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to save form." });
    }
  };

  // ---------------- Category meta ----------------
  const categoryMeta = {
    Environmental: { icon: <EnergySavingsLeafIcon color="success" />, bg: "#f1f8e9", border: "#aed581" },
    Social: { icon: <GroupsIcon color="primary" />, bg: "#e3f2fd", border: "#64b5f6" },
    Governance: { icon: <GavelIcon color="secondary" />, bg: "#f3e5f5", border: "#ba68c8" },
  };

  const schemaByCategoryTheme = useMemo(() => {
    if (!schema) return {};
    const filtered = schema.filter((f) =>
      tab === 1 ? f.method === "kpi" : f.method !== "kpi"
    );
    const byCat = {};
    for (const f of filtered) {
      if (!byCat[f.category]) byCat[f.category] = {};
      if (!byCat[f.category][f.theme]) byCat[f.category][f.theme] = [];
      byCat[f.category][f.theme].push(f);
    }
    return byCat;
  }, [schema, tab]);

  // ---------------- Field render ----------------
  const Field = React.memo(({ f }) => {
  console.log("Rendering field:", f.name, "value=", values[f.name]);
  const current = currentData[f.name]?.value;
  const val = values[f.name] ?? "";
  const handleChange = (e) => {
  const newVal = e.target.value;
  setValues((prev) => ({
    ...prev,
    [f.name]: newVal,
  }));
};

   {
    if (f.type === "numeric") {
      return (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={600}>{f.label}</Typography>
            {f.unit && <Chip size="small" label={f.unit} />}
            {f.reference && (
              <Tooltip title={f.reference}><InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} /></Tooltip>
            )}
          </Stack>
          <TextField
            value={values[f.name] ?? ""}
            onChange={(e) => setField(f.name, e.target.value)}
            placeholder="Enter value"
            fullWidth
            inputProps={{ inputMode: "decimal" }}
            InputProps={{ endAdornment: f.unit ? <InputAdornment position="end">{f.unit}</InputAdornment> : null }}
          />
        </Stack>
      );
    }
    if (f.type === "boolean") {
      return (
        <FormControlLabel
          control={<Switch checked={Boolean(values[f.name])} onChange={(e) => setField(f.name, e.target.checked)} />}
          label={f.label}
        />
      );
    }
    if (isRegexEnum(f)) {
      const options = enumOptions(f.pattern);
      return (
        <TextField select fullWidth value={values[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)}>
          <option value="" />
          {options.map((o) => (
            <option key={o} value={o}>{o.replaceAll("_", " ")}</option>
          ))}
        </TextField>
      );
    }
    return (
      <TextField fullWidth value={values[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)} placeholder="Enter text" />
    );
  };

  if (loading) {
    return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
  }

  return (
    <Box p={2} component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>ESG Data Entry</Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker label="Reporting period" value={period} onChange={(d) => d && setPeriod(d)} slotProps={{ textField: { size: "small" } }} />
        </LocalizationProvider>
      </Stack>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Choose method to enter ESG data
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Detailed Entry" />
        <Tab label="Direct KPI Entry" />
      </Tabs>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={fetchCurrentData}>Fetch ESG Data (Current)</Button>
        <Button variant="outlined" onClick={fetchHistoricData}>Fetch ESG Data (Historic)</Button>
      </Stack>

      <Stack spacing={2}>
        {Object.entries(schemaByCategoryTheme).map(([category, themes]) => (
          <Card key={category} elevation={0}
            sx={{ borderRadius: 3, border: `1px solid ${categoryMeta[category]?.border}`, background: categoryMeta[category]?.bg }}>
            <CardHeader title={<Stack direction="row" alignItems="center" spacing={1}>{categoryMeta[category]?.icon}<Typography fontWeight={700}>{category}</Typography></Stack>} />
            <CardContent>
              {Object.entries(themes).map(([theme, fields]) => (
                <Accordion key={theme} expanded={openAccordions[theme]} onChange={() => toggleAccordion(theme)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={1}>{themeIcon(theme)}<Typography fontWeight={600}>{theme}</Typography></Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
                      {fields.map((f) => (
                        <Box key={f.name} sx={{ gridColumn: "span 6" }}>
                          <Field f={f} />
                          <FormControlLabel
                            control={<Switch checked={Boolean(values[`${f.name}_isKpi`])} onChange={(e) => setValues((prev) => ({ ...prev, [`${f.name}_isKpi`]: e.target.checked }))} />}
                            label="Mark as KPI"
                          />
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => setValues({})}>Clear changes</Button>
        <Button variant="contained" onClick={handleSubmit}>Save</Button>
      </Stack>

      {/* Dialog for fetched data */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>ESG Data ({dialogTab})</DialogTitle>
        <DialogContent dividers>
          {(dialogTab === "current" ? currentData : historicData) &&
          Object.keys(dialogTab === "current" ? currentData : historicData).length > 0 ? (
            Object.entries(dialogTab === "current" ? currentData : historicData).map(([field, info]) => (
              <Typography key={field} sx={{ mb: 1 }}>
                <strong>{field}:</strong> {info.value} (period {info.reporting_period})
              </Typography>
            ))
          ) : (
            <Typography>No data available.</Typography>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}