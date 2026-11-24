"use strict";

const mongoose = require("mongoose");

/* ======================================================
   NOTIFICATION SCHEMA
====================================================== */

const notificationSchema = new mongoose.Schema(
  {
    // ================================================
    // 1. RECIPIENT
    // ================================================

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
      index: true,
    },

    // ================================================
    // 2. NOTIFICATION TYPE
    // ================================================

    type: {
      type: String,

      enum: [
        "appointment_booked",
        "appointment_approved",
        "appointment_rejected",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_reminder",
        "payment_success",
        "general",
      ],

      default: "general",
      trim: true,
    },

    // ================================================
    // 3. NOTIFICATION TITLE
    // ================================================

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: 200,
    },

    // ================================================
    // 4. NOTIFICATION MESSAGE
    // ================================================

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: 5000,
    },

    // ================================================
    // 5. REDIRECT LINK
    // ================================================

    link: {
      type: String,
      default: "",
      trim: true,
    },

    // ================================================
    // 6. EVENT KEY
    //
    // Prevent duplicate notifications for the
    // same recipient and same event.
    //
    // Example:
    // appointment:123:doctor_accepted:patient
    // ================================================

    eventKey: {
      type: String,
      default: undefined,
      trim: true,
    },

    // ================================================
    // 7. READ STATUS
    // ================================================

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // ================================================
    // 8. EMAIL DELIVERY STATUS
    // ================================================

    emailStatus: {
      type: String,

      enum: ["not_requested", "pending", "sent", "failed"],

      default: "not_requested",
    },

    // ================================================
    // 9. EMAIL SENT DATE
    // ================================================

    emailSentAt: {
      type: Date,
      default: null,
    },

    // ================================================
    // 10. EMAIL ERROR
    // ================================================

    emailError: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/* ======================================================
   INDEX 1: RECIPIENT + CREATED DATE

   Fast notification list queries.
====================================================== */

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

/* ======================================================
   INDEX 2: RECIPIENT + READ STATUS

   Fast unread notification queries.
====================================================== */

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

/* ======================================================
   INDEX 3: UNIQUE EVENT KEY

   One event per recipient.

   Notifications without eventKey are allowed.

   MongoDB partial unique index.
====================================================== */

notificationSchema.index(
  {
    recipient: 1,
    eventKey: 1,
  },
  {
    name: "unique_recipient_event",

    unique: true,

    partialFilterExpression: {
      eventKey: {
        $type: "string",
      },
    },
  },
);

/* ======================================================
   MODEL EXPORT
====================================================== */

module.exports = mongoose.model("Notification", notificationSchema);
