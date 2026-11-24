const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ==========================================
    // APPOINTMENT REFERENCE
    // Multiple payment attempts are allowed
    // for the same appointment
    // ==========================================

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },

    // ==========================================
    // PATIENT REFERENCE
    // ==========================================

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // UNIQUE PAYHERE ORDER ID
    // Every payment attempt gets a new order ID
    // ==========================================

    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ==========================================
    // PAYHERE PAYMENT ID
    // ==========================================

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // PAYMENT AMOUNT
    // ==========================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // CURRENCY
    // ==========================================

    currency: {
      type: String,
      default: "LKR",
      uppercase: true,
      trim: true,
    },

    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },

    // ==========================================
    // PAYHERE STATUS CODE
    // ==========================================

    statusCode: {
      type: String,
      default: "",
    },

    // ==========================================
    // PAYHERE STATUS MESSAGE
    // ==========================================

    statusMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ==========================================
// COMPOUND INDEXES
// ==========================================

// Quickly retrieve payment history for
// a particular appointment
paymentSchema.index({
  appointment: 1,
  createdAt: -1,
});

// Retrieve payment attempts by patient
paymentSchema.index({
  patient: 1,
  createdAt: -1,
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model("Payment", paymentSchema);
