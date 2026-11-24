import React from "react";

import { Navigate, Outlet } from "react-router-dom";

import { useSelector } from "react-redux";

export default function ProtectedRoute({
  allowedRoles = [],
  loginPath = "/login",
}) {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  console.log("ProtectedRoute Auth:", {
    user,
    token,
    isAuthenticated,
  });

  // Not logged in
  if (!isAuthenticated || !user || !token) {
    return <Navigate to={loginPath} replace />;
  }

  // Role not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // User allowed
  return <Outlet />;
}
