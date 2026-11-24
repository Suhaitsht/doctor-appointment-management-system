"use strict";

const mongoose = require("mongoose");

const Consultation = require("../models/consultaion");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// ======================================================
// HELPERS
// ======================================================

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const cleanStringArray = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const cleanMedications = (medications) => {
  if (!Array.isArray(medications)) return [];

  return medications
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((medicine) => ({
      name: cleanString(medicine.name),
      type: cleanString(medicine.type) || "tablet",
      dosage: cleanString(medicine.dosage),
      duration: cleanString(medicine.duration),
      instruction: cleanString(medicine.instruction),
    }))
    .filter(
      (medicine) =>
        medicine.name ||
        medicine.dosage ||
        medicine.duration ||
        medicine.instruction,
    );
};

const getLoggedInDoctor = async (userId) => {
  return Doctor.findOne({ user: userId });
};

// ======================================================
// APPOINTMENT DATE / TIME
// Asia/Colombo = UTC+05:30
// ======================================================

const getAppointmentEndDate = (appointment) => {
  if (!appointment.appointmentDate || !appointment.timeSlot?.endTime) {
    return null;
  }

  const dateOnly = new Date(appointment.appointmentDate)
    .toISOString()
    .slice(0, 10);

  const endTime = appointment.timeSlot.endTime;

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    return null;
  }

  const endDate = new Date(`${dateOnly}T${endTime}:00+05:30`);

  return Number.isNaN(endDate.getTime()) ? null : endDate;
};

// ======================================================
// POPULATE CONSULTATION
// ======================================================

const populateConsultation = async (consultationId) => {
  return Consultation.findById(consultationId)
    .populate("patient", "name email phone image")
    .populate({
      path: "doctor",
      select: "user speciality hospital consultationFee",
      populate: {
        path: "user",
        select: "name email phone image",
      },
    })
    .populate(
      "appointment",
      "appointmentDate timeSlot appointmentType status paymentStatus doctorStatus patientDetails",
    );
};

// ======================================================
// 1. CREATE / COMPLETE CONSULTATION
// POST /api/consultations/:appointmentId
// DOCTOR ONLY
// ======================================================

