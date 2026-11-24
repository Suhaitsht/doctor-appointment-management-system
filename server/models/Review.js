"use strict";

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      immutable: true,
      index: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      immutable: true,
      unique: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Review must contain at least 10 characters"],
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },

    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ doctor: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ patient: 1, createdAt: -1 });

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
