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

// import Submissions from "./components/Submissions"; // Import the new component
import { getToken, getUserInfo } from "./utils/auth";

// ✅ Utility function to check authentication
const isAuthenticated = () => {
  const token = getToken(); // ✅ Correct usage
  return token && token !== "null" && token !== "undefined";
};

// ✅ Private route wrapper
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
  const token = getToken(); // ✅ Correct usage
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
          element={
            token ? <Dashboard userRole={userRole} /> : <Navigate to="/login" />
          }
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
        {/* <Route
          path="/submissions/:contestId"
          element={<ProtectedRoute element={<Submissions />} />}
        /> */}

        <Route path="/submissions/:contestId" element={<SubmitCode />} />
      </Routes>
    </Router>
  );
}

export default App;
