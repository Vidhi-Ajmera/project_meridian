import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Info } from "lucide-react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Radar } from "react-chartjs-2";

import {
  FaArrowLeft,
  FaCode,
  FaBrain,
  FaRedoAlt,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartPie,
  FaList,
  FaUndo,
} from "react-icons/fa";
import { oneDark } from "@codemirror/theme-one-dark";
import "../styles/CodeEvaluator.css";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { getToken, clearToken } from "../utils/auth";
const CodeMirror = lazy(() => import("@uiw/react-codemirror"));

// Register ChartJS components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement
);

// Chart options configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: (ctx) =>
          document.body.classList.contains("dark-theme")
            ? "#f3f4f6"
            : "#111827",
      },
    },
  },
  scales: {
    r: {
      angleLines: {
        display: true,
        color: (ctx) =>
          document.body.classList.contains("dark-theme")
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
      },
      grid: {
        color: (ctx) =>
          document.body.classList.contains("dark-theme")
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
      },
      pointLabels: {
        color: (ctx) =>
          document.body.classList.contains("dark-theme")
            ? "#f3f4f6"
            : "#111827",
      },
      ticks: {
        color: (ctx) =>
          document.body.classList.contains("dark-theme")
            ? "#f3f4f6"
            : "#111827",
        backdropColor: "transparent",
      },
    },
  },
};

const API_URL = `http://localhost:8000/plagiarism/check`; // Ensure this matches your backend URL

