"use strict";

const mongoose = require("mongoose");

/* ======================================================
   USER SCHEMA
====================================================== */

const userSchema = new mongoose.Schema(
  {
    /* ==================================================
       BASIC ACCOUNT INFORMATION
    ================================================== */

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 30,
    },

    password: {
      type: String,
      required: [true, "Password is required"],

      // Password must be explicitly selected
      // by login/password-change controllers.
      select: false,
    },

    /* ==================================================
       USER ROLE
    ================================================== */

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
      required: true,
    },

    /* ==================================================
       PROFILE IMAGE
    ================================================== */

    image: {
      type: String,
      trim: true,
      default: "",
    },

    /* ==================================================
       PROFILE INFORMATION
    ================================================== */

    firstName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["", "Male", "Female", "Other"],
      default: "",
    },

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },

    /* ==================================================
       ADDRESS
    ================================================== */

    address: {
      addressLine: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      city: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      country: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },

      pincode: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
      },
    },

    /* ==================================================
       ACCOUNT STATUS
    ================================================== */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    // ==================================================
    // PASSWORD RESET
    // ==================================================

    resetPasswordToken: {
      type: String,
      select: false,
      default: undefined,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
      default: undefined,
    },

    // Used to invalidate JWTs issued before a password reset.
    passwordChangedAt: {
      type: Date,
      select: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

/* ======================================================
   REMOVE PASSWORD FROM JSON RESPONSES
====================================================== */

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.passwordChangedAt;

    return ret;
  },
});

/* ======================================================
   CREATE USER MODEL
====================================================== */

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
