import React, { useState, useEffect } from "react";
import axios from "axios";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Signup.css";
import { FaCode } from "react-icons/fa";
import PasswordStrengthChecker from "../components/PasswordStrengthChecker";
import { saveToken, saveUserInfo } from "../utils/auth";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student"); // Default to student
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && token !== "null" && token !== "undefined") {
      navigate("/");
    }
  }, []);

  // Password rules checking for enabling/disabling submit button
  const isPasswordValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&#]/.test(password);

  // Update the signup success handler in SignUpPage.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/auth/signup", {
        username: username,
        email: email,
        password: password,
        role: role,
      });

      if (response.data && response.data.access_token) {
        const { access_token, username, role, email } = response.data;

        // Use the unified auth functions
        saveToken(access_token);
        saveUserInfo({
          email: email,
          username: username,
          role: role,
          signupDate: new Date().toISOString(),
        });

        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Signup failed. Please try again."
      );
    }
  };

  return (
    <div className="signup-container">
      <div className="left-panel">
        <DotLottieReact
          src="https://lottie.host/dc62d82a-bfe7-40da-9a24-f288d2091843/ARq8kqUeNP.lottie"
          loop
          autoplay
        />
      </div>

      <div className="right-panel">
        <h1 className="brand-title" onClick={() => navigate("/")}>
          <FaCode style={{ marginRight: "5px", marginTop: "10px" }} />
          CodeIQ.ai
        </h1>

        <div className="signup-box">
          <h2>Create an Account</h2>
          <p style={{ marginBottom: "25px", color: "black" }}>
            Sign up to start using our platform!
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
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
              <PasswordStrengthChecker password={password} />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading ? "Signing Up..." : "Sign Up Now"}
            </button>

            <p className="login-text">
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
