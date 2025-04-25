import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/SubmissionViewer.css";

const API_URL =
  process.env.REACT_APP_API_URL || "https://codeevaluator.azurewebsites.net/";

const Submissions = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = getToken();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch contest details to display title
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
        setError(error.response?.data?.detail || "Failed to fetch submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contestId, token]);

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="submissions-container">
      <div className="page-header">
        <button className="btn btn-secondary back-button" onClick={goBack}>
          &larr; Back
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
                  <td>{submission.language}</td>
                  <td>{new Date(submission.submitted_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        // Create a modal or expand to show code
                        alert(submission.code);
                        // In a real app, you'd want to show this in a modal
                      }}
                    >
                      View Code
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Submissions;
