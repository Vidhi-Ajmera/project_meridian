import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../utils/auth";
import "../styles/Dashboard.css";

const Dashboard = ({ userRole: initialUserRole }) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(initialUserRole || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If initialUserRole is provided, use it and we're done
    if (initialUserRole) {
      setIsLoading(false);
      return;
    }

    // Otherwise, try to get the role from the token
    const tokenData = getToken();
    if (tokenData && tokenData.role) {
      setUserRole(tokenData.role);
      setIsLoading(false);
    } else {
      // If no role found, redirect to login
      clearToken();
      navigate("/login");
    }
  }, [initialUserRole, navigate]);

  const logout = () => {
    clearToken();
    navigate("/login");
  };

  if (isLoading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <svg
            className="logo-icon"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="dashboard-title">Dashboard</h2>
        </div>
        <button onClick={logout} className="logout-btn">
          <svg
            className="logout-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="action-cards">
          {userRole === "teacher" && (
            <>
              <ActionCard
                title="Create Contest"
                description="Set up a new coding challenge"
                icon={
                  <svg
                    className="action-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                colorClass="card-green"
                onClick={() => navigate("/create-contest")}
              />
              <ActionCard
                title="My Contests"
                description="View your created contests"
                icon={
                  <svg
                    className="action-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                colorClass="card-blue"
                onClick={() => navigate("/my-contests")}
              />
            </>
          )}
          {userRole === "student" && (
            <ActionCard
              title="Participate"
              description="Join available contests"
              icon={
                <svg
                  className="action-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              colorClass="card-purple"
              onClick={() => navigate("/participate-contest")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon, colorClass, onClick }) => {
  return (
    <div className={`action-card ${colorClass}`} onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
      <div className="card-arrow">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default Dashboard;
