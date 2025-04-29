import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaCode, FaBrain, FaTimes } from "react-icons/fa";
import "../styles/SubmissionViewer.css";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Submissions = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tokenData = getToken();
        const token = tokenData?.token || tokenData; // Handle both cases

        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Fetch contest details
        const contestRes = await axios.get(`${API_URL}/contest/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const currentContest = contestRes.data.find((c) => c.id === contestId);
        setContest(currentContest);

        // Fetch submissions for this contest
        const submissionsRes = await axios.get(
          `${API_URL}/submissions/by-contest/${contestId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubmissions(submissionsRes.data);
      } catch (error) {
        console.error("Fetch error:", error);
        if (error.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            error.response?.data?.detail || "Failed to fetch submissions"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contestId]);

  const goBack = () => {
    navigate(-1);
  };

  const openCodeModal = (submission) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedSubmission(null), 300);
  };

  const goToCodeEvaluator = () => {
    if (selectedSubmission) {
      sessionStorage.setItem("codeToAnalyze", selectedSubmission.code);
      sessionStorage.setItem(
        "codeLanguage",
        selectedSubmission.language.toLowerCase()
      );
      navigate("/code-evaluator");
    }
  };

  const getLanguageClass = (language) => {
    const langMap = {
      python: "language-python",
      javascript: "language-javascript",
      java: "language-java",
      cpp: "language-cpp",
      "c++": "language-cpp",
    };

    return langMap[language.toLowerCase()] || "language-plaintext";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="submissions-container">
      <div className="page-header">
        <button className="btn btn-secondary back-button" onClick={goBack}>
          <FaChevronLeft /> Back
        </button>
        <h1 className="page-title">
          Submissions for {contest?.title || "Contest"}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p className="empty-state-text">No submissions yet</p>
        </div>
      ) : (
        <div className="submissions-list">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Question</th>
                <th>Language</th>
                <th>Submitted At</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.student_email}</td>
                  <td>{submission.question_title}</td>
                  <td className="language-cell">{submission.language}</td>
                  <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary view-code-btn"
                      onClick={() => openCodeModal(submission)}
                    >
                      <FaCode /> View Code
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Code Viewing Modal */}
      {modalOpen && selectedSubmission && (
        <div className="code-modal-overlay" onClick={closeModal}>
          <div className="code-modal" onClick={(e) => e.stopPropagation()}>
            <div className="code-modal-header">
              <div className="code-modal-title">
                <FaCode className="code-icon" />
                <h2>{selectedSubmission.question_title}</h2>
              </div>
              <div className="code-modal-actions">
                <button
                  className="analyze-code-btn"
                  onClick={goToCodeEvaluator}
                >
                  <FaBrain /> Analyze Code
                </button>
                <button className="close-modal-btn" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="code-modal-details">
              <span>
                <strong>Student:</strong> {selectedSubmission.student_email}
              </span>
              <span>
                <strong>Language:</strong> {selectedSubmission.language}
              </span>
              <span>
                <strong>Submitted:</strong>{" "}
                {new Date(selectedSubmission.submitted_at).toLocaleString()}
              </span>
            </div>

            <div className="code-display-container">
              <pre className={getLanguageClass(selectedSubmission.language)}>
                <code>{selectedSubmission.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
