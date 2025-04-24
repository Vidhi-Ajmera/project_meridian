import React, { useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import "../styles/CreateContest.css";
import { useNavigate } from "react-router-dom";
import { FiX, FiPlus, FiAward, FiBook, FiMail } from "react-icons/fi";

const API_URL =
  process.env.REACT_APP_API_URL || "https://codeevaluator.azurewebsites.net/";

const CreateContest = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const token = getToken();

  const [qTitle, setQTitle] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qInput, setQInput] = useState("");
  const [qOutput, setQOutput] = useState("");

  const handleAddQuestion = () => {
    if (!qTitle || !qDesc || !qInput || !qOutput) {
      setError("Please fill in all question fields");
      return;
    }

    const newQuestion = {
      title: qTitle,
      description: qDesc,
      sample_input: qInput,
      sample_output: qOutput,
    };
    console.log(token);
    setQuestions([...questions, newQuestion]);
    setQTitle("");
    setQDesc("");
    setQInput("");
    setQOutput("");
    setError("");
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/contest/create`,
        {
          title,
          description: desc,
          questions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(true);
      setTimeout(() => {
        navigate("/my-contests");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create contest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-contest-container">
      <div className="header-section">
        <div className="header-content">
          <h1 className="create-contest-title">
            <FiAward className="title-icon" /> Create New Contest
          </h1>
          <p className="subtitle">
            Design engaging competitions for your students
          </p>
        </div>
      </div>

      {success && (
        <div className="success-message">
          <div className="success-content">
            <svg className="success-icon" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            <span>Contest created successfully!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="contest-form">
        <div className="form-card">
          <div className="form-group">
            <label className="form-label">
              <FiBook className="input-icon" /> Contest Title
            </label>
            <input
              type="text"
              placeholder="Enter contest title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiBook className="input-icon" /> Description
            </label>
            <textarea
              placeholder="Contest description..."
              rows="4"
              className="form-textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="form-card">
          <h3 className="section-title">
            <FiPlus className="section-icon" /> Add Questions
          </h3>

          <input
            type="text"
            placeholder="Question Title"
            className="form-input"
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
          />
          <textarea
            placeholder="Question Description"
            className="form-textarea"
            rows="3"
            value={qDesc}
            onChange={(e) => setQDesc(e.target.value)}
          />
          <input
            type="text"
            placeholder="Sample Input"
            className="form-input"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <input
            type="text"
            placeholder="Sample Output"
            className="form-input"
            value={qOutput}
            onChange={(e) => setQOutput(e.target.value)}
          />

          <button
            type="button"
            onClick={handleAddQuestion}
            className="add-question-btn"
          >
            <FiPlus /> Add Question
          </button>
        </div>

        {questions.length > 0 && (
          <div className="form-card questions-list">
            <h3 className="section-title">
              <FiBook className="section-icon" /> Contest Questions
            </h3>
            <div className="questions-grid">
              {questions.map((q, i) => (
                <div key={i} className="question-card">
                  <div className="question-content">
                    <span className="question-number">Q{i + 1}</span>
                    <span className="question-text">{q.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(i)}
                    className="remove-question-btn"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || questions.length === 0}
            className={`submit-btn ${isSubmitting ? "submitting" : ""}`}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Creating Contest...
              </>
            ) : (
              "Publish Contest"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateContest;
