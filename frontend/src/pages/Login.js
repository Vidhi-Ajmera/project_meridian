import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import axios from "axios";
import { auth, provider, signInWithPopup } from "../components/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import "../../src/styles/Login.css";
import { FaCode } from "react-icons/fa";
import { getToken, saveToken, saveUserInfo } from "../utils/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default to student
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Update the login success handler in LoginPage.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    localStorage.setItem("authToken", getToken);

    try {
      const response = await axios.post(`http://localhost:8000/auth/login`, {
        email,
        password,
        role,
      });

      if (response.data.access_token) {
        const { access_token, username, role, email } = response.data;

        // Use the unified auth functions
        saveToken(response.data.access_token);
        saveUserInfo({ email, role });

        // Redirect based on role
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        error.response?.data?.detail ||
          "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        <DotLottieReact
          src="https://lottie.host/4fd012a4-6979-41bc-8db2-86bedac4787f/GBEcGXnHEX.lottie"
          loop
          autoplay
        />
      </div>
      <div className="right-panel">
        <h1 className="brand-title">
          <FaCode style={{ marginRight: "5px", marginTop: "10px" }} />
          <span style={{ color: "black" }}>CodeIQ.ai</span>
        </h1>
        <div className="login-box">
          <h2>Welcome Back!</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Login As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {/* <p className="forgot-password-text">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-password-btn"
              >
                Forgot Password?
              </button>
            </p> */}

            <button type="submit" className="login-btn">
              Login Now
            </button>

            <div className="or-separator">
              <span>OR</span>
            </div>

            <p className="register-text">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
