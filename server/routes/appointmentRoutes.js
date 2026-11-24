const express = require("express");

const {
  // Patient
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getPatientDashboardStats,

  // Doctor
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,
  getDoctorMyPatients,

  // Doctor Dashboard - NEW
  getDoctorDashboardStats,

  // Admin
  getAdminAppointments,
  cancelAdminAppointment,
} = require("../controllers/appointmentController");

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// PATIENT - GET MY APPOINTMENTS
// ======================================================

router.get(
  "/my-appointments",
  protect,
  authorizeRoles("patient"),
  getMyAppointments,
);

// ======================================================
// PATIENT DASHBOARD STATS
// ======================================================

router.get(
  "/patient/dashboard-stats",
  protect,
  authorizeRoles("patient"),
  getPatientDashboardStats,
);

// ======================================================
// DOCTOR DASHBOARD STATS - NEW
// GET /api/appointments/doctor/dashboard-stats
// ======================================================

router.get(
  "/doctor/dashboard-stats",
  protect,
  authorizeRoles("doctor"),
  getDoctorDashboardStats,
);

// ======================================================
// DOCTOR - MY PATIENTS
// GET /api/appointments/doctor/my-patients
// ======================================================

router.get(
  "/doctor/my-patients",
  protect,
  authorizeRoles("doctor"),
  getDoctorMyPatients,
);

// ======================================================
// DOCTOR - GET MY APPOINTMENTS
// ======================================================

router.get(
  "/doctor/my-appointments",
  protect,
  authorizeRoles("doctor"),
  getDoctorAppointments,
);

// ======================================================
// DOCTOR - ACCEPT APPOINTMENT
// ======================================================

router.put(
  "/:appointmentId/accept",
  protect,
  authorizeRoles("doctor"),
  acceptAppointment,
);

// ======================================================
// DOCTOR - REJECT APPOINTMENT
// ======================================================

router.put(
  "/:appointmentId/reject",
  protect,
  authorizeRoles("doctor"),
  rejectAppointment,
);

// ======================================================
// GET AVAILABLE DOCTOR SLOTS
// ======================================================

router.get(
  "/doctor/:doctorId/slots",
  protect,
  authorizeRoles("patient"),
  getAvailableSlots,
);

// ======================================================
// CREATE APPOINTMENT
// ======================================================

router.post("/", protect, authorizeRoles("patient"), createAppointment);

// ======================================================
// CANCEL PATIENT APPOINTMENT
// ======================================================

router.put(
  "/:appointmentId/cancel",
  protect,
  authorizeRoles("patient"),
  cancelAppointment,
);

// ======================================================
// GET APPOINTMENT BY ID
// Keep dynamic route at the bottom
// ======================================================

router.get("/:appointmentId", protect, getAppointmentById);

// =============================================
// ADMIN - GET ALL APPOINTMENTS
// =============================================

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAdminAppointments,
);

// =============================================
// ADMIN - CANCEL APPOINTMENT
// PATCH /api/appointments/admin/:appointmentId/cancel
// =============================================

router.patch(
  "/admin/:appointmentId/cancel",
  protect,
  authorizeRoles("admin"),
  cancelAdminAppointment,
);

module.exports = router;
