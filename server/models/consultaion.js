const mongoose = require("mongoose");

// ======================================================
// MEDICATION SCHEMA
// ======================================================

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      maxlength: 200,
    },

    type: {
      type: String,
      enum: [
        "tablet",
        "capsule",
        "syrup",
        "injection",
        "cream",
        "drops",
        "other",
      ],
      default: "tablet",
    },

    dosage: {
      type: String,
      required: [true, "Dosage is required"],
      trim: true,
      maxlength: 200,
    },

    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
      maxlength: 200,
    },

    instruction: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    _id: false,
  },
);

// ======================================================
// CONSULTATION SCHEMA
// ======================================================

const consultationSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // APPOINTMENT - ONE CONSULTATION PER APPOINTMENT
    // --------------------------------------------------

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
      unique: true,
    },

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
    // VITAL SIGNS
    // --------------------------------------------------

    vitals: {
      temperature: {
        type: Number,
        default: null,
        min: [0, "Temperature cannot be negative"],
      },

      pulse: {
        type: Number,
        default: null,
        min: [0, "Pulse cannot be negative"],
      },

      respiratoryRate: {
        type: Number,
        default: null,
        min: [0, "Respiratory rate cannot be negative"],
      },

      spo2: {
        type: Number,
        default: null,
        min: [0, "SpO2 cannot be negative"],
        max: [100, "SpO2 cannot exceed 100"],
      },

      height: {
        type: Number,
        default: null,
        min: [0, "Height cannot be negative"],
      },

      weight: {
        type: Number,
        default: null,
        min: [0, "Weight cannot be negative"],
      },

      bmi: {
        type: Number,
        default: null,
        min: [0, "BMI cannot be negative"],
      },
    },

    // --------------------------------------------------
    // PREVIOUS MEDICAL HISTORY
    // --------------------------------------------------

    previousMedicalHistory: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        5000,
        "Previous medical history cannot exceed 5000 characters",
      ],
    },

    // --------------------------------------------------
    // CLINICAL NOTES
    // --------------------------------------------------

    clinicalNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Clinical notes cannot exceed 5000 characters"],
    },

    // --------------------------------------------------
    // CLINICAL TAGS
    // --------------------------------------------------

    clinicalTags: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],

    // --------------------------------------------------
    // LABORATORY TESTS
    // --------------------------------------------------

    laboratoryTests: [
      {
        type: String,
        trim: true,
        maxlength: 300,
      },
    ],

    // --------------------------------------------------
    // PATIENT COMPLAINTS
    // --------------------------------------------------

    complaints: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],

    // --------------------------------------------------
    // DIAGNOSIS
    // --------------------------------------------------

    diagnosis: {
      primary: {
        type: String,
        default: "",
        trim: true,
        maxlength: [1000, "Primary diagnosis is too long"],
      },

      secondary: {
        type: String,
        default: "",
        trim: true,
        maxlength: [1000, "Secondary diagnosis is too long"],
      },

      final: {
        type: String,
        default: "",
        trim: true,
        maxlength: [1000, "Final diagnosis is too long"],
      },
    },

    // --------------------------------------------------
    // MEDICATIONS / PRESCRIPTION
    // --------------------------------------------------

    medications: {
      type: [medicationSchema],
      default: [],
    },

    // --------------------------------------------------
    // DOCTOR ADVICE
    // --------------------------------------------------

    advice: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Advice cannot exceed 5000 characters"],
    },

    // --------------------------------------------------
    // FOLLOW-UP
    // --------------------------------------------------

    followUp: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Follow-up information is too long"],
    },

    // --------------------------------------------------
    // CONSULTATION STATUS
    // --------------------------------------------------

    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      index: true,
    },

    // --------------------------------------------------
    // COMPLETED TIME
    // --------------------------------------------------

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ======================================================
// INDEXES
// ======================================================

// Patient medical history
consultationSchema.index({
  patient: 1,
  createdAt: -1,
});

// Doctor consultation history
consultationSchema.index({
  doctor: 1,
  createdAt: -1,
});

// Completed consultation history
consultationSchema.index({
  patient: 1,
  completedAt: -1,
});

// ======================================================
// VALIDATION
// ======================================================

consultationSchema.pre("validate", function () {
  if (this.status === "completed") {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.completedAt = null;
  }
});

// ======================================================
// MODEL
// ======================================================

const Consultation = mongoose.model("Consultation", consultationSchema);

module.exports = Consultation;
