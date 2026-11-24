"use strict";

const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createReview,
  getDoctorReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewVisibility,
  getPublicDoctorRatings,
  getPublicReviews,
} = require("../controllers/reviewController");

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };

// Public
router.get("/public", getPublicReviews);

router.get("/doctor/:doctorId", getDoctorReviews);

router.get("/ratings/doctors", getPublicDoctorRatings);

// Patient
router.post("/", protect, authorize("patient"), createReview);
router.get("/my", protect, authorize("patient"), getMyReviews);
router.put("/:reviewId", protect, authorize("patient"), updateReview);
router.delete("/:reviewId", protect, authorize("patient"), deleteReview);

// Admin
router.get("/admin/all", protect, authorize("admin"), getAllReviews);

router.patch(
  "/admin/:reviewId/visibility",
  protect,
  authorize("admin"),
  updateReviewVisibility,
);

module.exports = router;
