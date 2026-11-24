"use strict";

const mongoose = require("mongoose");

/* ======================================================
   01. CONSTANTS AND HELPERS
====================================================== */

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Check whether the end date is equal to or
 * later than the start date.
 */
const validDateRange = (start, end) => {
  if (!start || !end) {
    return true;
  }

  return end >= start;
};

/**
 * Convert HH:MM into minutes.
 *
 * Example:
 * "09:30" -> 570
 */
const timeToMinutes = (time) => {
  if (typeof time !== "string" || !TIME_REGEX.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

/* ======================================================
   02. MEMBERSHIP SCHEMA
====================================================== */

const membershipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
  },
  {
    _id: true,
  },
);

/* ======================================================
   03. EXPERIENCE SCHEMA
====================================================== */

const experienceSchema = new mongoose.Schema(
  {
    hospital: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, "Years of experience cannot be negative"],
    },

    jobDescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: 3000,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  },
);

/* ======================================================
   04. EXPERIENCE DATE VALIDATION

   Mongoose modern middleware:
   Do not use next() here.
====================================================== */

experienceSchema.pre("validate", function () {
  if (!validDateRange(this.startDate, this.endDate)) {
    this.invalidate(
      "endDate",
      "Experience end date cannot be before start date",
    );
  }
});

/* ======================================================
   05. EDUCATION SCHEMA
====================================================== */

const educationSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    course: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    numberOfYears: {
      type: Number,
      default: 0,
      min: [0, "Number of years cannot be negative"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 3000,
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
  },
);

/* ======================================================
   06. EDUCATION DATE VALIDATION
====================================================== */

educationSchema.pre("validate", function () {
  if (!validDateRange(this.startDate, this.endDate)) {
    this.invalidate(
      "endDate",
      "Education end date cannot be before start date",
    );
  }
});

/* ======================================================
   07. TIME SLOT SCHEMA
====================================================== */

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
      match: [TIME_REGEX, "Start time must use HH:MM format"],
    },

    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
      match: [TIME_REGEX, "End time must use HH:MM format"],
    },
  },
  {
    _id: true,
  },
);

/* ======================================================
   08. TIME SLOT VALIDATION

   Rules:
   - Valid HH:MM
   - End time must be after start time
====================================================== */

timeSlotSchema.pre("validate", function () {
  const start = timeToMinutes(this.startTime);

  const end = timeToMinutes(this.endTime);

  // The schema's match validator handles
  // invalid time formats.
  if (start === null || end === null) {
    return;
  }

  if (start >= end) {
    this.invalidate("endTime", "End time must be after start time");
  }
});

/* ======================================================
   09. AVAILABILITY SCHEMA
====================================================== */

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: {
        values: WEEK_DAYS,
        message: "Invalid availability day",
      },
    },

    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  {
    _id: true,
  },
);

/* ======================================================
   10. AVAILABILITY SLOT VALIDATION

   Prevent overlapping slots within one day.

   Valid:
   09:00 - 10:00
   10:00 - 11:00

   Invalid:
   09:00 - 10:30
   10:00 - 11:00
====================================================== */

availabilitySchema.pre("validate", function () {
  const slots = this.slots || [];

  if (!Array.isArray(slots)) {
    this.invalidate("slots", "Slots must be an array");

    return;
  }

  const sortedSlots = [...slots].sort((a, b) => {
    const startA = timeToMinutes(a.startTime);

    const startB = timeToMinutes(b.startTime);

    return (startA ?? Infinity) - (startB ?? Infinity);
  });

  for (let i = 1; i < sortedSlots.length; i++) {
    const previous = sortedSlots[i - 1];
    const current = sortedSlots[i];

    const previousEnd = timeToMinutes(previous.endTime);

    const currentStart = timeToMinutes(current.startTime);

    // Invalid formats are handled by
    // the timeSlotSchema validators.
    if (previousEnd === null || currentStart === null) {
      continue;
    }

    if (currentStart < previousEnd) {
      this.invalidate("slots", `Overlapping time slots on ${this.day}`);

      break;
    }
  }
});

/* ======================================================
   11. MAIN DOCTOR SCHEMA
====================================================== */

const doctorSchema = new mongoose.Schema(
  {
    /* ==================================================
       USER REFERENCE
    ================================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    /* ==================================================
       PROFILE SETTINGS
    ================================================== */

    displayName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    designation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    languages: {
      type: [String],
      default: [],
    },

    memberships: {
      type: [membershipSchema],
      default: [],
    },

    /* ==================================================
       SPECIALITY
    ================================================== */

    speciality: {
      type: String,
      required: [true, "Speciality is required"],
      trim: true,
      maxlength: 200,
    },

    /* ==================================================
       HOSPITAL
    ================================================== */

    hospital: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    /* ==================================================
       CONSULTATION FEE
    ================================================== */

    consultationFee: {
      type: Number,
      default: 0,
      min: [0, "Consultation fee cannot be negative"],
    },

    /* ==================================================
       MEMBER SINCE
    ================================================== */

    memberSince: {
      type: Date,
      default: Date.now,
    },

    /* ==================================================
       EXPERIENCE
    ================================================== */

    experiences: {
      type: [experienceSchema],
      default: [],
    },

    /* ==================================================
       EDUCATION
    ================================================== */

    education: {
      type: [educationSchema],
      default: [],
    },

    /* ==================================================
       WEEKLY AVAILABILITY
    ================================================== */

    availability: {
      type: [availabilitySchema],
      default: [],
    },

    /* ==================================================
       DOCTOR AVAILABILITY STATUS
    ================================================== */

    isAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/* ======================================================
   12. DUPLICATE AVAILABILITY DAY VALIDATION

   Example invalid:
   [
     { day: "Monday", slots: [] },
     { day: "Monday", slots: [] }
   ]
====================================================== */

doctorSchema.pre("validate", function () {
  const usedDays = new Set();

  for (const item of this.availability || []) {
    if (usedDays.has(item.day)) {
      this.invalidate(
        "availability",
        `Duplicate availability day: ${item.day}`,
      );

      break;
    }

    usedDays.add(item.day);
  }
});

/* ======================================================
   13. DATABASE INDEXES
====================================================== */

// Search doctors by speciality.
doctorSchema.index({
  speciality: 1,
});

// Search doctors by hospital.
doctorSchema.index({
  hospital: 1,
});

// Filter doctors by availability.
doctorSchema.index({
  isAvailable: 1,
});

// Combined speciality and availability filter.
doctorSchema.index({
  speciality: 1,
  isAvailable: 1,
});

/*
  The user field already has unique: true.
  No duplicate user index is needed.
*/

/* ======================================================
   14. MODEL
====================================================== */

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

/* ======================================================
   15. EXPORT
====================================================== */

module.exports = Doctor;
