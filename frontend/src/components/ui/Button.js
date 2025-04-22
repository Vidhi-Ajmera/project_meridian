import React from "react";

const Button = ({ children, className, onClick }) => {
  return (
    <button className={`px-6 py-3 rounded-full ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
