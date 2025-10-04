// src/components/ESGForm.jsx
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
import GroupsIcon from "@mui/icons-material/Groups";          // Workforce
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser"; // Cybersecurity & Risk
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";       // Customer & Community
import HandshakeIcon from "@mui/icons-material/Handshake";       // Stakeholder Engagement
import DomainIcon from "@mui/icons-material/Domain";             // Board & Management
import GavelIcon from "@mui/icons-material/Gavel";               // Ethics & Compliance
import ShieldMoonIcon from "@mui/icons-material/ShieldMoon";     // Shareholder Rights

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";

/* ----------------------------- styling helpers ---------------------------- */

const categoryMeta = {
  Environmental: {
    bg: "#E8F5E9",
    border: "#A5D6A7",
    title: "#2E7D32",
    chip: "success",
    darkTile: "#C8E6C9",
    icon: <EnergySavingsLeafIcon sx={{ color: "#2E7D32" }} />,
  },
  Social: {
    bg: "#E3F2FD",
    border: "#90CAF9",
    title: "#1565C0",
    chip: "info",
    darkTile: "#BBDEFB",
    icon: <GroupsIcon sx={{ color: "#1565C0" }} />,
  },
  Governance: {
    bg: "#F3E5F5",
    border: "#CE93D8",
    title: "#6A1B9A",
    chip: "secondary",
    darkTile: "#E1BEE7",
    icon: <DomainIcon sx={{ color: "#6A1B9A" }} />,
  },
};

