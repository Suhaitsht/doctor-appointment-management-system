"use strict";

const mongoose = require("mongoose");

// ======================================================
// JAYANTHI MEDICAL CENTRE
// APPOINTMENT MODEL
// ======================================================

// Appointment date:
// Stored as UTC midnight for the selected calendar date.
//
// Example:
// 2026-10-20 -> 2026-10-20T00:00:00.000Z
//
// Appointment time:
// Stored in Sri Lanka local time (HH:mm).

const HOSPITAL_TIME_ZONE = "Asia/Colombo";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

// ======================================================
// 1. DATE HELPERS
// ======================================================

// Convert YYYY-MM-DD to UTC midnight.

function dateOnlyToUTC(value) {
  if (typeof value !== "string") {
    throw new TypeError("Appointment date must be YYYY-MM-DD");
  }

  const match = DATE_ONLY_REGEX.exec(value);

  if (!match) {
    throw new RangeError("Appointment date must be YYYY-MM-DD");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const result = new Date(Date.UTC(year, month - 1, day));

  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() + 1 !== month ||
    result.getUTCDate() !== day
  ) {
    throw new RangeError("Invalid appointment calendar date");
  }

  return result;
}

// Convert stored UTC date to YYYY-MM-DD.

function dateUTCToDateOnly(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid appointment date");
  }

  return date.toISOString().slice(0, 10);
}

// Get current date in Sri Lanka.

function colomboTodayDateOnly(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HOSPITAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;

  return `${getPart("year")}-` + `${getPart("month")}-` + `${getPart("day")}`;
}

// ======================================================
// 2. APPOINTMENT TIME HELPERS
// ======================================================

// Convert a Sri Lanka local date/time to a Date object.
//
// Example:
// 2026-10-20 09:30 Colombo
// -> 2026-10-20T04:00:00.000Z

function colomboDateTimeToUTC(dateOnly, time) {
  if (!DATE_ONLY_REGEX.test(dateOnly)) {
    throw new RangeError("Date must be in YYYY-MM-DD format");
  }

  // Validate the actual calendar date.
  dateOnlyToUTC(dateOnly);

  if (!TIME_REGEX.test(time)) {
    throw new RangeError("Time must be in HH:mm format");
  }

  const result = new Date(`${dateOnly}T${time}:00+05:30`);

  if (Number.isNaN(result.getTime())) {
    throw new RangeError("Invalid Colombo date or time");
  }

  return result;
}

// Get appointment start time.

function getAppointmentStartDate(appointment) {
  if (!appointment?.appointmentDate || !appointment?.timeSlot?.startTime) {
    return null;
  }

  try {
    const dateOnly = dateUTCToDateOnly(appointment.appointmentDate);

    return colomboDateTimeToUTC(dateOnly, appointment.timeSlot.startTime);
  } catch {
    return null;
  }
}

// Get appointment end time.

function getAppointmentEndDate(appointment) {
  if (!appointment?.appointmentDate || !appointment?.timeSlot?.endTime) {
    return null;
  }

  try {
    const dateOnly = dateUTCToDateOnly(appointment.appointmentDate);

    return colomboDateTimeToUTC(dateOnly, appointment.timeSlot.endTime);
  } catch {
    return null;
  }
}

// ======================================================
// 3. APPOINTMENT SCHEMA
// ======================================================

const appointmentSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // PATIENT
    // --------------------------------------------------

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient is required"],
      index: true,
    },

    // --------------------------------------------------
    // DOCTOR
    // --------------------------------------------------

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
      index: true,
    },

    // --------------------------------------------------
    // APPOINTMENT DATE
    // --------------------------------------------------

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      index: true,

      validate: {
        validator: function (value) {
          return (
            value instanceof Date &&
            !Number.isNaN(value.getTime()) &&
            value.getUTCHours() === 0 &&
            value.getUTCMinutes() === 0 &&
            value.getUTCSeconds() === 0 &&
            value.getUTCMilliseconds() === 0
          );
        },

        message: "Appointment date must be normalized to UTC midnight",
      },
    },

    // --------------------------------------------------
    // TIME SLOT
    // --------------------------------------------------

    timeSlot: {
      startTime: {
        type: String,
        required: [true, "Start time is required"],
        trim: true,
        match: [TIME_REGEX, "Start time must be in HH:mm format"],
      },

      endTime: {
        type: String,
        required: [true, "End time is required"],
        trim: true,
        match: [TIME_REGEX, "End time must be in HH:mm format"],
      },
    },

    // --------------------------------------------------
    // PATIENT DETAILS
    // Booking-time snapshot
    // --------------------------------------------------

    patientDetails: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [100, "First name is too long"],
      },

      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [100, "Last name is too long"],
      },

      phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
      },

      email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
      },

      symptoms: {
        type: String,
        default: "",
        trim: true,
        maxlength: [2000, "Symptoms description is too long"],
      },

      attachment: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // --------------------------------------------------
    // APPOINTMENT TYPE
    // --------------------------------------------------

    appointmentType: {
      type: String,
      enum: ["Clinic", "Online"],
      default: "Clinic",
    },

    // --------------------------------------------------
    // CONSULTATION FEE
    // --------------------------------------------------

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: [0, "Consultation fee cannot be negative"],
    },

    // --------------------------------------------------
    // BOOKING FEE
    // --------------------------------------------------

    bookingFee: {
      type: Number,
      default: 0,
      min: [0, "Booking fee cannot be negative"],
    },

    // --------------------------------------------------
    // TAX
    // --------------------------------------------------

    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },

    // --------------------------------------------------
    // DISCOUNT
    // --------------------------------------------------

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    // --------------------------------------------------
    // TOTAL AMOUNT
    // --------------------------------------------------

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // --------------------------------------------------
    // APPOINTMENT STATUS
    // --------------------------------------------------

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    // --------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    // --------------------------------------------------
    // DOCTOR STATUS
    // --------------------------------------------------

    doctorStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },

    // --------------------------------------------------
    // SLOT OCCUPANCY
    // --------------------------------------------------

    slotOccupied: {
      type: Boolean,
      required: true,
      default: true,
    },

    // --------------------------------------------------
    // DOCTOR ACCEPT INFORMATION
    // --------------------------------------------------

    acceptedAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------
    // DOCTOR REJECTION INFORMATION
    // --------------------------------------------------

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------
    // CANCELLATION INFORMATION
    // --------------------------------------------------

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ======================================================
// 4. VALIDATE APPOINTMENT
// ======================================================

