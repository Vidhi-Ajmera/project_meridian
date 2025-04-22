// components/PasswordStrengthChecker.js
import React from "react";

const PasswordStrengthChecker = ({ password }) => {
  const isLengthValid = password.length >= 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);

  const allValid =
    isLengthValid && hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;

  // Show nothing if password is empty or all conditions are met
  if (!password || allValid) {
    return null;
  }

  return (
    <div className="password-strength-container">
      <p className="password-warning">Password must contain:</p>
      <ul className="password-rules">
        {!isLengthValid && <li>At least 8 characters</li>}
        {!hasLowerCase && <li>At least one lowercase letter (a-z)</li>}
        {!hasUpperCase && <li>At least one uppercase letter (A-Z)</li>}
        {!hasNumber && <li>At least one digit (0-9)</li>}
        {!hasSpecialChar && (
          <li>At least one special character (@$!%*?&#)</li>
        )}
      </ul>
    </div>
  );
};

export default PasswordStrengthChecker;
