import React, { useState, useEffect } from "react";
import "../styles/Landing.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaRegPlayCircle,
  FaTachometerAlt,
  FaArrowRight,
} from "react-icons/fa";
import {
  FaLinkedin,
  FaXTwitter,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa6";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FaLightbulb, FaCommentDots, FaBrain } from "react-icons/fa";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import TestPlatformVideo from "../../src/assests/Test_PlatForm.mp4";
import MeridianVideo from "../../src/assests/Meridian_video.mp4";
import meredianCertified from "../assests/meridian-certfied.png";
import indianFlag from "../assests/india-flag.png";
import MeridianLogo from "../assests/Meridian_logo.png";
import MeridianPartner from "../assests/Meridian_partner.png";
import Singapore from "../assests/singapore-flag.svg";
import uaeFlag from "../assests/uae-flag.svg";
import usFlag from "../assests/us-flag.png";

const LandingPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  const [username, setUsername] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);

      // Get the user's email from localStorage
      const userInfoString = localStorage.getItem("userInfo");
      if (userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString);
          // Extract username from email (everything before @)
          if (userInfo.email) {
            const extractedUsername = userInfo.email.split("@")[0];
            setUsername(extractedUsername);
          }
        } catch (error) {
          console.error("Error parsing user info:", error);
        }
      }
    } else {
      setIsAuthenticated(false);
      setUsername("");
    }
  }, []);

  const handleNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      setTimeout(
        () => navigate("/login", { state: { redirectTo: path } }),
        1200
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, photoURL } = result.user;

      localStorage.setItem("username", displayName);
      localStorage.setItem("profileImage", photoURL);

      setUsername(displayName);
      setProfileImage(photoURL);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error during Google sign-in:", error.message);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="landing-container">
      <nav className="lgo-nav">
        <div className="nav-image" id="main">
          <FontAwesomeIcon
            icon={faCode}
            className="gradient-icon text-4xl"
            style={{ color: "#b07ed1" }}
          />
          <h4 onClick={scrollToTop}>CodeIQ.ai</h4>
        </div>

        <div className="links">
          <a href="#features">Features</a>
          <a href="#how-to-use">Steps to Use</a>
          <a href="#about">About Meridian</a>
          <a href="#contact">Contact Us</a>
        </div>

        <div className="auth-buttons">
          {isAuthenticated ? (
            <>
              {/* Welcome message */}
              <span
                style={{
                  color: "#fff",
                  marginRight: "15px",
                  fontWeight: "500",
                }}
              >
                Welcome {username}!!
              </span>
              <button
                className="log-butt"
                onClick={() => {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("userInfo");
                  setIsAuthenticated(false);
                  setUsername("");
                  navigate("/login");
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button className="log-butt" onClick={() => navigate("/login")}>
                Log In
              </button>
              <button className="sign-butt" onClick={() => navigate("/signup")}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Rest of the component remains unchanged */}
      {/* Hero Section */}
      <header className="hero-section" id="main">
        <video
          autoPlay
          loop
          muted
          className="hero-video"
          onLoadedMetadata={(e) => (e.target.playbackRate = 1.1)}
        >
          <source src={MeridianVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-content">
          <h1 className="hero-title">AI-Based Code Evaluator</h1>
          <p className="hero-subtitle">
            Create coding contests to test your skills <br /> Receive AI-powered
            feedback, plagiarism detection, and code validation.
          </p>
        </div>
      </header>

      {/* Platform Selection Boxes */}
      <div className="platform-container">
        <div className="platform-box-first">
          <button
            className="explore-button"
            onClick={() => handleNavigation("/dashboard")}
          >
            Dashboard
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              style={{ marginLeft: "8px" }}
            />
          </button>
        </div>
        <div className="platform-box">
          <button
            className="explore-button"
            onClick={() => handleNavigation("/code-evaluator")}
          >
            Code Evaluator
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              style={{ marginLeft: "8px" }}
            />
          </button>
        </div>
      </div>

      {/* Video Section */}
      <h2
        className="section-title"
        id="features"
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          color: "rgb(188, 188, 191)",
          marginBottom: "30px",
        }}
      >
        Key Features
      </h2>
      <div className="mid-section">
        <div className="video-container">
          <video autoPlay loop muted playsInline width="100%" height="90%">
            <source src={TestPlatformVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        {/* Features Section */}
        <section className="features-section">
          <h3
            className="section-title"
            style={{ color: "rgb(188, 188, 191)", fontSize: "1.6rem" }}
          >
            Why Choose Our AI Evaluator?
          </h3>
          <p className="features-description">
            Elevate your coding experience with cutting-edge AI-powered
            analysis.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <h3>✓ &nbsp; Instant AI Feedback</h3>
              <p>
                Get real-time insights to refine your code and enhance
                efficiency.
              </p>
            </div>

            <div className="feature-item">
              <h3>✓ &nbsp; Plagiarism Detection</h3>
              <p>
                Ensure originality with AI-driven similarity checks and
                analysis.
              </p>
            </div>

            <div className="feature-item">
              <h3>✓ &nbsp; Code Correctness Validation</h3>
              <p>
                Validate logic and edge cases with automated AI-powered testing.
              </p>
            </div>

            <div className="feature-item">
              <h3>✓ &nbsp; Intelligent Hints</h3>
              <p>
                Optimize your code with AI-generated suggestions for
                improvement.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* How It Works Section */}
      <section className="steps-section" id="how-to-use">
        <h1 className="section-title">How It Works</h1>
        <div className="how-it-works-container">
          {/* Left Panel - Test Platform */}
          <div className="how-it-works-panel test-platform">
            <h3>Test Platform</h3>
            <ol className="steps-list">
              <li>
                <span>
                  <strong>Select a Coding Language</strong>
                </span>
                <p>
                  Pick a coding language & submit your code for real-world
                  problem-solving.
                </p>
              </li>
              <li>
                <span>
                  <strong>Run Automated Tests</strong>
                </span>
                <p>
                  Execute test cases, including edge cases, for code validation.
                </p>
              </li>
              <li>
                <span>
                  <strong>Check Performance</strong>
                </span>
                <p>Get insights into runtime efficiency and memory usage.</p>
              </li>
              <li>
                <span>
                  <strong>Receive AI Feedback</strong>
                </span>
                <p>
                  Improve your code with AI-generated suggestions and best
                  practices.
                </p>
              </li>
            </ol>
          </div>

          {/* Right Panel - Learning & Practice */}
          <div className="how-it-works-panel practice-platform">
            <h3>Learning & Practice Platform</h3>
            <ol className="steps-list">
              <li>
                <span>
                  <strong>Select a Coding Language</strong>
                </span>
                <p>Pick a coding language to practice.</p>
              </li>
              <li>
                <span>
                  <strong>Write & Paste Code</strong>
                </span>
                <p>Experiment with different coding approaches.</p>
              </li>
              <li>
                <span>
                  <strong>AI-Powered Hints</strong>
                </span>
                <p>
                  Receive intelligent hints and suggestions for improvement.
                </p>
              </li>
              <li>
                <span>
                  <strong>Track Progress</strong>
                </span>
                <p>
                  Monitor your improvement over time and master new concepts.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <h2 className="section-title">About Meridian</h2>
        <div className="about-container">
          <div className="about-media">
            <img
              src={meredianCertified}
              alt="About Meridian"
              className="img-fluid"
            />
          </div>
          <div className="about-content">
            <p className="about-text">
              <span className="about-highlight">Meridian Solutions</span> is a
              trusted provider of cutting-edge cloud and security solutions,
              empowering over{" "}
              <span className="about-highlight">1,400 global customers</span>.
              With deep expertise spanning healthcare, telecommunications,
              manufacturing, government, and the public sector, we deliver
              customized solutions tailored to our clients' evolving needs.
            </p>
            <p className="about-text">
              Through strategic global partnerships, we offer an extensive suite
              of{" "}
              <span className="about-highlight">
                cloud applications, advanced security solutions,
              </span>{" "}
              and managed services. As a{" "}
              <span className="about-highlight">
                Tier 1 Cloud Solutions Partner (CSP)
              </span>{" "}
              and a{" "}
              <span className="about-highlight">
                Gold Certified Cloud Productivity Partner of Microsoft
              </span>
              , we are dedicated to unlocking the full potential of your
              organization's digital transformation journey.
            </p>
            <div className="more-info">
              <p>For more information, visit our official website:</p>
              <a
                href="https://onmeridian.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button"
              >
                Meridian Solutions Pvt. Ltd.
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <h2 className="section-title" style={{ marginBottom: "4px" }}>
          Contact Us
        </h2>
        <p style={{ marginBottom: "2%", color: "beige" }}>
          Looking for safe and secure cloud solutions ? <br />
          Contact us today and leverage the benefits of innovative &
          transformative solutions.{" "}
        </p>
        <form className="contact-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Your email address" />
          </div>
          <div className="form-group">
            <label>Phone number</label>
            <input type="text" placeholder="Your phone number" />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input type="text" placeholder="Company name" />
          </div>
          <div className="form-group">
            <label>Reason for contacting</label>
            <input type="text" placeholder="Reason for contacting" />
          </div>
          <div className="form-group">
            <label>Company Size</label>
            <select style={{ cursor: "pointer" }}>
              <option>Select</option>
              <option>1-100</option>
              <option>101-500</option>
              <option>500+</option>
            </select>
          </div>
          <div className="form-group textarea-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              placeholder="Your message"
              className="message-textarea"
            ></textarea>
          </div>
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          {/* Left Section - Logo and Tagline */}
          <div className="footer-logo-section">
            <img
              src={MeridianLogo}
              alt="Meridian Logo"
              className="meridian-logo"
            />
          </div>

          {/* Right Section - Message and Links */}
          <div className="footer-content">
            <h2 className="footer-heading" style={{ color: "beige" }}>
              Innovating Today, Shaping Tomorrow
            </h2>
            <p className="footer-text" style={{ color: "beige" }}>
              As your trusted Microsoft Cloud Solution Provider, we offer expert
              guidance and customized solutions to maximize the impact of your
              technology initiatives.
            </p>
          </div>
        </div>

        {/* Country Information Section */}
        <div className="footer-country-section">
          <div className="country">
            <div className="country-header">
              <img src={indianFlag} alt="India Flag" className="country-flag" />
              <h3>India</h3>
            </div>
            <p>
              Tower B, Office No 1103 & 1104,
              <br />
              11th Floor, Spaze IT Tech Park,
              <br />
              Sohna Road, Gurugram, India
            </p>
          </div>

          <div className="country">
            <div className="country-header">
              <img src={uaeFlag} alt="UAE Flag" className="country-flag" />
              <h3>UAE</h3>
            </div>
            <p>
              Unique World Business Centre,
              <br />
              Al Karama, Dubai, UAE
            </p>
          </div>

          <div className="country">
            <div className="country-header">
              <img src={usFlag} alt="US Flag" className="country-flag" />
              <h3>US</h3>
            </div>
            <p>
              LLC1207 Delaware Ave #2193
              <br />
              Wilmington, DE 19806
            </p>
          </div>

          <div className="country">
            <div className="country-header">
              <img
                src={Singapore}
                alt="Singapore Flag"
                className="country-flag"
              />
              <h3>Singapore</h3>
            </div>
            <p>
              68 Circular Road #02-01
              <br />
              Singapore (049422)
            </p>
          </div>
        </div>

        {/* Copyright Notice and Social Links */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-left">
              <div className="social-links">
                <a
                  href="https://www.linkedin.com/company/on-meridian/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="https://x.com/On_Meridian"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaXTwitter />
                </a>
                <a
                  href="https://www.instagram.com/onmeridian/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://www.youtube.com/@onmeridian"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            <div
              className="footer-center"
              style={{ color: "beige !important", fontSize: "1.1rem" }}
            >
              <p>&copy; 2025 Meridian. All rights reserved.</p>
            </div>
            <div className="footer-right">
              <img src={MeridianPartner} className="footer-image" />
            </div>
          </div>
        </div>
      </footer>

      {/* UPDATED: Show login popup if user is not authenticated */}
      {showPopup && (
        <div className="mini-popup">
          <p>🔒 Please log in to use platform</p>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