appointmentSchema.pre("validate", function validateAppointment() {
  const startTime = this.timeSlot?.startTime;
  const endTime = this.timeSlot?.endTime;

  // ----------------------------------------------
  // CHECK START / END TIME
  // ----------------------------------------------

  if (
    startTime &&
    endTime &&
    TIME_REGEX.test(startTime) &&
    TIME_REGEX.test(endTime) &&
    endTime <= startTime
  ) {
    this.invalidate("timeSlot.endTime", "End time must be after start time");
  }

  // ----------------------------------------------
  // CANCELLED / REJECTED SLOT RULE
  // ----------------------------------------------

  if (
    this.slotOccupied &&
    (this.status === "cancelled" || this.doctorStatus === "rejected")
  ) {
    this.invalidate(
      "slotOccupied",
      "Cancelled or rejected appointments must release their slot",
    );
  }

  // ----------------------------------------------
  // COMPLETED APPOINTMENT RULE
  // ----------------------------------------------

  if (this.status === "completed") {
    if (this.paymentStatus !== "paid") {
      this.invalidate("paymentStatus", "Completed appointments must be paid");
    }

    if (this.doctorStatus !== "accepted") {
      this.invalidate(
        "doctorStatus",
        "Completed appointments must be accepted by the doctor",
      );
    }
  }
});

// ======================================================
// 5. DATABASE INDEXES
// ======================================================

// Doctor appointment availability

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  status: 1,
});

// Patient appointment history

appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});

// Doctor appointment history

appointmentSchema.index({
  doctor: 1,
  appointmentDate: -1,
});

// Doctor request dashboard

appointmentSchema.index({
  doctor: 1,
  doctorStatus: 1,
  paymentStatus: 1,
  appointmentDate: 1,
});

// Doctor accepted appointments

appointmentSchema.index({
  doctor: 1,
  doctorStatus: 1,
  appointmentDate: -1,
});

// ======================================================
// 6. DOUBLE-BOOKING PREVENTION
// ======================================================

// Only active reserved slots participate
// in this unique index.

appointmentSchema.index(
  {
    doctor: 1,
    appointmentDate: 1,
    "timeSlot.startTime": 1,
    "timeSlot.endTime": 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      slotOccupied: true,
    },

    name: "unique_active_doctor_slot",
  },
);

// ======================================================
// 7. STATIC DATE HELPERS
// ======================================================

appointmentSchema.statics.dateOnlyToUTC = dateOnlyToUTC;

appointmentSchema.statics.dateUTCToDateOnly = dateUTCToDateOnly;

appointmentSchema.statics.colomboTodayDateOnly = colomboTodayDateOnly;

appointmentSchema.statics.colomboDateTimeToUTC = colomboDateTimeToUTC;

appointmentSchema.statics.getAppointmentStartDate = getAppointmentStartDate;

appointmentSchema.statics.getAppointmentEndDate = getAppointmentEndDate;

appointmentSchema.statics.HOSPITAL_TIME_ZONE = HOSPITAL_TIME_ZONE;

// ======================================================
// 8. INSTANCE METHODS
// ======================================================

// Check whether appointment has started.

appointmentSchema.methods.hasStarted = function () {
  const startDate = getAppointmentStartDate(this);

  if (!startDate) {
    return false;
  }

  return Date.now() >= startDate.getTime();
};

// Check whether appointment time has ended.

appointmentSchema.methods.hasEnded = function () {
  const endDate = getAppointmentEndDate(this);

  if (!endDate) {
    return false;
  }

  return Date.now() >= endDate.getTime();
};

// Check if doctor can complete consultation.

appointmentSchema.methods.canCompleteConsultation = function () {
  return (
    this.status === "confirmed" &&
    this.paymentStatus === "paid" &&
    this.doctorStatus === "accepted" &&
    this.slotOccupied === true &&
    this.hasEnded()
  );
};

// ======================================================
// 9. CREATE / EXPORT MODEL
// ======================================================

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
