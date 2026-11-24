import React from "react";
import ProtectedRoute from "./ProtectedRoute";

// ================================
// PATIENT
// ================================

export function UserProtectedRoute() {
  return <ProtectedRoute allowedRoles={["patient"]} loginPath="/login" />;
}

// ================================
// DOCTOR
// ================================

export function DoctorProtectedRoute() {
  return <ProtectedRoute allowedRoles={["doctor"]} loginPath="/login" />;
}

// ================================
// ADMIN
// ================================

export function AdminProtectedRoute() {
  return <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login" />;
}
