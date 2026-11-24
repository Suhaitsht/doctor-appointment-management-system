const express = require("express");

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// ALL NOTIFICATION ROUTES REQUIRE AUTHENTICATION
// ======================================================

router.use(protect);

// ======================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ======================================================

router.get("/", getMyNotifications);

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ======================================================

router.patch("/read-all", markAllNotificationsRead);

// ======================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ======================================================

router.patch("/:id/read", markNotificationRead);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
