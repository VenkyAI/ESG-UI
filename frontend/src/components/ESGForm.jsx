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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
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

// --------------------------------------------------------------------
// Reusable Field
// --------------------------------------------------------------------
const Field = React.memo(function Field({ f, values, setField }) {
  const val = values[f.name] ?? "";
  const handleChange = (e) => setField(f.name, e.target.value);

  if (f.type === "numeric") {
    return (
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight={600}>
            {f.label}
          </Typography>
          {f.unit && <Chip size="small" label={f.unit} />}
          {f.reference && (
            <Tooltip title={f.reference}>
              <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
            </Tooltip>
          )}
        </Stack>
        <TextField
          value={val}
          onChange={handleChange}
          placeholder="Enter value"
          fullWidth
          inputProps={{ inputMode: "decimal" }}
          InputProps={{
            endAdornment: f.unit ? (
              <InputAdornment position="end">{f.unit}</InputAdornment>
            ) : null,
          }}
        />
      </Stack>
    );
  }

  if (f.type === "boolean") {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(val)}
            onChange={(e) => setField(f.name, e.target.checked)}
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
        fullWidth
        label={f.label}
        value={val}
        onChange={handleChange}
      >
        <MenuItem value="">Select...</MenuItem>
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            {o.replaceAll("_", " ")}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      fullWidth
      label={f.label}
      value={val}
      onChange={handleChange}
      placeholder="Enter text"
    />
  );
});

// --------------------------------------------------------------------
// Main ESG Form
// --------------------------------------------------------------------
export default function ESGForm({ schema }) {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState(new Date());
  const [values, setValues] = useState({});
  const [kpiFlags, setKpiFlags] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", severity: "info" });
  const [openAccordions, setOpenAccordions] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [historicData, setHistoricData] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState("current");

  const toggleAccordion = (key) =>
    setOpenAccordions((p) => ({ ...p, [key]: !p[key] }));

  const setField = useCallback((name, val) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  }, []);

  const setKpiFlag = useCallback((name, val) => {
    setKpiFlags((prev) => ({ ...prev, [name]: val }));
  }, []);

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

  // ---------------- Submit ----------------
  const handleSubmit = async () => {
    try {
      const payload = Object.entries(values)
        .filter(([_, val]) => val !== "" && val !== null && val !== undefined)
        .map(([name, val]) => ({
          company_id: 1,
          reporting_period: period.toISOString().slice(0, 10),
          form_field: name,
          field_value: String(val),
          is_current: true,
          is_kpi: Boolean(kpiFlags[name]),
          methodology: tab === 1 ? "kpi" : "input",
        }));

      if (payload.length === 0) {
        setSnackbar({ open: true, severity: "warning", msg: "No values to submit." });
        return;
      }

      // ✅ Send list (we'll fix backend to accept it)
      await axios.post(`${API.submit}batch`, payload);
      setSnackbar({ open: true, severity: "success", msg: "Form saved successfully." });
    } catch (e) {
      console.error("Error submitting:", e);
      setSnackbar({ open: true, severity: "error", msg: "Failed to save form." });
    }
  };

  // ---------------- Category Meta ----------------
  const categoryMeta = {
    Environmental: { icon: <EnergySavingsLeafIcon color="success" />, bg: "#E8F5E9", border: "#388E3C" },
    Social: { icon: <GroupsIcon color="primary" />, bg: "#E3F2FD", border: "#1976D2" },
    Governance: { icon: <GavelIcon color="secondary" />, bg: "#F3E5F5", border: "#7B1FA2" },
  };

  const schemaByCategoryTheme = useMemo(() => {
    if (!schema || !Array.isArray(schema)) return {};
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

  // ---------------- Render ----------------
  return (
    <Box p={2}>
      <Card variant="outlined">
        <CardHeader
          title="ESG Data Entry"
          subheader="Fill out your ESG metrics below"
          action={
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={fetchCurrentData}>Current</Button>
              <Button variant="outlined" onClick={fetchHistoricData}>Historic</Button>
            </Stack>
          }
        />
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Inputs" />
            <Tab label="KPIs" />
          </Tabs>
          <Divider sx={{ my: 2 }} />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Reporting Period"
              value={period}
              onChange={(newVal) => setPeriod(newVal || new Date())}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          {loading && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          )}

          {!loading &&
            Object.entries(schemaByCategoryTheme).map(([cat, themes]) => {
              const meta = categoryMeta[cat] || {};
              return (
                <Box key={cat} my={2}>
                  <Typography
                    variant="h6"
                    sx={{
                      background: meta.bg,
                      borderLeft: `6px solid ${meta.border}`,
                      p: 1,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {meta.icon} {cat}
                  </Typography>
                  {Object.entries(themes).map(([theme, fields]) => (
                    <Accordion
                      key={theme}
                      expanded={!!openAccordions[theme]}
                      onChange={() => toggleAccordion(theme)}
                      sx={{ mt: 1 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {themeIcon(theme)}
                          <Typography>{theme}</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {fields.map((f) => (
                            <Box key={f.name}>
                              <Field f={f} values={values} setField={setField} />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(kpiFlags[f.name])}
                                    onChange={(e) => setKpiFlag(f.name, e.target.checked)}
                                  />
                                }
                                label="Mark as KPI"
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              );
            })}

          <Divider sx={{ my: 2 }} />
          <Button variant="contained" onClick={handleSubmit}>Save Form</Button>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {dialogTab === "current" ? "Current ESG Data" : "Historic ESG Data"}
        </DialogTitle>
        <DialogContent dividers>
          {(dialogTab === "current" ? currentData : historicData) &&
            Object.entries(dialogTab === "current" ? currentData : historicData).map(([k, v]) => (
              <Typography key={k}>
                <b>{String(k)}</b>: {String(v?.value ?? "")} ({String(v?.reporting_period ?? "")})
              </Typography>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