const createConsultation = async (req, res) => {
  const { appointmentId } = req.params;

  if (!isValidId(appointmentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment ID.",
    });
  }

  if (!req.user?._id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "A valid consultation request body is required.",
    });
  }

  try {
    // ----------------------------------------------
    // FIND LOGGED-IN DOCTOR
    // ----------------------------------------------

    const doctor = await getLoggedInDoctor(req.user._id);

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    // ----------------------------------------------
    // FIND APPOINTMENT
    // ----------------------------------------------

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // ----------------------------------------------
    // VERIFY DOCTOR OWNERSHIP
    // ----------------------------------------------

    if (String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this appointment.",
      });
    }

    // ----------------------------------------------
    // CHECK APPOINTMENT STATUS
    // ----------------------------------------------

    if (appointment.status !== "confirmed") {
      return res.status(409).json({
        success: false,
        message: "Only confirmed appointments can be completed.",
      });
    }

    // ----------------------------------------------
    // CHECK PAYMENT
    // ----------------------------------------------

    if (appointment.paymentStatus !== "paid") {
      return res.status(409).json({
        success: false,
        message:
          "Consultation cannot be completed because payment is not completed.",
      });
    }

    // ----------------------------------------------
    // CHECK DOCTOR ACCEPTANCE
    // ----------------------------------------------

    if (appointment.doctorStatus !== "accepted") {
      return res.status(409).json({
        success: false,
        message:
          "Doctor must accept the appointment before completing consultation.",
      });
    }

    // ----------------------------------------------
    // CHECK SLOT
    // ----------------------------------------------

    if (appointment.slotOccupied !== true) {
      return res.status(409).json({
        success: false,
        message: "The appointment slot is no longer reserved.",
      });
    }

    // ----------------------------------------------
    // CHECK APPOINTMENT END TIME
    // ----------------------------------------------

    const appointmentEnd = getAppointmentEndDate(appointment);

    if (!appointmentEnd) {
      return res.status(400).json({
        success: false,
        message: "Appointment date or time is invalid.",
      });
    }

    if (Date.now() < appointmentEnd.getTime()) {
      return res.status(409).json({
        success: false,
        message:
          "Consultation cannot be completed before the appointment end time.",
      });
    }

    // ----------------------------------------------
    // CHECK EXISTING CONSULTATION
    // ----------------------------------------------

    const existingConsultation = await Consultation.findOne({
      appointment: appointment._id,
    });

    if (existingConsultation) {
      return res.status(409).json({
        success: false,
        message: "A consultation already exists for this appointment.",
      });
    }

    // ----------------------------------------------
    // READ REQUEST BODY
    // ----------------------------------------------

    const {
      vitals = {},
      previousMedicalHistory = "",
      clinicalNotes = "",
      clinicalTags = [],
      laboratoryTests = [],
      complaints = [],
      diagnosis = {},
      medications = [],
      advice = "",
      followUp = "",
    } = req.body;

    const safeVitals =
      vitals && typeof vitals === "object" && !Array.isArray(vitals)
        ? vitals
        : {};

    const safeDiagnosis =
      diagnosis && typeof diagnosis === "object" && !Array.isArray(diagnosis)
        ? diagnosis
        : {};

    const cleanedMedications = cleanMedications(medications);

    for (const medicine of cleanedMedications) {
      if (!medicine.name || !medicine.dosage || !medicine.duration) {
        return res.status(400).json({
          success: false,
          message: "Each medication must contain name, dosage and duration.",
        });
      }
    }

    // ----------------------------------------------
    // PREPARE CONSULTATION DATA
    // ----------------------------------------------

    const consultationData = {
      appointment: appointment._id,
      patient: appointment.patient,
      doctor: appointment.doctor,

      vitals: {
        temperature: safeVitals.temperature ?? null,
        pulse: safeVitals.pulse ?? null,
        respiratoryRate: safeVitals.respiratoryRate ?? null,
        spo2: safeVitals.spo2 ?? null,
        height: safeVitals.height ?? null,
        weight: safeVitals.weight ?? null,
        bmi: safeVitals.bmi ?? null,
      },

      previousMedicalHistory: cleanString(previousMedicalHistory),

      clinicalNotes: cleanString(clinicalNotes),

      clinicalTags: cleanStringArray(clinicalTags),

      laboratoryTests: cleanStringArray(laboratoryTests),

      complaints: cleanStringArray(complaints),

      diagnosis: {
        primary: cleanString(safeDiagnosis.primary),
        secondary: cleanString(safeDiagnosis.secondary),
        final: cleanString(safeDiagnosis.final),
      },

      medications: cleanedMedications,

      advice: cleanString(advice),

      followUp: cleanString(followUp),

      status: "completed",

      completedAt: new Date(),
    };

    // ==================================================
    // STANDALONE MONGODB IMPLEMENTATION
    // NO TRANSACTIONS / NO SESSIONS
    //
    // Step 1: Create consultation
    // Step 2: Update appointment conditionally
    //
    // A unique index on Consultation.appointment is
    // required to prevent duplicate consultations.
    // ==================================================

    let createdConsultation;

    try {
      // Validate against Consultation schema before write.
      const consultationDocument = new Consultation(consultationData);

      await consultationDocument.validate();

      // Create consultation first, leaving the
      // appointment confirmed until the second write.
      createdConsultation = await consultationDocument.save();

      // Recheck all important statuses during update.
      const updatedAppointment = await Appointment.findOneAndUpdate(
        {
          _id: appointment._id,
          doctor: doctor._id,
          status: "confirmed",
          paymentStatus: "paid",
          doctorStatus: "accepted",
          slotOccupied: true,
        },
        {
          $set: {
            status: "completed",
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updatedAppointment) {
        const conflict = new Error(
          "Appointment status changed. Please refresh and try again.",
        );

        conflict.statusCode = 409;
        throw conflict;
      }
    } catch (writeError) {
      // Best-effort cleanup.
      // Only delete the consultation created by
      // this request, never an existing record.
      if (createdConsultation?._id) {
        try {
          await Consultation.deleteOne({
            _id: createdConsultation._id,
            appointment: appointment._id,
          });
        } catch (cleanupError) {
          console.error("CONSULTATION CLEANUP FAILED:", cleanupError);

          // Database may now contain a partial write.
          // Do not claim a successful rollback.
        }
      }

      throw writeError;
    }

    // ----------------------------------------------
    // POPULATE RESPONSE
    // ----------------------------------------------

    let populatedConsultation = null;

    try {
      populatedConsultation = await populateConsultation(
        createdConsultation._id,
      );
    } catch (populateError) {
      console.error("POPULATE CONSULTATION ERROR:", populateError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Consultation completed successfully.",
      consultation: populatedConsultation || createdConsultation,
    });
  } catch (error) {
    console.error("CREATE CONSULTATION ERROR:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((item) => item.message)
          .join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A consultation already exists for this appointment.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while completing consultation.",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
      }),
    });
  }
};

// ======================================================
// 2. GET CONSULTATION BY APPOINTMENT
// GET /api/consultations/appointment/:appointmentId
// DOCTOR / PATIENT / ADMIN
// ======================================================

const getConsultationByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const consultation = await Consultation.findOne({
      appointment: appointmentId,
    })
      .populate("patient", "name email phone image role")
      .populate({
        path: "doctor",
        select: "user speciality hospital consultationFee",
        populate: {
          path: "user",
          select: "name email phone image role",
        },
      })
      .populate("appointment");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation record not found.",
      });
    }

    // ----------------------------------------------
    // AUTHORIZATION
    // ----------------------------------------------

    const loggedUserId = String(req.user._id);
    const loggedUserRole = req.user.role;

    const patientUserId = consultation.patient?._id?.toString();

    const doctorUserId = consultation.doctor?.user?._id?.toString();

    const isPatientOwner =
      loggedUserRole === "patient" && patientUserId === loggedUserId;

    const isDoctorOwner =
      loggedUserRole === "doctor" && doctorUserId === loggedUserId;

    const isAdmin = loggedUserRole === "admin";

    if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this consultation record.",
      });
    }

    return res.status(200).json({
      success: true,
      consultation,
    });
  } catch (error) {
    console.error("GET CONSULTATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load consultation record.",
    });
  }
};

// ======================================================
// 3. GET MY CONSULTATIONS
// GET /api/consultations/patient/me
// PATIENT ONLY
// ======================================================

const getMyConsultations = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const consultations = await Consultation.find({
      patient: req.user._id,
    })
      .populate({
        path: "doctor",
        select: "user speciality hospital consultationFee",
        populate: {
          path: "user",
          select: "name email phone image",
        },
      })
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot appointmentType status paymentStatus",
      })
      .sort({
        completedAt: -1,
      });

    return res.status(200).json({
      success: true,
      total: consultations.length,
      consultations,
    });
  } catch (error) {
    console.error("GET MY CONSULTATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load medical records.",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  createConsultation,
  getConsultationByAppointment,
  getMyConsultations,
};