const languageOptions = [
  { label: "None", value: "none" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const languageExtensions = {
  none: [],
  python: python(),
  javascript: javascript(),
  java: java(),
  cpp: cpp(),
};

const detectLanguage = (code) => {
  const trimmedCode = code.trim();

  if (
    /#include\s*<.*?>/.test(trimmedCode) ||
    /\busing\s+namespace\s+std;/.test(trimmedCode) ||
    /\bint\s+main\s*\(/.test(trimmedCode) ||
    /\bcout\s*<<\s*".*?"/.test(trimmedCode)
  ) {
    return "cpp";
  }

  if (
    /\bpublic\s+class\b/.test(trimmedCode) ||
    /\bimport\s+java\./.test(trimmedCode) ||
    /\bSystem\.out\.println\(/.test(trimmedCode) ||
    /\bpublic\s+(static\s+)?void\s+main\s*\(/.test(trimmedCode) ||
    /@\w+/.test(trimmedCode)
  ) {
    return "java";
  }

  if (
    /(^|\s)def\s+\w+\s*\(/.test(trimmedCode) ||
    /(^|\s)class\s+\w+\s*(:|\()/i.test(trimmedCode) ||
    /^\s*(import|from)\s+\w+/.test(trimmedCode) ||
    /print\s*\(.+?\)/.test(trimmedCode) ||
    /\bif\s+_name\s*==\s*['"]main_['"]/.test(trimmedCode)
  ) {
    return "python";
  }

  if (
    /\b(console\.log|alert|document\.querySelector|window\.addEventListener)\(/.test(
      trimmedCode
    ) ||
    /\b(const|let|var)\s+\w+\s*=/.test(trimmedCode) ||
    /\bfunction\s+\w+\s*\(/.test(trimmedCode) ||
    /\basync\s+function\s+\w+\s*\(/.test(trimmedCode) ||
    /\bexport\s+(default\s+)?\w+/.test(trimmedCode) ||
    /\bimport\s+[\w{}\s,*]+\s+from\s+['"].+['"];/.test(trimmedCode)
  ) {
    return "javascript";
  }

  return "";
};

const CodeEvaluator = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [language, setLanguage] = useState("none");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const reportRef = useRef(null);
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  };
  const fetchProtectedData = async () => {
    const token = getToken();

    if (!token) {
      console.log("No token found. Please log in.");
      return;
    }

    try {
      const response = await axios.get(`https://localhost:8000/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Protected Data:", response.data);
      setIsAuthenticated(true);
      setUsername(response.data.username || "User");
    } catch (error) {
      console.error("Error fetching protected data:", error);
      if (error.response && error.response.status === 401) {
        setAlertMessage("Session expired. Please log in again.");
        setAlertSeverity("error");
        setAlertOpen(true);
        clearToken();
        setTimeout(() => navigate("/login"), 2000);
      }
    }
  };

  // Check for token on component mount
  useEffect(() => {
    fetchProtectedData();
    const token = getToken();
    if (!token) {
      setAlertMessage("Please log in first");
      setAlertSeverity("error");
      setAlertOpen(true);
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setAlertMessage("Please enter some code to analyze");
      setAlertSeverity("warning");
      setAlertOpen(true);
      return;
    }

    if (!language || language === "none") {
      setAlertMessage("Please select a language first!");
      setAlertSeverity("warning");
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    setAnalysisResult(null);

    try {
      const token = getToken();
      if (!token) {
        setAlertMessage("Please log in first");
        setAlertSeverity("error");
        setAlertOpen(true);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      if (isTokenExpired(token)) {
        setAlertMessage("Your session has expired. Please log in again.");
        setAlertSeverity("error");
        setAlertOpen(true);
        clearToken();
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      const response = await axios.post(
        API_URL,
        {
          code,
          language,
          course_level: "undergraduate",
          assignment_description: "Code analysis task",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Process the response data
      let result = response.data;

      // Ensure all expected fields exist with default values if needed
      if (!result.recommendations) {
        result.recommendations = [
          "Add proper documentation and comments to your code",
          "Use meaningful variable and function names",
          "Consider code organization and structure",
        ];
      }

      // Create default metrics if they don't exist
      if (!result.evaluation_metrics) {
        result.evaluation_metrics = {
          code_correctness: {
            status: "Unknown",
            test_cases: "N/A",
            failed_cases: "N/A",
          },
          code_efficiency: {
            time_complexity: "O(n)",
            memory_usage: "Average",
            optimization_suggestions: ["Consider algorithm optimization"],
          },
          code_security: {
            issues_found: [],
            recommendations: ["Follow security best practices"],
          },
          code_readability: {
            score: 7,
            suggestions: ["Add comments to clarify logic"],
            improvement_areas: ["Documentation"],
          },
        };
      }

      // Use the full result with default values applied
      setAnalysisResult(result);
      console.log("Processed analysis result:", result);

      // Show success message
      setAlertMessage("Code analysis completed successfully!");
      setAlertSeverity("success");
      setAlertOpen(true);
    } catch (error) {
      console.error("Error analyzing code:", error);
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("getToken");
          setAlertMessage("Your session has expired. Please log in again.");
          setAlertSeverity("error");
          setAlertOpen(true);
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        setAlertMessage(
          `Error: ${error.response.data.detail || "Failed to analyze code."}`
        );
      } else if (error.request) {
        setAlertMessage(
          "No response received from the server. Please check your connection."
        );
      } else {
        setAlertMessage(`Request error: ${error.message}`);
      }
      setAlertSeverity("error");
      setAlertOpen(true);

      // Provide a fallback result on error
      setAnalysisResult({
        recommendations: [
          "Try again with a different code sample",
          "Check your network connection",
          "Contact support if the issue persists",
        ],
        plagiarism_detected: false,
        confidence_score: 0,
        explanation: "Analysis could not be completed due to an error.",
        evaluation_metrics: {
          code_correctness: {
            status: "Unknown",
            test_cases: "N/A",
            failed_cases: "N/A",
          },
          code_efficiency: {
            time_complexity: "Unknown",
            memory_usage: "N/A",
            optimization_suggestions: ["N/A"],
          },
          code_security: {
            issues_found: [],
            recommendations: ["N/A"],
          },
          code_readability: {
            score: 5,
            suggestions: ["N/A"],
            improvement_areas: ["N/A"],
          },
        },
      });
    } finally {
      setLoading(false);
    }
  }, [code, language, navigate]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (analysisResult && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [analysisResult]);

  // Apply dark mode to the whole document
  useEffect(() => {
    // Apply dark mode to the body
    document.body.className = darkMode ? "dark-theme" : "light-theme";

    // Apply dark mode theme to html element for full page coverage
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add("dark-theme");
    } else {
      htmlElement.classList.remove("dark-theme");
    }

    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        handleAnalyze();
      }
    };

    const editorElement = document.querySelector(".cm-editor");
    if (editorElement) {
      editorElement.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [handleAnalyze]);

  const handleReset = () => {
    setCode("");
    setAnalysisResult(null);
  };

  const handleBack = () => {
    setLogoutDialogOpen(true);
  };

  const confirmBack = () => {
    setLogoutDialogOpen(false);
    navigate(-1);
  };

  // Handle code change with improved language detection
  const handleCodeChange = (value) => {
    setCode(value);

    // Only attempt to detect language if there's actual code to analyze
    if (value.trim()) {
      const detectedLang = detectLanguage(value);
      if (detectedLang) {
        setLanguage(detectedLang);
      }
    }
  };

  // Real-time language detection as user types
  useEffect(() => {
    if (code.trim()) {
      const detectedLang = detectLanguage(code);
      if (detectedLang && detectedLang !== language) {
        setLanguage(detectedLang);
      }
    }
  }, [code, language]);

  // Prepare chart data for metrics
  const prepareMetricsChartData = () => {
    if (!analysisResult?.evaluation_metrics) return null;

    const metrics = analysisResult.evaluation_metrics;

    // Set colors based on dark mode
    const borderColor = darkMode ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)";
    const backgroundColor = darkMode
      ? "rgba(96, 165, 250, 0.2)"
      : "rgba(59, 130, 246, 0.2)";
    const pointBgColor = darkMode ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)";

    const radarData = {
      labels: ["Readability", "Maintainability", "Efficiency", "Security"],
      datasets: [
        {
          label: "Code Quality",
          data: [
            metrics.code_readability.score,
            metrics.code_readability.score * 0.9,
            metrics.code_efficiency.time_complexity === "O(n)" ? 8 : 6,
            metrics.code_security.issues_found.length === 0 ? 10 : 5,
          ],
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          pointBackgroundColor: pointBgColor,
          pointBorderColor: darkMode ? "#1a1a1a" : "#fff",
          pointHoverBackgroundColor: darkMode ? "#1a1a1a" : "#fff",
          pointHoverBorderColor: borderColor,
        },
      ],
    };

    return radarData;
  };

  // Prepare chart data for plagiarism
  const preparePlagiarismChartData = () => {
    if (!analysisResult) return null;

    const confidenceScore = analysisResult.confidence_score || 0;

    // Adapt colors for dark mode
    const originalColor = darkMode
      ? ["rgba(52, 211, 153, 0.6)", "rgba(52, 211, 153, 1)"]
      : ["rgba(16, 185, 129, 0.6)", "rgba(16, 185, 129, 1)"];

    const plagiarismColor = darkMode
      ? ["rgba(248, 113, 113, 0.6)", "rgba(248, 113, 113, 1)"]
      : ["rgba(239, 68, 68, 0.6)", "rgba(239, 68, 68, 1)"];

    const pieData = {
      labels: ["Original Code", "Potential Plagiarism"],
      datasets: [
        {
          data: [100 - confidenceScore, confidenceScore],
          backgroundColor: [originalColor[0], plagiarismColor[0]],
          borderColor: [originalColor[1], plagiarismColor[1]],
          borderWidth: 1,
        },
      ],
    };

    return pieData;
  };

  // Render analysis result
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    // Access metrics safely with defaults
    const metrics = analysisResult.evaluation_metrics || {
      code_correctness: {
        status: "Unknown",
        test_cases: "N/A",
        failed_cases: "N/A",
      },
      code_efficiency: { time_complexity: "Unknown", memory_usage: "N/A" },
      code_security: { issues_found: [] },
      code_readability: { score: 5 },
    };

    // Prepare chart data
    const pieData = preparePlagiarismChartData();
    const radarData = prepareMetricsChartData();

    return (
      <div className="analysis-results">
        {/* Plagiarism Section */}
        <Card className="analysis-card">
          <CardHeader
            title="Plagiarism Analysis"
            avatar={<FaExclamationTriangle color="#F59E0B" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color: analysisResult.plagiarism_detected
                        ? "#EF4444"
                        : "#10B981",
                      fontWeight: "bold",
                    }}
                  >
                    {analysisResult.plagiarism_detected
                      ? "Potential Plagiarism"
                      : "Original Work"}
                  </span>
                </Typography>
                <Typography variant="body1">
                  <strong>Confidence:</strong>{" "}
                  {analysisResult.confidence_score || 0}%
                </Typography>
                <Typography variant="body1">
                  <strong>Explanation:</strong>{" "}
                  {analysisResult.explanation ||
                    "No detailed explanation available"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <div style={{ height: 200 }}>
                  <Pie data={pieData} options={chartOptions} />
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Code Quality Metrics */}
        <Card className="analysis-card">
          <CardHeader
            title="Code Quality Evaluation"
            avatar={<FaChartPie color="#3B82F6" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <div style={{ height: 300 }}>
                  <Radar data={radarData} options={chartOptions} />
                </div>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Detailed Metrics</Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <strong>Correctness</strong>
                        </TableCell>
                        <TableCell>
                          {metrics.code_correctness?.status || "Unknown"}
                          {metrics.code_correctness?.failed_cases &&
                            ` (${metrics.code_correctness.failed_cases} failed)`}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>Efficiency</strong>
                        </TableCell>
                        <TableCell>
                          {metrics.code_efficiency?.time_complexity ||
                            "Unknown"}
                          {metrics.code_efficiency?.optimization_suggestions
                            ?.length > 0 &&
                            ` - ${metrics.code_efficiency.optimization_suggestions[0]}`}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>Security</strong>
                        </TableCell>
                        <TableCell>
                          {metrics.code_security?.issues_found?.length > 0
                            ? `${metrics.code_security.issues_found.length} issues found`
                            : "No major issues"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>Readability</strong>
                        </TableCell>
                        <TableCell>
                          Score: {metrics.code_readability?.score || "N/A"}/10
                          {metrics.code_readability?.improvement_areas?.length >
                            0 &&
                            ` - ${metrics.code_readability.improvement_areas[0]}`}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="analysis-card">
          <CardHeader
            title="Improvement Recommendations"
            avatar={<FaList color="#10B981" />}
          />
          <CardContent>
            <List>
              {(analysisResult.recommendations || []).map((rec, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#ECFDF5", color: "#10B981" }}>
                      <FaCheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div
        className="theme-toggle"
        style={{ backgroundColor: darkMode ? "#374151" : "#ffffff" }}
      >
        <FaSun
          className={`theme-icon ${!darkMode ? "active-icon" : ""}`}
          style={{ color: darkMode ? "#f3f4f6" : "#f59e0b" }}
        />
        <Switch
          checked={darkMode}
          onChange={toggleDarkMode}
          color="default"
          sx={{
            "& .MuiSwitch-track": {
              backgroundColor: darkMode ? "#6b7280 !important" : undefined,
            },
            "& .MuiSwitch-thumb": {
              backgroundColor: darkMode ? "#f3f4f6" : undefined,
            },
          }}
        />
        <FaMoon
          className={`theme-icon ${darkMode ? "active-icon" : ""}`}
          style={{ color: darkMode ? "#60a5fa" : "#6b7280" }}
        />
      </div>
      <div className="language-display" style={{ display: "inline-block" }}>
        {language && language !== "none" ? (
          `Detected language: ${
            language === "cpp"
              ? "C++"
              : language.charAt(0).toUpperCase() + language.slice(1)
          }`
        ) : (
          <span>
            {code.trim() ? (
              <>
                <CircularProgress
                  size={18}
                  style={{
                    marginRight: "8px",
                    color: darkMode ? "#f3f4f6" : "#6b7280",
                  }}
                />
                Detecting Language...
              </>
            ) : (
              "No code entered"
            )}
          </span>
        )}

        {/* Tooltip positioned below */}
        <div
          className="tooltip-container"
          style={{
            marginLeft: "8px",
            display: "inline-block",
            position: "relative",
          }}
        >
          <Info size={16} color={darkMode ? "#f3f4f6" : "#6b7280"} />
          <div className="tooltip-text">
            This platform only supports C++, Java, JavaScript, Python.
          </div>
        </div>
      </div>

      {/* Apply dark-theme class to the container */}
      <div className={`container ${darkMode ? "dark-theme" : "light-theme"}`}>
        <Typography
          variant="h5"
          className="title"
          onClick={scrollToTop}
          sx={{
            color: darkMode ? "#f3f4f6" : "#111827",
            textAlign: "center",
            width: "100%", // Ensures it spans the full width for proper centering
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <FaCode
            style={{
              marginRight: "8px",
              color: darkMode ? "#60a5fa" : "#3b82f6",
            }}
          />
          CodeIQ.ai
        </Typography>

        {/* Apply dark-theme class to the top-section */}
        <div
          className={`top-section ${darkMode ? "dark-theme" : "light-theme"}`}
        >
          <div
            className={`editor-container ${darkMode ? "dark-theme" : ""}`}
            style={{ borderColor: darkMode ? "#4b5563" : "#e5e7eb" }}
          >
            <Suspense fallback={<div>Loading Editor...</div>}>
              <CodeMirror
                value={code}
                extensions={
                  language && language !== "none"
                    ? [languageExtensions[language]]
                    : []
                }
                onChange={handleCodeChange}
                placeholder="// Write or paste your code here to be analyzed"
                theme={darkMode ? oneDark : "light"}
                style={{
                  fontSize: "1rem",
                  height: "100%",
                  color: darkMode ? "#f3f4f6" : "#111827",
                  backgroundColor: darkMode ? "#2d2d2d" : "#ffffff",
                }}
              />
            </Suspense>
          </div>

          {analysisResult && (
            <div
              className={`analysis-container ${darkMode ? "dark-theme" : ""}`}
              ref={reportRef}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <FaChartPie
                  style={{
                    marginRight: "10px",
                    color: darkMode ? "#60a5fa" : "#3b82f6",
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: darkMode ? "#f3f4f6" : "#111827",
                  }}
                >
                  Analysis Report
                </Typography>
              </Box>
              {renderAnalysisResult()}
            </div>
          )}

          <div className="button-container">
            <div className="top-buttons">
              <Button
                className="reset-button"
                onClick={handleReset}
                disabled={loading}
                variant="contained"
                color="error"
                startIcon={<FaUndo className="button-icon" />}
              >
                Reset
              </Button>

              <Tooltip title="Analyze your code" placement="top">
                <span>
                  <Button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={loading || !code.trim()}
                    variant="contained"
                    color="primary"
                  >
                    {loading ? (
                      <CircularProgress size={20} style={{ color: "white" }} />
                    ) : (
                      <>
                        <FaBrain className="button-icon" />
                        <span>Analyze Code</span>
                      </>
                    )}
                  </Button>
                </span>
              </Tooltip>
            </div>

            <div className="logout-container">
              <Button
                className="logout-button"
                onClick={handleBack}
                variant="contained"
                color="error"
                startIcon={<FaArrowLeft />}
                fullWidth
              >
                Go Back
              </Button>
            </div>
          </div>

          <Dialog
            open={logoutDialogOpen}
            onClose={() => setLogoutDialogOpen(false)}
            PaperProps={{
              style: {
                backgroundColor: darkMode ? "#2d2d2d" : "white",
                color: darkMode ? "white" : "inherit",
              },
            }}
          >
            <DialogTitle>Go Back Confirmation</DialogTitle>
            <DialogContent>
              <DialogContentText
                sx={{ color: darkMode ? "#e2e8f0" : "inherit" }}
              >
                ↩ Are you sure you want to go back?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={confirmBack}
                color="error"
                variant="contained"
                className="logout-button"
              >
                Go Back
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={alertOpen}
            autoHideDuration={3000}
            onClose={() => setAlertOpen(false)}
          >
            <Alert
              onClose={() => setAlertOpen(false)}
              severity={alertSeverity}
              sx={{ width: "100%" }}
            >
              {alertMessage}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </>
  );
};

export default CodeEvaluator;
