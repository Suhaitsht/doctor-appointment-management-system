"use strict";

const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const User = require("../models/User");

const { getIO } = require("../sockets/socket");
const { sendNotificationEmail } = require("./emailService");

/* ======================================================
   1. HELPER: VALIDATE OBJECT ID
====================================================== */

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

/* ======================================================
   2. HELPER: SAFE SOCKET NOTIFICATION
====================================================== */

const emitNotification = (userId, notification) => {
  try {
    const io = getIO();

    if (!io) {
      return false;
    }

    const room = `user:${String(userId)}`;

    io.to(room).emit("notification:new", notification);

    return true;
  } catch (error) {
    console.error("SOCKET NOTIFICATION ERROR:", error.message);

    return false;
  }
};

/* ======================================================
   3. HELPER: UPDATE EMAIL STATUS
====================================================== */

const updateEmailStatus = async (notificationId, status, errorMessage = "") => {
  try {
    const update = {
      emailStatus: status,
      emailError: errorMessage,
    };

    if (status === "sent") {
      update.emailSentAt = new Date();
    }

    await Notification.updateOne(
      {
        _id: notificationId,
      },
      {
        $set: update,
      },
    );
  } catch (error) {
    console.error("NOTIFICATION EMAIL STATUS UPDATE ERROR:", error.message);
  }
};

/* ======================================================
   4. HELPER: SEND EMAIL SAFELY
====================================================== */

const deliverNotificationEmail = async ({
  notification,
  email,
  title,
  message,
}) => {
  if (!email) {
    return false;
  }

  try {
    await sendNotificationEmail({
      to: email,
      subject: title,
      message,
    });

    await updateEmailStatus(notification._id, "sent");

    notification.emailStatus = "sent";
    notification.emailSentAt = new Date();
    notification.emailError = "";

    return true;
  } catch (error) {
    console.error("NOTIFICATION EMAIL ERROR:", error.message);

    await updateEmailStatus(notification._id, "failed", error.message);

    notification.emailStatus = "failed";
    notification.emailError = error.message;

    return false;
  }
};

/* ======================================================
   5. CREATE NOTIFICATION

   FEATURES:
   - Recipient validation
   - Database notification
   - Event-key deduplication
   - Socket.IO notification
   - Email notification
   - Email status tracking
====================================================== */

const createNotification = async ({
  recipient,
  type = "general",
  title,
  message,
  link = "",
  sendEmail = true,
  eventKey,
} = {}) => {
  // ================================================
  // 1. VALIDATE RECIPIENT
  // ================================================

  const recipientId = recipient?._id || recipient;

  if (!recipientId || !isValidObjectId(recipientId)) {
    throw new Error("Valid notification recipient is required");
  }

  // ================================================
  // 2. VALIDATE TITLE AND MESSAGE
  // ================================================

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Notification title is required");
  }

  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Notification message is required");
  }

  const cleanTitle = title.trim();
  const cleanMessage = message.trim();

  const cleanType =
    typeof type === "string" && type.trim() ? type.trim() : "general";

  const cleanLink = typeof link === "string" ? link.trim() : "";

  const cleanEventKey =
    typeof eventKey === "string" && eventKey.trim() ? eventKey.trim() : null;

  // ================================================
  // 3. FIND USER
  // ================================================

  const user = await User.findById(recipientId).select("email").lean();

  if (!user) {
    throw new Error("Notification recipient not found");
  }

  // ================================================
  // 4. PREPARE NOTIFICATION DATA
  // ================================================

  const shouldSendEmail = Boolean(sendEmail && user.email);

  const notificationData = {
    recipient: user._id,

    type: cleanType,

    title: cleanTitle,

    message: cleanMessage,

    link: cleanLink,

    emailStatus: shouldSendEmail ? "pending" : "not_requested",
  };

  if (cleanEventKey) {
    notificationData.eventKey = cleanEventKey;
  }

  // ================================================
  // 5. SAVE NOTIFICATION
  // ================================================

  let notification;

  try {
    notification = await Notification.create(notificationData);
  } catch (error) {
    // Duplicate event should not create another
    // database notification or resend email.
    //
    // Requires a unique eventKey index in
    // Notification.js.

    if (error.code === 11000 && cleanEventKey) {
      const existing = await Notification.findOne({
        recipient: user._id,
        eventKey: cleanEventKey,
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }

  // ================================================
  // 6. SOCKET.IO REAL-TIME DELIVERY
  // ================================================

  // Database notification is already saved.
  // Socket failure must not remove it.

  emitNotification(user._id, notification);

  // ================================================
  // 7. EMAIL DELIVERY
  // ================================================

  if (shouldSendEmail) {
    await deliverNotificationEmail({
      notification,
      email: user.email,
      title: cleanTitle,
      message: cleanMessage,
    });
  }

  // ================================================
  // 8. RETURN NOTIFICATION
  // ================================================

  return notification;
};

/* ======================================================
   6. EXPORT
====================================================== */

module.exports = {
  createNotification,
};
