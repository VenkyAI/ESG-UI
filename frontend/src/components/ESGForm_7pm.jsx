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
import Diversity3Icon from "@mui/icons-material/Diversity3";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HandshakeIcon from "@mui/icons-material/Handshake";
import DomainIcon from "@mui/icons-material/Domain";
import GavelIcon from "@mui/icons-material/Gavel";
import ShieldMoonIcon from "@mui/icons-material/ShieldMoon";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const API = {
  schema: `${API_BASE}/schema`,
  submit: `${API_BASE}/form-submissions/`,
  current: `${API_BASE}/form-submissions/current`,
  historic: `${API_BASE}/form-submissions/historic`,
};

// ----------------------------------------------------------------------
// ESGForm Component
// ----------------------------------------------------------------------
export default function ESGForm({ schema }) {
  // ---------------- state ----------------
  const [tab, setTab] = useState(0); // 0=input, 1=kpi
  const [period, setPeriod] = useState(new Date());
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });

  const [currentData, setCurrentData] = useState({});
  const [historicData, setHistoricData] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState("current");

  // track user typing vs prefill
  const [seededFromCurrent, setSeededFromCurrent] = useState(false);

  // ---------------- helpers ----------------
  const formatMonth = (d) => format(d, "yyyy-MM-dd");
  const toggleAccordion = (key) =>
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  const [openAccordions, setOpenAccordions] = useState({});

  const categoryMeta = {
    Environmental: {
      icon: <EnergySavingsLeafIcon color="success" />,
      title: "#2e7d32",
      bg: "#f1f8e9",
      border: "#aed581",
    },
    Social: {
      icon: <GroupsIcon color="primary" />,
      title: "#0d47a1",
      bg: "#e3f2fd",
      border: "#64b5f6",
    },
    Governance: {
      icon: <GavelIcon color="secondary" />,
      title: "#4a148c",
      bg: "#f3e5f5",
      border: "#ba68c8",
    },
  };

  const themeIcon = (theme) => {
    const map = {
      Carbon: <WhatshotIcon />,
      Energy: <EnergySavingsLeafIcon />,
      Water: <WaterDropIcon />,
      Waste: <RecyclingIcon />,
      "Climate Risk": <ShieldMoonIcon />,
      Health: <HealthAndSafetyIcon />,
      Workforce: <GroupsIcon />,
      "Customer & Community": <PeopleAltIcon />,
      "Board & Management": <DomainIcon />,
      "Ethics & Compliance": <GavelIcon />,
      "Shareholder Rights": <ShieldMoonIcon />,
      "Cybersecurity & Risk": <VerifiedUserIcon />,
      "Stakeholder Engagement": <HandshakeIcon />,
    };
    return map[theme] || <InfoOutlinedIcon />;
  };

  const isRegexEnum = (f) => f.type === "regex" && typeof f.pattern === "string";
  const enumOptions = (pattern) => {
    const m = pattern.match(/\(([^)]+)\)/);
    return m ? m[1].split("|") : [];
  };

  // ----------------------------------------------------------------------
  // Fetch helpers
  // ----------------------------------------------------------------------
  const seedValuesFromMapOnce = useCallback((map) => {
    setValues((prev) => {
      const next = { ...prev };
      Object.entries(map).forEach(([name, info]) => {
        if (next[name] === undefined || next[name] === "") next[name] = info?.value ?? "";
      });
      return next;
    });
  }, []);

  const fetchCurrentData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API.current, {
        params: { company_id: 1, is_current: true },
      });
      const arr = Array.isArray(data) ? data : data?.data || [];
      const map = {};
      arr.forEach((r) => {
        map[r.form_field] = { value: r.field_value, reporting_period: r.reporting_period };
      });
      setCurrentData(map);
      if (!seededFromCurrent) {
        seedValuesFromMapOnce(map);
        setSeededFromCurrent(true);
      }
      setSnackbar({ open: true, severity: "success", msg: "Loaded current ESG data." });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to load current ESG data." });
    } finally {
      setLoading(false);
    }
  }, [seedValuesFromMapOnce, seededFromCurrent]);

  const fetchHistoricData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API.historic, {
        params: { company_id: 1, is_current: false },
      });
      const arr = Array.isArray(data) ? data : data?.data || [];
      const map = {};
      arr.forEach((r) => {
        map[r.form_field] = { value: r.field_value, reporting_period: r.reporting_period };
      });
      setHistoricData(map);
      setSnackbar({ open: true, severity: "success", msg: "Loaded historic ESG data." });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to load historic ESG data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (schema && !seededFromCurrent) fetchCurrentData();
  }, [schema, fetchCurrentData, seededFromCurrent]);

  // ----------------------------------------------------------------------
  // Input handlers (controlled, no freeze)
  // ----------------------------------------------------------------------
  const setField = useCallback((name, val) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  }, []);

  const handleNumberChange = (name) => (e) => {
    const val = e.target.value;
    if (/^-?\d*\.?\d*$/.test(val)) setField(name, val);
  };

  const handleBooleanChange = (name) => (e) => {
    setField(name, e.target.checked);
  };

  const handleRegexChange = (name) => (e) => {
    setField(name, e.target.value);
  };

  // ----------------------------------------------------------------------
  // handleSubmit
  // ----------------------------------------------------------------------
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = Object.entries(values)
        .filter(([k]) => !k.endsWith("_isKpi"))
        .map(([form_field, field_value]) => ({
          company_id: 1,
          reporting_period: formatMonth(period),
          form_field,
          field_value,
          is_kpi: Boolean(values[`${form_field}_isKpi`]),
          methodology: tab === 1 ? "kpi" : "input",
        }));

      await axios.post(API.submit, payload);
      setSnackbar({ open: true, severity: "success", msg: "Data saved successfully." });
    } catch (e) {
      console.error("Error submitting:", e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to save data." });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // Group schema by category/theme
  // ----------------------------------------------------------------------
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

  // ----------------------------------------------------------------------
  // Field Renderer
  // ----------------------------------------------------------------------
  const Field = ({ f }) => {
    const current = currentData[f.name]?.value ?? "";
    const val = values[f.name] ?? "";

    if (f.type === "numeric") {
      return (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography fontWeight={600}>{f.label}</Typography>
            {f.unit && <Chip size="small" label={f.unit} />}
            {f.reference && (
              <Tooltip title={f.reference}>
                <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
              </Tooltip>
            )}
          </Stack>
          <TextField
            value={val}
            onChange={handleNumberChange(f.name)}
            placeholder={current ? `Current: ${current}` : "0"}
            fullWidth
            inputProps={{ inputMode: "decimal" }}
            InputProps={{
              endAdornment: f.unit ? (
                <InputAdornment position="end">{f.unit}</InputAdornment>
              ) : null,
            }}
            error={Boolean(errors[f.name])}
            helperText={errors[f.name] || " "}
          />
        </Stack>
      );
    }

    if (f.type === "boolean") {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(values[f.name])}
              onChange={handleBooleanChange(f.name)}
            />
          }
          label={f.label}
        />
      );
    }

    if (isRegexEnum(f)) {
      const options = enumOptions(f.pattern);
      return (
        <TextField
          select
          SelectProps={{ native: true }}
          value={val}
          onChange={handleRegexChange(f.name)}
          fullWidth
        >
          <option value="" />
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        value={val}
        onChange={(e) => setField(f.name, e.target.value)}
        fullWidth
      />
    );
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  if (loading)
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Box p={2} component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          ESG Data Entry
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Reporting Period"
            views={["year", "month", "day"]}
            value={period}
            onChange={(d) => d && setPeriod(d)}
            slotProps={{ textField: { size: "small" } }}
          />
        </LocalizationProvider>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Detailed Entry" />
        <Tab label="Direct KPI Entry" />
      </Tabs>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => { fetchCurrentData(); setDialogTab("current"); setDialogOpen(true); }}>
          Fetch ESG Data (Current)
        </Button>
        <Button variant="outlined" onClick={() => { fetchHistoricData(); setDialogTab("historic"); setDialogOpen(true); }}>
          Fetch ESG Data (Historic)
        </Button>
      </Stack>

      <Stack spacing={2}>
        {Object.entries(schemaByCategoryTheme).map(([category, themes]) => (
          <Card
            key={category}
            sx={{
              border: `1px solid ${categoryMeta[category]?.border || "#ccc"}`,
              borderRadius: 2,
              background: categoryMeta[category]?.bg,
            }}
          >
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  {categoryMeta[category]?.icon}
                  <Typography fontWeight={700} color={categoryMeta[category]?.title}>
                    {category}
                  </Typography>
                </Stack>
              }
            />
            <CardContent>
              {Object.entries(themes).map(([theme, fields]) => (
                <Accordion
                  key={theme}
                  expanded={openAccordions[`${category}-${theme}`] || false}
                  onChange={() => toggleAccordion(`${category}-${theme}`)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {themeIcon(theme)}
                      <Typography fontWeight={600}>{theme}</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {fields.map((f) => (
                        <Box key={f.name} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fff" }}>
                          <Field f={f} />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={Boolean(values[`${f.name}_isKpi`])}
                                onChange={(e) =>
                                  setValues((prev) => ({
                                    ...prev,
                                    [`${f.name}_isKpi`]: e.target.checked,
                                  }))
                                }
                              />
                            }
                            label="Mark as KPI"
                          />
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => setValues({})}>
          Clear
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>ESG Data</DialogTitle>
        <DialogContent>
          <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)}>
            <Tab value="current" label="Current" />
            <Tab value="historic" label="Historic" />
          </Tabs>
          {dialogTab === "current" && (
            <Box sx={{ mt: 2 }}>
              {Object.entries(currentData).map(([k, v]) => (
                <Typography key={k} variant="body2">
                  <strong>{k}:</strong> {v.value} ({v.reporting_period})
                </Typography>
              ))}
            </Box>
          )}
          {dialogTab === "historic" && (
            <Box sx={{ mt: 2 }}>
              {Object.entries(historicData).map(([k, v]) => (
                <Typography key={k} variant="body2">
                  <strong>{k}:</strong> {v.value} ({v.reporting_period})
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
