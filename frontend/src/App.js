import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CodeEvaluator from "./pages/CodeEvaluator";
import Dashboard from "./pages/Dashboard";
import ParticipateContest from "./pages/ParticipateContest";
import CreateContest from "./pages/CreateContest";
import MyContests from "./pages/MyContest";
import SubmitCode from "./pages/SubmitCode";
import { getToken, getUserInfo } from "./utils/auth";

// ✅ Utility function to check authentication
const isAuthenticated = () => {
  const token = getToken();
  return token && token !== "null" && token !== "undefined";
};

// ✅ Private route wrapper
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

function App() {
  const userInfo = getUserInfo();
  const userRole = userInfo?.role || null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/code-evaluator"
          element={<PrivateRoute element={<CodeEvaluator />} />}
        />
        <Route
          path="/dashboard"
          element={<PrivateRoute element={<Dashboard userRole={userRole} />} />}
        />
        <Route
          path="/participate-contest"
          element={<PrivateRoute element={<ParticipateContest />} />}
        />
        <Route
          path="/create-contest"
          element={<PrivateRoute element={<CreateContest />} />}
        />
        <Route
          path="/my-contests"
          element={<PrivateRoute element={<MyContests />} />}
        />
        <Route
          path="/submissions/:contestId"
          element={<PrivateRoute element={<SubmitCode />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
