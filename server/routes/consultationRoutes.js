"use strict";

const express = require("express");

const {
  createConsultation,
  getConsultationByAppointment,
  getMyConsultations,
} = require("../controllers/consultationController");

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// PATIENT - MY MEDICAL RECORDS
// GET /api/consultations/patient/me
// ======================================================

router.get(
  "/patient/me",
  protect,
  authorizeRoles("patient"),
  getMyConsultations,
);

// ======================================================
// DOCTOR - COMPLETE CONSULTATION
// POST /api/consultations/:appointmentId
// ======================================================

router.post(
  "/:appointmentId",
  protect,
  authorizeRoles("doctor"),
  createConsultation,
);

// ======================================================
// GET CONSULTATION BY APPOINTMENT
// GET /api/consultations/appointment/:appointmentId
// ======================================================

router.get(
  "/appointment/:appointmentId",
  protect,
  authorizeRoles("doctor", "patient", "admin"),
  getConsultationByAppointment,
);

module.exports = router;
