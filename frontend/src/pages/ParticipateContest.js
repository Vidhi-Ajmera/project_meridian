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

  // Get API URL from environment or use a default
  const API_URL =
    process.env.REACT_APP_BACKEND_URL ||
    "https://codeevaluator.azurewebsites.net";

  // Fetch active contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const tokenData = getToken();
        if (!tokenData || !tokenData.token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_URL}/contest/active`, {
          headers: { Authorization: `Bearer ${tokenData.token}` },
        });

        setContests(response.data);
      } catch (err) {
        console.error("Error fetching contests:", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Failed to fetch contests"
        );

        // Handle token expiration
        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } finally {
        setLoading((prev) => ({ ...prev, contests: false }));
      }
    };

    fetchContests();
  }, [navigate, API_URL]);

  // Helper function to safely get question details
  const getSelectedQuestionDetails = () => {
    if (!selectedContest || !selectedQuestion) return null;

    return selectedContest.questions?.find((q) => q.title === selectedQuestion);
  };

  // Update the handleSubmitCode function in ParticipateContest.js
  const handleSubmitCode = async () => {
    if (!selectedContest) {
      setError("Please select a contest first");
      return;
    }

    if (!selectedQuestion || !code || !language) {
      setError("Please fill in all fields");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    setSuccess("");

    try {
      const contestId = selectedContest._id || selectedContest.id;
      const question = selectedContest.questions?.find(
        (q) => q.title === selectedQuestion
      );

      if (!contestId || !question) {
        setError("Invalid contest or question");
        return;
      }

      const tokenData = getToken();
      if (!tokenData || !tokenData.token) {
        setError("Authentication required. Please log in.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const email = studentEmail || tokenData.email || "";
      const payload = {
        contest_id: contestId,
        question_title: selectedQuestion,
        code,
        language,
        studentEmail: email,
      };

      try {
        const response = await axios.post(
          `${API_URL}/submissions/submit`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${tokenData.token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 seconds timeout
          }
        );

        // If we get here, the submission was successful
        setSuccess("Your code has been submitted successfully!");
        setCode("");
        setSelectedQuestion("");
      } catch (err) {
        // Special handling for 500 errors that might actually indicate success
        if (err.response?.status === 500) {
          // Check if the error is specifically about plagiarism analysis
          if (
            err.response.data?.detail?.includes("plagiarism") ||
            err.response.data?.detail?.includes("Failed to parse")
          ) {
            // Show a success message but warn about the analysis
            setSuccess(
              "Code submitted successfully (analysis may be incomplete)"
            );
            setCode("");
            setSelectedQuestion("");
            return;
          }
        }
        // For all other errors, show the actual error
        throw err;
      }
    } catch (err) {
      console.error("Submission error:", err);

      let errorMessage = "Submission failed. Please try again later.";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("authToken");
          localStorage.removeItem("userInfo");
          navigate("/login");
          return;
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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

  // Get question details safely
  const questionDetails = getSelectedQuestionDetails();

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

              {selectedQuestion && questionDetails && (
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
                      {questionDetails.description}
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
                      {questionDetails.sample_input}
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
                      {questionDetails.sample_output}
                    </Box>
                  </Paper>
                </Grid>
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
