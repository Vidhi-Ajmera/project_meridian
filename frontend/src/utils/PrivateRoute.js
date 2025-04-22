// utils/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token && token !== "null" && token !== "undefined" ? (
    children
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;
