"use strict";

const mongoose = require("mongoose");

const Notification = require("../models/Notification");

const { getIO } = require("../sockets/socket");

/* ======================================================
   HELPER: GET AUTHENTICATED USER ID
====================================================== */

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

/* ======================================================
   HELPER: VALIDATE USER
====================================================== */

const validateUser = (req, res) => {
  const userId = getUserId(req);

  if (!userId || !mongoose.isValidObjectId(userId)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return userId;
};

/* ======================================================
   HELPER: SOCKET EMIT
====================================================== */

const emitNotificationUpdate = (userId, event, payload) => {
  try {
    const io = getIO();

    io.to(`user:${String(userId)}`).emit(event, payload);
  } catch (error) {
    console.error("Notification socket error:", error.message);
  }
};

/* ======================================================
   HELPER: GET UNREAD COUNT
====================================================== */

const countUnread = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

/* ======================================================
   1. GET MY NOTIFICATIONS

   GET /api/notifications

   Optional query parameters:
   ?page=1
   ?limit=20
   ?isRead=false
====================================================== */

const getMyNotifications = async (req, res) => {
  try {
    const userId = validateUser(req, res);

    if (!userId) return;

    // ================================================
    // PAGINATION VALIDATION
    // ================================================

    const requestedPage = Number(req.query.page ?? 1);

    const requestedLimit = Number(req.query.limit ?? 20);

    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    const page = requestedPage;

    const limit = Math.min(50, requestedLimit);

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "Pagination offset is too large",
      });
    }

    // ================================================
    // RECIPIENT-SPECIFIC QUERY
    // ================================================

    const query = {
      recipient: userId,
    };

    // ================================================
    // OPTIONAL READ STATUS FILTER
    // ================================================

    if (req.query.isRead !== undefined) {
      if (req.query.isRead !== "true" && req.query.isRead !== "false") {
        return res.status(400).json({
          success: false,
          message: "isRead must be true or false",
        });
      }

      query.isRead = req.query.isRead === "true";
    }

    // ================================================
    // FETCH NOTIFICATIONS
    // ================================================

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(query),

      countUnread(userId),
    ]);

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      notifications,

      unreadCount,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/* ======================================================
   2. MARK SINGLE NOTIFICATION AS READ

   PATCH /api/notifications/:id/read
====================================================== */

const markNotificationRead = async (req, res) => {
  try {
    const userId = validateUser(req, res);

    if (!userId) return;

    const { id } = req.params;

    // ================================================
    // VALIDATE NOTIFICATION ID
    // ================================================

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    // ================================================
    // ATOMIC UPDATE
    // ================================================

    const updatedNotification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    let notification = updatedNotification;

    // ================================================
    // ALREADY READ OR NOT FOUND
    // ================================================

    if (!notification) {
      notification = await Notification.findOne({
        _id: id,
        recipient: userId,
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
    }

    // ================================================
    // CURRENT UNREAD COUNT
    // ================================================

    const unreadCount = await countUnread(userId);

    // ================================================
    // SOCKET.IO UPDATE
    // ================================================

    if (updatedNotification) {
      emitNotificationUpdate(userId, "notification:read", {
        notificationId: String(notification._id),
        unreadCount,
      });
    }

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

/* ======================================================
   3. MARK ALL NOTIFICATIONS AS READ

   PATCH /api/notifications/read-all
====================================================== */

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = validateUser(req, res);

    if (!userId) return;

    // ================================================
    // UPDATE ONLY UNREAD NOTIFICATIONS
    // ================================================

    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    // ================================================
    // GET REMAINING UNREAD COUNT
    // ================================================

    const unreadCount = await countUnread(userId);

    // ================================================
    // REAL-TIME UPDATE
    // ================================================

    emitNotificationUpdate(userId, "notification:read-all", {
      unreadCount,
      modifiedCount: result.modifiedCount,
    });

    // ================================================
    // RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message: "All notifications marked as read",

      modifiedCount: result.modifiedCount,

      unreadCount,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

/* ======================================================
   EXPORT
====================================================== */

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
