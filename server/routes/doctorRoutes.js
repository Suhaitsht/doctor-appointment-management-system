"use strict";

const express = require("express");
const multer = require("multer");

const router = express.Router();

/* ======================================================
   IMPORT DOCTOR CONTROLLERS
====================================================== */

const {
  createDoctor,
  getAllDoctors,
  GetSingleDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,

  getPublicDoctors,
  getPublicDoctorById,

  getMyAvailability,
  updateAvailability,

  getMyDoctorProfile,
  updateMyDoctorProfile,

  updateDoctorAvailabilityStatus,
} = require("../controllers/doctorController");

/* ======================================================
   IMPORT MIDDLEWARE
====================================================== */

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const doctorUpload = require("../middleware/doctorUploadMiddleware");

/* ======================================================
   DOCTOR IMAGE UPLOAD ERROR HANDLING
====================================================== */

const uploadDoctorImage = (req, res, next) => {
  doctorUpload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Doctor image must not exceed 2 MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid doctor image",
    });
  });
};

/* ======================================================
   01. PUBLIC DOCTOR ROUTES
====================================================== */

// GET /api/doctors/public
router.get("/public", getPublicDoctors);

// GET /api/doctors/public/:id
router.get("/public/:id", getPublicDoctorById);

/* ======================================================
   02. DOCTOR PROFILE SETTINGS
====================================================== */

// GET /api/doctors/me/profile
router.get(
  "/me/profile",
  protect,
  authorizeRoles("doctor"),
  getMyDoctorProfile,
);

// PUT /api/doctors/me/profile
router.put(
  "/me/profile",
  protect,
  authorizeRoles("doctor"),
  uploadDoctorImage,
  updateMyDoctorProfile,
);

/* ======================================================
   03. DOCTOR AVAILABLE STATUS
====================================================== */

// PATCH /api/doctors/me/availability-status
router.patch(
  "/me/availability-status",
  protect,
  authorizeRoles("doctor"),
  updateDoctorAvailabilityStatus,
);

/* ======================================================
   04. WEEKLY AVAILABILITY
====================================================== */

// GET /api/doctors/availability
router.get(
  "/availability",
  protect,
  authorizeRoles("doctor"),
  getMyAvailability,
);

// PUT /api/doctors/availability
router.put(
  "/availability",
  protect,
  authorizeRoles("doctor"),
  updateAvailability,
);

/* ======================================================
   05. ADMIN DOCTOR ROUTES
====================================================== */

// POST /api/doctors
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadDoctorImage,
  createDoctor,
);

// GET /api/doctors
router.get("/", protect, authorizeRoles("admin"), getAllDoctors);

// PATCH /api/doctors/:id/status
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateDoctorStatus,
);

// GET /api/doctors/:id
router.get("/:id", protect, authorizeRoles("admin"), GetSingleDoctor);

// PUT /api/doctors/:id
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  uploadDoctorImage,
  updateDoctor,
);

// DELETE /api/doctors/:id
router.delete("/:id", protect, authorizeRoles("admin"), deleteDoctor);

/* ======================================================
   EXPORT ROUTER
====================================================== */

module.exports = router;
