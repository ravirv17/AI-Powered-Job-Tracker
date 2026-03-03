import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

type Status = "Applied" | "Interview" | "Offer" | "Rejected";

type JobApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  link: string;
  status: Status;
  appliedDate: string;
  notes: string;
};

const STATUSES: Status[] = ["Applied", "Interview", "Offer", "Rejected"];

const APPLICATIONS_STORAGE_KEY = "ai-job-tracker-applications";
const RESUME_STORAGE_KEY = "ai-job-tracker-resume";

function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JobApplication[];
  } catch {
    return [];
  }
}

function saveApplications(apps: JobApplication[]) {
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
}

function loadResume(): string {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return "";
    return raw;
  } catch {
    return "";
  }
}

function saveResume(text: string) {
  localStorage.setItem(RESUME_STORAGE_KEY, text);
}

export const App = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");

  const [form, setForm] = useState<Omit<JobApplication, "id">>({
    company: "",
    role: "",
    location: "",
    link: "",
    status: "Applied",
    appliedDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setApplications(loadApplications());
    setResumeText(loadResume());
  }, []);

  useEffect(() => {
    saveApplications(applications);
  }, [applications]);

  useEffect(() => {
    saveResume(resumeText);
  }, [resumeText]);

  const filteredApps = useMemo(() => {
    if (filterStatus === "All") return applications;
    return applications.filter((a) => a.status === filterStatus);
  }, [applications, filterStatus]);

  const analyticsByStatus = useMemo(
    () =>
      STATUSES.map((status) => ({
        status,
        count: applications.filter((a) => a.status === status).length,
      })),
    [applications]
  );

  const analyticsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of applications) {
      const monthKey = app.appliedDate?.slice(0, 7) || "Unknown";
      map.set(monthKey, (map.get(monthKey) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, count]) => ({ month, count }));
  }, [applications]);

  function handleAddApplication() {
    if (!form.company.trim() || !form.role.trim()) return;
    const newApp: JobApplication = {
      id: crypto.randomUUID(),
      ...form,
    };
    setApplications((prev) => [newApp, ...prev]);
    setForm((prev) => ({
      ...prev,
      company: "",
      role: "",
      location: "",
      link: "",
      notes: "",
      status: "Applied",
    }));
  }

  function handleStatusChange(id: string, status: Status) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleGetSuggestions() {
    setAiError(null);
    setAiSuggestions("");
    if (!resumeText.trim()) {
      setAiError("Please paste your resume text first.");
      return;
    }
    setAiLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/ai-suggestions", {
        resumeText,
        jobDescription,
      });
      setAiSuggestions(response.data.suggestions || "");
    } catch (err: any) {
      setAiError(
        err?.response?.data?.error ||
          "Could not fetch AI suggestions. Make sure the backend is running and your API key is set."
      );
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "#0b1120", py: 4 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{ mb: 2, fontWeight: 700, color: "#e5e7eb" }}
          >
            AI-Powered Job Tracker
          </Typography>
          <Typography sx={{ mb: 4, color: "#9ca3af" }}>
            Add and track job applications, visualize your pipeline, store your
            resume, and get AI-powered suggestions for your job search.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1.5fr" },
              gap: 3,
              mb: 3,
            }}
          >
            <Paper
              elevation={3}
              sx={{ p: 3, bgcolor: "#020617", borderRadius: 3 }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: "#e5e7eb" }}
              >
                Add Application
              </Typography>

              <Box
                component="form"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddApplication();
                }}
              >
                <TextField
                  label="Company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  required
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ sx: { color: "#9ca3af" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                />
                <TextField
                  label="Role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  required
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ sx: { color: "#9ca3af" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                />
                <TextField
                  label="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ sx: { color: "#9ca3af" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                />
                <TextField
                  label="Job link"
                  value={form.link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link: e.target.value }))
                  }
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ sx: { color: "#9ca3af" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                />
                <TextField
                  type="date"
                  label="Applied date"
                  value={form.appliedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, appliedDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true, sx: { color: "#9ca3af" } }}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                />
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#9ca3af" }}>Status</InputLabel>
                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as Status }))
                    }
                    sx={{ color: "#e5e7eb" }}
                  >
                    {STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  multiline
                  minRows={2}
                  fullWidth
                  sx={{
                    gridColumn: { xs: "1 / -1", sm: "1 / -1" },
                    "& .MuiOutlinedInput-root": {
                      color: "#e5e7eb",
                    },
                  }}
                  InputLabelProps={{ sx: { color: "#9ca3af" } }}
                />
                <Box
                  sx={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mt: 1,
                      bgcolor: "#6366f1",
                      textTransform: "none",
                      px: 3,
                      "&:hover": { bgcolor: "#4f46e5" },
                    }}
                  >
                    Add Application
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={3}
              sx={{ p: 3, bgcolor: "#020617", borderRadius: 3 }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: "#e5e7eb" }}
              >
                Resume & AI Suggestions
              </Typography>

              <TextField
                label="Resume (paste text)"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                multiline
                minRows={4}
                fullWidth
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "#e5e7eb",
                  },
                }}
                InputLabelProps={{ sx: { color: "#9ca3af" } }}
              />

              <TextField
                label="Job description (optional)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "#e5e7eb",
                  },
                }}
                InputLabelProps={{ sx: { color: "#9ca3af" } }}
              />

              <Button
                variant="contained"
                onClick={handleGetSuggestions}
                disabled={aiLoading}
                sx={{
                  mb: 2,
                  bgcolor: "#22c55e",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#16a34a" },
                }}
              >
                {aiLoading ? "Getting suggestions..." : "Get AI Suggestions"}
              </Button>

              {aiError && (
                <Typography sx={{ color: "#f97373", mb: 1 }}>
                  {aiError}
                </Typography>
              )}

              {aiSuggestions && (
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 1,
                    p: 2,
                    maxHeight: 260,
                    overflowY: "auto",
                    bgcolor: "#020617",
                    borderColor: "#1f2937",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, color: "#9ca3af" }}
                  >
                    AI Suggestions
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", color: "#e5e7eb" }}
                  >
                    {aiSuggestions}
                  </Typography>
                </Paper>
              )}
            </Paper>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1.5fr" },
              gap: 3,
            }}
          >
            <Paper
              elevation={3}
              sx={{ p: 3, bgcolor: "#020617", borderRadius: 3 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#e5e7eb" }}
                >
                  Applications
                </Typography>
                <FormControl size="small">
                  <InputLabel sx={{ color: "#9ca3af" }}>Filter</InputLabel>
                  <Select
                    label="Filter"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as Status | "All")
                    }
                    sx={{ color: "#e5e7eb", minWidth: 140 }}
                  >
                    <MenuItem value="All">All statuses</MenuItem>
                    {STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {filteredApps.length === 0 ? (
                <Typography sx={{ color: "#6b7280" }}>
                  No applications yet. Start by adding one above.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {filteredApps.map((app) => (
                    <Paper
                      key={app.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: "#020617",
                        borderColor: "#1f2937",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "#e5e7eb",
                            }}
                          >
                            {app.role}{" "}
                            <Typography
                              component="span"
                              sx={{ color: "#9ca3af" }}
                            >
                              @ {app.company}
                            </Typography>
                          </Typography>
                          <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                            {app.location || "Location N/A"} • Applied{" "}
                            {app.appliedDate || "N/A"}
                          </Typography>
                          {app.link && (
                            <Typography
                              component="a"
                              href={app.link}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                color: "#6366f1",
                                fontSize: 13,
                                display: "inline-block",
                                mt: 0.5,
                              }}
                            >
                              View posting
                            </Typography>
                          )}
                          {app.notes && (
                            <Typography
                              sx={{
                                mt: 0.5,
                                color: "#9ca3af",
                                fontSize: 13,
                              }}
                            >
                              {app.notes}
                            </Typography>
                          )}
                        </Box>
                        <Stack spacing={1} alignItems="flex-end">
                          <FormControl size="small">
                            <Select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  app.id,
                                  e.target.value as Status
                                )
                              }
                              sx={{ color: "#e5e7eb", minWidth: 120 }}
                            >
                              {STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {status}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDelete(app.id)}
                            sx={{ textTransform: "none", fontSize: 12 }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            <Paper
              elevation={3}
              sx={{ p: 3, bgcolor: "#020617", borderRadius: 3 }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: "#e5e7eb" }}
              >
                Analytics
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 2, flexWrap: "wrap" }}
              >
                <Chip
                  label={`Total: ${applications.length}`}
                  sx={{
                    bgcolor: "#111827",
                    color: "#e5e7eb",
                  }}
                />
                {STATUSES.map((status) => (
                  <Chip
                    key={status}
                    label={`${status}: ${
                      applications.filter((a) => a.status === status).length
                    }`}
                    sx={{
                      bgcolor: "#111827",
                      color: "#e5e7eb",
                    }}
                  />
                ))}
              </Stack>

              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: "#9ca3af" }}
              >
                Applications by status
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="status" stroke="#9ca3af" />
                    <YAxis allowDecimals={false} stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 2, borderColor: "#1f2937" }} />

              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: "#9ca3af" }}
              >
                Applications over time
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis allowDecimals={false} stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Applications" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </>
  );
};