const themeIcon = (theme) => {
  const map = {
    Carbon: <WhatshotIcon />,
    Energy: <EnergySavingsLeafIcon />,
    Water: <WaterDropIcon />,
    Waste: <RecyclingIcon />,
    "Climate Risk": <ShieldMoonIcon />,
    "Diversity & Inclusion": <Diversity3Icon />,
    "Health & Safety": <HealthAndSafetyIcon />,
    "Training & Development": <SchoolIcon />,
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

/* ------------------------------ field helpers ----------------------------- */

const isRegexEnum = (f) => f.type === "regex" && typeof f.pattern === "string";
const enumOptions = (pattern) => {
  // pattern like ^(disclosed|not_disclosed)$
  const m = pattern.match(/\(([^)]+)\)/);
  if (!m) return [];
  return m[1].split("|");
};

const formatMonth = (d) => format(d, "yyyy-MM-dd"); // we’ll store 1st of month by default

const API_BASE = "http://127.0.0.1:8000";
const API = {
  schema: `${API_BASE}/schema`,
  submit: `${API_BASE}/form-submissions/`,
  current: `${API_BASE}/form-submissions/current`,
};


/* ------------------------------ main component ---------------------------- */

export default function ESGForm() {
  const [tab, setTab] = useState(0); // 0 Detailed, 1 KPI
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  // selected month (reporting period)
  const [period, setPeriod] = useState(new Date());

  // form state per field name
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    msg: "",
  });

  // current data for autofill/echo
  const [currentData, setCurrentData] = useState({}); // { fieldName: {value, reporting_period} }

  /* ------------------------------ load schema ----------------------------- */

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get(API.schema);
        if (!mounted) return;

        // DEBUG: see exactly what came from backend
        console.log("DEBUG schema API response:", data);

        // Accept flat array (preferred) or legacy wrapped shapes
        const arr = Array.isArray(data) ? data : (data?.fields || data?.rules || []);

        // normalize array → ensure all required keys exist
        const norm = arr.map((f) => ({
          name: f.name,
          label: f.label || f.name,
          type: f.type,       // numeric | boolean | regex
          method: f.method,   // input | kpi
          theme: f.theme || "General",
          category: f.category || "Other",
          unit: f.unit || "",
          reference: f.reference || "",
          pattern: f.pattern || null,
        }));

        setSchema(norm);
      } catch (e) {
        console.error("Failed to load schema:", e);
        setSnackbar({
          open: true,
          severity: "error",
          msg: "Failed to load schema.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  /* ----------------------------- fetch current ---------------------------- */

  const fetchCurrentData = useCallback(async () => {
    try {
      const params = { company_id: 1, methodology: tab === 1 ? "kpi" : "input" };
      const { data } = await axios.get(API.current, { params });

      // DEBUG: see shape and applied params
      console.log("DEBUG submissions API response:", data, "params:", params);

      const map = {};
      const arr = Array.isArray(data) ? data : (data?.submissions || data?.data || []);

      arr.forEach((row) => {
        map[row.form_field] = {
          value: row.field_value,
          reporting_period: row.reporting_period,
        };
      });
      setCurrentData(map);
    } catch (e) {
      console.warn("Could not fetch current form submissions:", e);
    }
  }, [tab]);

  useEffect(() => {
    fetchCurrentData();
  }, [fetchCurrentData]);

  /* --------------------------- schema derived views ----------------------- */

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

  /* ------------------------------ input change ---------------------------- */

  const setField = (name, val) =>
    setValues((s) => ({
      ...s,
      [name]: val,
    }));

  const handleNumberChange = (name) => (e) => {
    // Block negative & scientific notation minus sign; allow decimals
    const raw = e.target.value;
    // Allow empty
    if (raw === "") return setField(name, "");
    // Only digits + optional single dot
    if (!/^\d*\.?\d*$/.test(raw)) return; // ignore illegal char
    setField(name, raw);
  };

  const handleBooleanChange = (name) => (e) => {
    setField(name, e.target.checked);
  };

  const handleRegexChange = (name) => (e) => {
    setField(name, e.target.value);
  };

  /* ------------------------------- validation ----------------------------- */

  const validateAll = useCallback(() => {
    if (!schema) return true;
    const next = {};
    const weCare = schema.filter((f) =>
      tab === 1 ? f.method === "kpi" : f.method !== "kpi"
    );

    for (const f of weCare) {
      const v = values[f.name];

      if (f.type === "numeric") {
        if (v === "" || v == null) continue; // allow blank submission
        const num = Number(v);
        if (Number.isNaN(num)) {
          next[f.name] = "Must be a number.";
        } else if (num < 0) {
          next[f.name] = "Negative values are not allowed.";
        }
      } else if (f.type === "boolean") {
        if (v !== true && v !== false && v != null) {
          next[f.name] = "Must be true/false.";
        }
      } else if (isRegexEnum(f)) {
        const opts = enumOptions(f.pattern);
        if (v && !opts.includes(String(v))) {
          next[f.name] = `Must be one of: ${opts.join(", ")}`;
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [schema, values, tab]);

  /* -------------------------------- submit -------------------------------- */

  const handleSubmit = async () => {
    if (!schema) return;

    const ok = validateAll();
    if (!ok) {
      setSnackbar({
        open: true,
        severity: "error",
        msg: "Please fix validation errors before submitting.",
      });
      return;
    }

    // Build submissions only for fields present in values
    const allFields = schema.filter((f) =>
      tab === 1 ? f.method === "kpi" : f.method !== "kpi"
    );

    const rp = formatMonth(period);
    const payloads = [];

    for (const f of allFields) {
      if (!(f.name in values)) continue; // unchanged
      let val = values[f.name];

      // Normalize by type
      if (f.type === "numeric") {
        if (val === "" || val == null) continue; // skip blank
        const n = Number(val);
        if (Number.isNaN(n)) continue; // guard
        if (n < 0) continue; // double-guard; backend also blocks
        val = n;
      } else if (f.type === "boolean") {
        // Already boolean from Switch
        if (val === "" || val == null) continue;
        val = Boolean(val);
      } else if (isRegexEnum(f)) {
        if (!val) continue;
        val = String(val);
      } else {
        // Fallback texty types if any
        if (val === "" || val == null) continue;
        val = String(val);
      }

      payloads.push({
        company_id: 1,
        reporting_period: rp,
        form_field: f.name,
        field_value: val,
        is_kpi: f.method === "kpi",
        methodology: f.method === "kpi" ? "kpi" : "input",
      });
    }

    if (payloads.length === 0) {
      setSnackbar({
        open: true,
        severity: "info",
        msg: "Nothing to submit.",
      });
      return;
    }

    try {
      // submit sequentially to keep errors obvious
      for (const p of payloads) {
        await axios.post(API.submit, p);
      }
      setSnackbar({
        open: true,
        severity: "success",
        msg: "Saved successfully.",
      });
      setValues({});
      fetchCurrentData();
    } catch (err) {
      console.error("Error submitting:", err);
      // try to extract detail from FastAPI
      let msg = "Failed to save.";
      if (err?.response?.data?.detail) {
        msg = Array.isArray(err.response.data.detail)
          ? err.response.data.detail.map((d) => d.msg || String(d)).join("; ")
          : String(err.response.data.detail);
      }
      setSnackbar({
        open: true,
        severity: "error",
        msg,
      });
    }
  };

  /* ------------------------------ field render ---------------------------- */

  const Field = ({ f }) => {
    const cat = categoryMeta[f.category] || categoryMeta.Environmental;
    const current = currentData[f.name]?.value;

    if (f.type === "numeric") {
      return (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {f.label}
            </Typography>
            {f.unit && <Chip size="small" label={f.unit} color={cat.chip} />}
            {f.reference && (
              <Tooltip title={f.reference}>
                <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
              </Tooltip>
            )}
          </Stack>

          <TextField
            value={values[f.name] ?? ""}
            onChange={handleNumberChange(f.name)}
            placeholder={current != null ? `Current: ${current}` : "0"}
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
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {f.label}
            </Typography>
            {f.reference && (
              <Tooltip title={f.reference}>
                <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
              </Tooltip>
            )}
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(values[f.name] ?? false)}
                onChange={handleBooleanChange(f.name)}
              />
            }
            label={Boolean(values[f.name] ?? false) ? "Yes" : "No"}
          />
          {errors[f.name] && (
            <Typography variant="caption" color="error">
              {errors[f.name]}
            </Typography>
          )}
        </Stack>
      );
    }

    if (isRegexEnum(f)) {
      const options = enumOptions(f.pattern);
      return (
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {f.label}
            </Typography>
            {f.reference && (
              <Tooltip title={f.reference}>
                <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
              </Tooltip>
            )}
          </Stack>

          <TextField
            select
            SelectProps={{ native: true }}
            value={values[f.name] ?? ""}
            onChange={handleRegexChange(f.name)}
            fullWidth
            error={Boolean(errors[f.name])}
            helperText={errors[f.name] || " "}
          >
            <option value="" />
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replaceAll("_", " ")}
              </option>
            ))}
          </TextField>
        </Stack>
      );
    }

    // fallback text (rare in your schema)
    return (
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight={600}>
            {f.label}
          </Typography>
          {f.reference && (
            <Tooltip title={f.reference}>
              <InfoOutlinedIcon fontSize="small" sx={{ opacity: 0.7 }} />
            </Tooltip>
          )}
        </Stack>

        <TextField
          value={values[f.name] ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
          fullWidth
        />
      </Stack>
    );
  };

  /* -------------------------------- layout -------------------------------- */

  const CategoryCard = ({ category, children }) => {
    const meta = categoryMeta[category] || categoryMeta.Environmental;
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${meta.border}`,
          background: meta.bg,
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1.25}>
              {meta.icon}
              <Typography variant="h6" sx={{ color: meta.title, fontWeight: 700 }}>
                {category}
              </Typography>
              <Chip size="small" color={meta.chip} label="schema-driven" />
            </Stack>
          }
          sx={{ pb: 0.5 }}
        />
        <CardContent sx={{ pt: 1 }}>{children}</CardContent>
      </Card>
    );
  };

  const ThemeAccordion = ({ theme, children, category }) => {
    const meta = categoryMeta[category] || categoryMeta.Environmental;
    return (
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.06)",
          mb: 1.5,
          overflow: "hidden",
          background: meta.darkTile,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {themeIcon(theme)}
            <Typography fontWeight={700}>{theme}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 2,
            }}
          >
            {children}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Box p={3} display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box p={3}>
        <Alert severity="error">Schema not available.</Alert>
      </Box>
    );
  }

  return (
    <Box p={2} component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          ESG Data Entry
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={["year", "month", "day"]}
            label="Reporting period"
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

      {/* categories */}
      <Stack spacing={2}>
        {Object.entries(schemaByCategoryTheme).map(([category, themes]) => (
          <CategoryCard key={category} category={category}>
            <Stack spacing={1.5}>
              {Object.entries(themes).map(([theme, fields]) => (
                <ThemeAccordion key={theme} theme={theme} category={category}>
                  {fields.map((f) => (
                    <Box key={f.name} sx={{ gridColumn: "span 6" }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "background.paper",
                          boxShadow:
                            "0 1px 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <Field f={f} />
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            variant="outlined"
                            label={f.method === "kpi" ? "KPI" : "Input"}
                          />
                          <Chip size="small" variant="outlined" label={f.name} />
                          {currentData[f.name]?.reporting_period && (
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              last: {currentData[f.name]?.reporting_period}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  ))}
                </ThemeAccordion>
              ))}
            </Stack>
          </CategoryCard>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => setValues({})}>
          Clear changes
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
