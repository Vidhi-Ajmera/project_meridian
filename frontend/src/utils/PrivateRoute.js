// utils/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "./auth";

const PrivateRoute = ({ children }) => {
  const token = getToken();
  return token && token !== "null" && token !== "undefined" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;