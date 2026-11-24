const express = require("express");

const {
  createSpeciality,
  getAllSpecialities,
  getPublicSpecialities,
  getSingleSpeciality,
  updateSpeciality,
  deleteSpeciality,
} = require("../controllers/specialityController");

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const specialityUpload = require("../middleware/specialityUploadMiddleware");

const router = express.Router();

// ======================================================
// PUBLIC
// ======================================================

router.get("/public", getPublicSpecialities);

// ======================================================
// ADMIN
// ======================================================

// CREATE
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  specialityUpload.single("image"),
  createSpeciality,
);

// GET ALL
router.get("/", protect, authorizeRoles("admin"), getAllSpecialities);

// GET SINGLE
router.get("/:id", protect, authorizeRoles("admin"), getSingleSpeciality);

// UPDATE
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  specialityUpload.single("image"),
  updateSpeciality,
);

// DELETE
router.delete("/:id", protect, authorizeRoles("admin"), deleteSpeciality);

module.exports = router;
