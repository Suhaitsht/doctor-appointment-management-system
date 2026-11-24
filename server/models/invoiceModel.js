const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    consultationFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    bookingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "paid",
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ======================================================
// INDEXES
// ======================================================

invoiceSchema.index({
  patient: 1,
  createdAt: -1,
});

invoiceSchema.index({
  doctor: 1,
  createdAt: -1,
});

// appointment already has unique: true,
// so no extra duplicate index needed.

// ======================================================
// MODEL
// ======================================================

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
