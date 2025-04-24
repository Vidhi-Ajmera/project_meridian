import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
} from "@mui/material";
import { FaCode, FaSignInAlt, FaArrowLeft } from "react-icons/fa";
import { getToken } from "../utils/auth";
import "../styles/ParticipateContest.css";

function ParticipateContest() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState({
    contests: true,
    joining: false,
    submitting: false,
  });
  const [contestId, setContestId] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [contestCode, setContestCode] = useState("");
  const [selectedContest, setSelectedContest] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const navigate = useNavigate();

  // Modify your axios instance
  const api = axios.create({
    baseURL: "https://codeevaluator.azurewebsites.net/",
  });

  // Add request interceptor to include token
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle token expiration
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        navigate("/login");
      }
      return Promise.reject(error);
    }
  );

  // Fetch active contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `https://codeevaluator.azurewebsites.net/contest/active`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setContests(response.data);
      } catch (err) {
        console.error("Error fetching contests:", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Failed to fetch contests"
        );
      } finally {
        setLoading((prev) => ({ ...prev, contests: false }));
      }
    };

    fetchContests();
  }, [navigate]);

  const handleSubmitCode = async () => {
    if (!studentEmail || !selectedQuestion || !code || !language) {
      setError("Please fill in all fields");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    setSuccess("");

    try {
      const contestId = selectedContest._id || selectedContest.id;
      const question = selectedContest.questions.find(
        (q) => q.title === selectedQuestion
      );

      if (!contestId || !question) {
        setError("Invalid contest or question");
        return;
      }

      const payload = {
        contest_id: contestId,
        question_title: selectedQuestion,
        code,
        language,
      };

      // Use the api instance instead of axios directly
      const response = await api.post("/submissions/submit", payload);

      setSuccess("Your code has been submitted successfully!");
      setCode("");
      setSelectedQuestion("");
    } catch (err) {
      console.error("Error submitting code:", err);
      setError(
        err.response?.data?.message ||
          "Submission failed. Please try again later."
      );
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading.contests) {
    return (
      <Container maxWidth="md" sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          Loading contests...
        </Typography>
      </Container>
    );
  }

  return (
    <div className="participate-component">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
          className="page-title"
        >
          <FaCode className="title-icon" />
          Available Contests
        </Typography>

        {/* Active Contests List */}
        <Typography variant="h6" gutterBottom className="section-title">
          Active Contests
        </Typography>

        {contests.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            className="no-contests"
          >
            No active contests available at this time
          </Typography>
        ) : (
          <Grid container spacing={3} className="contests-grid">
            {contests.map((contest) => (
              <Grid item xs={12} sm={6} key={contest._id || contest.id}>
                <Card
                  className={`contest-card ${
                    selectedContest === contest ? "selected-contest" : ""
                  }`}
                  onClick={() => setSelectedContest(contest)}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      className="contest-title"
                    >
                      {contest.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      className="contest-description"
                    >
                      {contest.description || "No description provided"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className="contest-code"
                    >
                      Code: {contest.contest_code || contest.code || "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Submission Form */}
        {selectedContest && (
          <Card sx={{ mt: 4, p: 3 }} className="submission-form">
            <Typography variant="h5" gutterBottom className="form-title">
              Submit Solution: {selectedContest.title}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="form-field"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth className="form-field">
                  <InputLabel>Question</InputLabel>
                  <Select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    label="Question"
                  >
                    <MenuItem value="">
                      <em>Select a question</em>
                    </MenuItem>
                    {selectedContest.questions?.map((q) => (
                      <MenuItem key={q.title} value={q.title}>
                        {q.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedQuestion && (
                <>
                  <Grid item xs={12}>
                    <Paper
                      elevation={2}
                      sx={{ p: 2 }}
                      className="question-details"
                    >
                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        className="detail-title"
                      >
                        Description:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-line" }}
                        className="question-description"
                      >
                        {
                          selectedContest.questions.find(
                            (q) => q.title === selectedQuestion
                          ).description
                        }
                      </Typography>

                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ mt: 2 }}
                        className="detail-title"
                      >
                        Sample Input:
                      </Typography>
                      <Box component="pre" className="code-sample">
                        {
                          selectedContest.questions.find(
                            (q) => q.title === selectedQuestion
                          ).sample_input
                        }
                      </Box>

                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        sx={{ mt: 2 }}
                        className="detail-title"
                      >
                        Sample Output:
                      </Typography>
                      <Box component="pre" className="code-sample">
                        {
                          selectedContest.questions.find(
                            (q) => q.title === selectedQuestion
                          ).sample_output
                        }
                      </Box>
                    </Paper>
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth className="form-field">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="cpp">C++</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Your Code"
                  multiline
                  rows={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  variant="outlined"
                  className="code-editor"
                  InputProps={{
                    style: {
                      fontFamily: "monospace",
                      fontSize: "14px",
                    },
                  }}
                  placeholder={`# Write your ${language} code here...`}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitCode}
                  disabled={loading.submitting}
                  fullWidth
                  size="large"
                  className="submit-button"
                >
                  {loading.submitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Submit Solution"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Card>
        )}

        {/* Snackbars for feedback */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => setError("")}
            className="alert error"
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccess("")}
            className="alert success"
          >
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}

export default ParticipateContest;
