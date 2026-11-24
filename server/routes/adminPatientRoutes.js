const express = require("express");
const multer = require("multer");

const {
  getAdminPatients,
  getAdminPatientById,
  createAdminPatient,
  updateAdminPatient,
  deleteAdminPatient,
} = require("../controllers/adminPatientController");

const upload = require("../middleware/uploadMiddleware");

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin only
router.use(protect);
router.use(authorizeRoles("admin"));

// Upload error handler
const uploadPatientImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must not exceed 5 MB."
            : error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Image upload failed.",
    });
  });
};

// Get patients
router.get("/", getAdminPatients);

// Create patient
router.post("/", uploadPatientImage, createAdminPatient);

// Get single patient
router.get("/:patientId", getAdminPatientById);

// UPDATE patient
router.patch("/:patientId", uploadPatientImage, updateAdminPatient);

// DELETE patient
router.delete("/:patientId", deleteAdminPatient);

module.exports = router;
