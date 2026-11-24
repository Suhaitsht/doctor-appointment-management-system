"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

/* ======================================================
   IMPORT AUTH CONTROLLERS
====================================================== */

const {
  registerUser,
  LoginUser,
  getProfile,
  updateProfile,
  changePassword,
  updateProfileImage,
  deactivateAccount,
  adminTest,

  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

/* ======================================================
   IMPORT MIDDLEWARE
====================================================== */

const protect = require("../middleware/authMiddleware");

const profileUpload = require("../middleware/uploadMiddleware");

/* ======================================================
   ADMIN AUTHORIZATION MIDDLEWARE

   Uses the verified req.user from protect.
====================================================== */

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  return next();
};

/* ======================================================
   PUBLIC AUTH ROUTES
====================================================== */

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", LoginUser);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

router.post("/reset-password/:token", resetPassword);

/* ======================================================
   PROFILE ROUTES
====================================================== */

// GET /api/auth/profile
router.get("/profile", protect, getProfile);

// PUT /api/auth/profile
router.put("/profile", protect, updateProfile);

/* ======================================================
   PROFILE IMAGE UPLOAD
====================================================== */

// PUT /api/auth/profile/image
router.put(
  "/profile/image",
  protect,
  profileUpload.single("image"),
  updateProfileImage,
);

/* ======================================================
   CHANGE PASSWORD
====================================================== */

// PUT /api/auth/change-password
router.put("/change-password", protect, changePassword);

/* ======================================================
   ACCOUNT DEACTIVATION
====================================================== */

// DELETE /api/auth/account
router.delete("/account", protect, deactivateAccount);

/* ======================================================
   ADMIN TEST ROUTE
====================================================== */

// GET /api/auth/admin-test
router.get("/admin-test", protect, adminOnly, adminTest);

/* ======================================================
   EXPORT ROUTER
====================================================== */

module.exports = router;
