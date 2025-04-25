import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import "../styles/MyContest.css";
import { useNavigate } from "react-router-dom";

const API_URL =
  process.env.REACT_APP_BACKEND_URL || "https://codeevaluator.azurewebsites.net/";

const MyContests = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = getToken();

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/contest/teacher/mycontest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContests(res.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch contests");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    const endpoint = isActive ? "end" : "start";
    try {
      await axios.post(
        `${API_URL}/contest/${endpoint}/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchContests();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update contest status"
      );
    }
  };

  const viewSubmissions = (contestId) => {
    navigate(`/submissions/${contestId}`);
  };

  const handleCreateContest = () => {
    navigate("/create-contest");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="contests-container">
      <div className="page-header">
        <h1 className="page-title">My Contests</h1>
        <button className="btn btn-primary" onClick={handleCreateContest}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 btn-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create New Contest
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {contests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">
            You haven't created any contests yet
          </p>
        </div>
      ) : (
        <div className="contests-grid">
          {contests.map((contest) => (
            <div key={contest.id} className="contest-card">
              <div className="contest-header">
                <h3 className="contest-title">{contest.title}</h3>
                <div
                  className={`contest-status ${
                    contest.is_active ? "active" : "inactive"
                  }`}
                >
                  {contest.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="contest-body">
                <p className="contest-description">{contest.description}</p>
                <div className="contest-meta">
                  <div className="contest-code">
                    Code: {contest.contest_code}
                  </div>
                  <div className="contest-date">
                    {new Date(contest.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="contest-actions">
                  <button
                    onClick={() => toggleStatus(contest.id, contest.is_active)}
                    className={`btn ${
                      contest.is_active ? "btn-danger" : "btn-primary"
                    }`}
                  >
                    {contest.is_active ? "End Contest" : "Start Contest"}
                  </button>
                  <button
                    onClick={() => viewSubmissions(contest.id)}
                    className="btn btn-secondary"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyContests;
