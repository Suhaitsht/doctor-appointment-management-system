"use strict";

const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const { createNotification } = require("../services/notificationService");

/* ======================================================
   NOTIFICATION HELPERS
====================================================== */

const patientLink = "/patient/appointments";
const doctorLink = "/doctor/requests";
const adminLink = "/admin/appointments";

// Notification errors must not reverse an appointment.
const notifySafely = async (payload) => {
  if (!payload?.recipient) return null;

  try {
    return await createNotification(payload);
  } catch (error) {
    console.error("APPOINTMENT NOTIFICATION ERROR:", error.message);
    return null;
  }
};

// Notify patient and/or doctor.
// Messages must be objects: { title, message }.
const notifyPatientAndDoctor = async (
  appointment,
  patientMessage,
  doctorMessage,
  type,
  eventAction = type,
) => {
  const appointmentId = String(appointment._id);

  const patientUserId = appointment.patient?._id || appointment.patient;

  const doctorUserId =
    appointment.doctor?.user?._id || appointment.doctor?.user;

  const jobs = [];

  if (patientMessage && patientUserId) {
    jobs.push(
      notifySafely({
        recipient: patientUserId,
        type,
        title: patientMessage.title,
        message: patientMessage.message,
        link: patientLink,
        sendEmail: true,
        eventKey: `appointment:${appointmentId}:` + `${eventAction}:patient`,
      }),
    );
  }

  if (doctorMessage && doctorUserId) {
    jobs.push(
      notifySafely({
        recipient: doctorUserId,
        type,
        title: doctorMessage.title,
        message: doctorMessage.message,
        link: doctorLink,
        sendEmail: true,
        eventKey: `appointment:${appointmentId}:` + `${eventAction}:doctor`,
      }),
    );
  }

  await Promise.allSettled(jobs);
};

// Notify active administrators.
const notifyAdmins = async (
  appointment,
  { type, title, message, sendEmail = false, eventAction = type },
) => {
  try {
    const admins = await User.find({
      role: "admin",
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    await Promise.allSettled(
      admins.map((admin) =>
        notifySafely({
          recipient: admin._id,
          type,
          title,
          message,
          link: adminLink,
          sendEmail,
          eventKey:
            `appointment:${appointment._id}:` +
            `${eventAction}:admin:${admin._id}`,
        }),
      ),
    );
  } catch (error) {
    console.error("ADMIN NOTIFICATION ERROR:", error.message);
  }
};

/* ======================================================
   DATE HELPERS — ASIA/COLOMBO
====================================================== */

// YYYY-MM-DD -> UTC midnight calendar date.
const createDateOnly = (dateString) => {
  return Appointment.dateOnlyToUTC(dateString);
};

const getDayName = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
};

// Exclusive end boundary.
const getDayRange = (date) => {
  const dateString =
    typeof date === "string" ? date : Appointment.dateUTCToDateOnly(date);

  const startOfDay = Appointment.dateOnlyToUTC(dateString);

  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  return {
    startOfDay,
    endOfDay,
  };
};

const isValidDateString = (dateString) => {
  try {
    Appointment.dateOnlyToUTC(dateString);
    return true;
  } catch {
    return false;
  }
};

// Current date in hospital timezone.
const getColomboToday = () => {
  return Appointment.colomboTodayDateOnly();
};

/* ======================================================
   GENERAL HELPERS
====================================================== */

const getErrorResponse = (error) => ({
  ...(process.env.NODE_ENV === "development" && {
    error: error.message,
  }),
});

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getDoctorBookingError = (doctor) => {
  if (doctor.user && doctor.user.isActive === false) {
    return {
      status: 409,
      message: "This doctor account is currently inactive.",
    };
  }

  if (doctor.isAvailable !== true) {
    return {
      status: 409,
      message: "This doctor is currently unavailable for booking.",
    };
  }

  return null;
};

const populateAppointment = async (appointment) => {
  await appointment.populate([
    {
      path: "patient",
      select: "name email phone image",
    },
    {
      path: "doctor",
      select: "user speciality hospital consultationFee",
      populate: {
        path: "user",
        select: "name email phone image",
      },
    },
  ]);

  return appointment;
};

const getPagination = (page, limit) => {
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);

  const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  return {
    currentPage,
    limit: pageLimit,
    skip: (currentPage - 1) * pageLimit,
  };
};

const getPaginationResponse = (total, currentPage, limit) => ({
  currentPage,
  totalPages: Math.ceil(total / limit),
  limit,
  hasNextPage: currentPage * limit < total,
  hasPreviousPage: currentPage > 1,
});

/* ======================================================
   1. GET AVAILABLE SLOTS

   GET /api/appointments/doctor/:doctorId/slots
====================================================== */

const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!isValidId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    // Colombo-local calendar date.
    if (date < getColomboToday()) {
      return res.status(400).json({
        success: false,
        message: "Past dates cannot be selected.",
      });
    }

    const selectedDate = createDateOnly(date);

    const doctor = await Doctor.findById(doctorId).populate(
      "user",
      "name email phone image isActive",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const bookingError = getDoctorBookingError(doctor);

    if (bookingError) {
      return res.status(bookingError.status).json({
        success: false,
        doctor: doctor._id,
        date,
        isAvailable: false,
        totalSlots: 0,
        bookedSlots: 0,
        availableSlotCount: 0,
        slots: [],
        message: bookingError.message,
      });
    }

    const dayName = getDayName(selectedDate);

    const dayAvailability = doctor.availability?.find(
      (item) => item.day === dayName,
    );

    if (
      !dayAvailability ||
      !Array.isArray(dayAvailability.slots) ||
      dayAvailability.slots.length === 0
    ) {
      return res.status(200).json({
        success: true,
        doctor: doctor._id,
        date,
        day: dayName,
        isAvailable: true,
        totalSlots: 0,
        bookedSlots: 0,
        availableSlotCount: 0,
        slots: [],
        message: `Doctor is not available on ${dayName}.`,
      });
    }

    // Only active reservations block slots.
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: selectedDate,
      slotOccupied: true,
    })
      .select("timeSlot")
      .lean();

    const availableSlots = dayAvailability.slots.filter((doctorSlot) => {
      const isBooked = bookedAppointments.some(
        (appointment) =>
          appointment.timeSlot?.startTime === doctorSlot.startTime &&
          appointment.timeSlot?.endTime === doctorSlot.endTime,
      );

      return !isBooked;
    });

    return res.status(200).json({
      success: true,
      doctor: doctor._id,
      date,
      day: dayName,
      isAvailable: true,
      totalSlots: dayAvailability.slots.length,
      bookedSlots: dayAvailability.slots.length - availableSlots.length,
      availableSlotCount: availableSlots.length,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("GET AVAILABLE SLOTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching available slots.",
      ...getErrorResponse(error),
    });
  }
};

// END OF SECTION 1
// DO NOT ADD module.exports HERE.
// CONTINUE WITH SECTION 2 BELOW.

/* ======================================================
   2. CREATE APPOINTMENT

   POST /api/appointments

   FEATURES:
   - Patient authentication
   - Doctor validation
   - Patient details validation
   - Colombo timezone
   - Doctor availability validation
   - Double-booking protection
   - Payment pending
   - Patient notification
   - Doctor notification
   - Admin notification
====================================================== */

const createAppointment = async (req, res) => {
  try {
    const patientId = req.user?._id;

    // ================================================
    // AUTHENTICATION
    // ================================================

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // REQUEST DATA
    // ================================================

    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      patientDetails,
      appointmentType = "Clinic",
    } = req.body || {};

    // ================================================
    // REQUIRED FIELDS
    // ================================================

    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Doctor, appointment date, start time and end time are required.",
      });
    }

    // ================================================
    // DOCTOR ID VALIDATION
    // ================================================

    if (!isValidId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    // ================================================
    // PATIENT DETAILS VALIDATION
    // ================================================

    if (
      typeof patientDetails?.firstName !== "string" ||
      typeof patientDetails?.lastName !== "string" ||
      typeof patientDetails?.phone !== "string" ||
      typeof patientDetails?.email !== "string" ||
      !patientDetails.firstName.trim() ||
      !patientDetails.lastName.trim() ||
      !patientDetails.phone.trim() ||
      !patientDetails.email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Patient first name, last name, phone and email are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(patientDetails.email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // ================================================
    // APPOINTMENT TYPE VALIDATION
    // ================================================

    if (!["Clinic", "Online"].includes(appointmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment type.",
      });
    }

    // ================================================
    // DATE VALIDATION
    // ================================================

    if (!isValidDateString(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date.",
      });
    }

    // Hospital-local calendar comparison.
    // YYYY-MM-DD strings sort chronologically.

    if (appointmentDate < getColomboToday()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book an appointment for a past date.",
      });
    }

    const selectedDate = createDateOnly(appointmentDate);

    // ================================================
    // FIND DOCTOR
    // ================================================

    const doctor = await Doctor.findById(doctorId).populate(
      "user",
      "name email phone image isActive",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // ================================================
    // DOCTOR ELIGIBILITY
    // ================================================

    const bookingError = getDoctorBookingError(doctor);

    if (bookingError) {
      return res.status(bookingError.status).json({
        success: false,
        isAvailable: false,
        message: bookingError.message,
      });
    }

    // ================================================
    // DOCTOR SCHEDULE
    // ================================================

    const dayName = getDayName(selectedDate);

    const dayAvailability = doctor.availability?.find(
      (item) => item.day === dayName,
    );

    if (
      !dayAvailability ||
      !Array.isArray(dayAvailability.slots) ||
      dayAvailability.slots.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}.`,
      });
    }

    // ================================================
    // VALIDATE SELECTED SLOT
    // ================================================

    const validSlot = dayAvailability.slots.find(
      (slot) => slot.startTime === startTime && slot.endTime === endTime,
    );

    if (!validSlot) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available for this doctor.",
      });
    }

    // ================================================
    // CHECK EXISTING ACTIVE BOOKING
    // ================================================

    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,

      appointmentDate: selectedDate,

      "timeSlot.startTime": startTime,

      "timeSlot.endTime": endTime,

      slotOccupied: true,
    }).select("_id");

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message:
          "This appointment slot is already booked. Please select another time.",
      });
    }

    // ================================================
    // CALCULATE FEES
    // ================================================

    const consultationFee = Number(doctor.consultationFee) || 0;

    const bookingFee = 0;
    const tax = 0;
    const discount = 0;

    const totalAmount = Math.max(
      0,
      consultationFee + bookingFee + tax - discount,
    );

    // ================================================
    // CREATE APPOINTMENT
    // ================================================

    const appointment = await Appointment.create({
      patient: patientId,

      doctor: doctor._id,

      appointmentDate: selectedDate,

      timeSlot: {
        startTime,
        endTime,
      },

      patientDetails: {
        firstName: patientDetails.firstName.trim(),

        lastName: patientDetails.lastName.trim(),

        phone: patientDetails.phone.trim(),

        email: patientDetails.email.trim().toLowerCase(),

        symptoms:
          typeof patientDetails.symptoms === "string"
            ? patientDetails.symptoms.trim()
            : "",

        attachment:
          typeof patientDetails.attachment === "string"
            ? patientDetails.attachment.trim()
            : "",
      },

      appointmentType,

      consultationFee,
      bookingFee,
      tax,
      discount,
      totalAmount,

      status: "pending",

      paymentStatus: "pending",

      doctorStatus: "pending",

      // Prevent duplicate active bookings.
      slotOccupied: true,
    });

    // ================================================
    // POPULATE APPOINTMENT
    // ================================================

    // Booking is already saved. A population
    // failure should not create a second booking
    // when the client retries.

    try {
      await populateAppointment(appointment);
    } catch (populateError) {
      console.error(
        "CREATE APPOINTMENT POPULATE ERROR:",
        populateError.message,
      );
    }

    // ================================================
    // NOTIFICATION INFORMATION
    // ================================================

    const patientName =
      [
        appointment.patientDetails?.firstName,

        appointment.patientDetails?.lastName,
      ]
        .filter(Boolean)
        .join(" ") || "Patient";

    const doctorName = doctor.user?.name || "Doctor";

    const bookingDate = appointmentDate;

    const bookingTime = `${startTime} - ${endTime}`;

    // Use known IDs even if population failed.
    const notificationAppointment = {
      _id: appointment._id,

      patient: patientId,

      doctor: {
        user: doctor.user?._id || doctor.user,
      },
    };

    // ================================================
    // PATIENT + DOCTOR NOTIFICATIONS
    // ================================================

    await notifyPatientAndDoctor(
      notificationAppointment,

      // Patient notification
      {
        title: "Appointment Booking Created",

        message:
          `Dear ${patientName}, your appointment ` +
          `with ${doctorName} on ${bookingDate} ` +
          `at ${bookingTime} has been created. ` +
          `Please complete payment to confirm your appointment.`,
      },

      // Doctor notification
      {
        title: "New Appointment Request",

        message:
          `A new appointment request from ${patientName} ` +
          `has been created for ${bookingDate} ` +
          `at ${bookingTime}. Payment is pending.`,
      },

      "appointment_booked",
      "booking_created",
    );

    // ================================================
    // ADMIN NOTIFICATION
    // ================================================

    await notifyAdmins(notificationAppointment, {
      type: "appointment_booked",

      title: "New Appointment Booking",

      message:
        `${patientName} booked an appointment ` +
        `with ${doctorName} on ${bookingDate} ` +
        `at ${bookingTime}. Payment is pending.`,

      sendEmail: false,

      eventAction: "booking_created",
    });

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return res.status(201).json({
      success: true,

      message:
        "Appointment created successfully. Please complete payment to confirm your appointment.",

      appointmentId: appointment._id,

      paymentRequired: true,

      payment: {
        status: appointment.paymentStatus,

        amount: appointment.totalAmount,
      },

      appointment,
    });
  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR:", error);

    // ================================================
    // DUPLICATE BOOKING PROTECTION
    // ================================================

    // MongoDB unique index:
    // unique_active_doctor_slot

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This appointment slot was just booked by another patient. Please select another time.",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Server error while creating appointment.",

      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   3. GET MY APPOINTMENTS

   GET /api/appointments/my-appointments

   FEATURES:
   - Patient authentication
   - Appointment status filter
   - Payment status filter
   - Pagination
   - Doctor details
====================================================== */

const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user?._id;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {
      patient: patientId,
    };

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    // ================================================
    // APPOINTMENT STATUS FILTER
    // ================================================

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status.",
        });
      }

      query.status = status;
    }

    // ================================================
    // PAYMENT STATUS FILTER
    // ================================================

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      query.paymentStatus = paymentStatus;
    }

    // ================================================
    // PAGINATION
    // ================================================

    const pagination = getPagination(page, limit);

    // ================================================
    // FETCH APPOINTMENTS
    // ================================================

    const [appointments, totalAppointments] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: "doctor",

          select: "speciality hospital consultationFee",

          populate: {
            path: "user",

            select: "name email phone image",
          },
        })
        .sort({
          appointmentDate: -1,
          createdAt: -1,
        })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      Appointment.countDocuments(query),
    ]);

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message: "Patient appointments retrieved successfully.",

      count: appointments.length,

      totalAppointments,

      pagination: getPaginationResponse(
        totalAppointments,
        pagination.currentPage,
        pagination.limit,
      ),

      appointments,
    });
  } catch (error) {
    console.error("GET MY APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Server error while fetching your appointments.",

      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   4. GET APPOINTMENT BY ID

   GET /api/appointments/:appointmentId

   SECURITY:
   - Patient: own appointment
   - Doctor: assigned appointment
   - Admin: authorized access
====================================================== */

const getAppointmentById = async (req, res) => {
  try {
    const userId = req.user?._id;

    const userRole = req.user?.role;

    const { appointmentId } = req.params;

    // ================================================
    // AUTHENTICATION
    // ================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // VALIDATE ID
    // ================================================

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    // ================================================
    // FIND APPOINTMENT
    // ================================================

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // ================================================
    // PATIENT OWNERSHIP
    // ================================================

    const isPatient = String(appointment.patient) === String(userId);

    // ================================================
    // DOCTOR OWNERSHIP
    // ================================================

    let isDoctor = false;

    if (!isPatient && userRole === "doctor") {
      const doctor = await Doctor.findOne({
        user: userId,
      }).select("_id");

      isDoctor =
        Boolean(doctor) && String(appointment.doctor) === String(doctor._id);
    }

    // ================================================
    // ADMIN ACCESS
    // ================================================

    const isAdmin = userRole === "admin";

    // ================================================
    // AUTHORIZATION
    // ================================================

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this appointment.",
      });
    }

    // ================================================
    // POPULATE
    // ================================================

    await populateAppointment(appointment);

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message: "Appointment retrieved successfully.",

      appointment,
    });
  } catch (error) {
    console.error("GET APPOINTMENT BY ID ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to load appointment details.",

      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   5. CANCEL APPOINTMENT

   PUT /api/appointments/:appointmentId/cancel

   FEATURES:
   - Patient ownership
   - Atomic cancellation
   - Release reserved slot
   - Preserve payment status
   - Patient + Doctor + Admin notifications

   IMPORTANT:
   Cancellation does not automatically refund.
====================================================== */

const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const { reason } = req.body || {};

    const userId = req.user?._id;

    // ================================================
    // AUTHENTICATION
    // ================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // VALIDATE ID
    // ================================================

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    // ================================================
    // VALIDATE REASON
    // ================================================

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required.",
      });
    }

    const cleanReason = reason.trim();

    if (cleanReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason cannot exceed 500 characters.",
      });
    }

    // ================================================
    // ATOMIC CANCELLATION
    // ================================================

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,

        patient: userId,

        status: {
          $in: ["pending", "confirmed"],
        },
      },

      {
        $set: {
          status: "cancelled",

          cancellationReason: cleanReason,

          cancelledAt: new Date(),

          // Release doctor slot.
          slotOccupied: false,
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

    // ================================================
    // FAILED CANCELLATION
    // ================================================

    if (!appointment) {
      const existing =
        await Appointment.findById(appointmentId).select("patient status");

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      if (String(existing.patient) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to cancel this appointment.",
        });
      }

      if (existing.status === "cancelled") {
        return res.status(409).json({
          success: false,
          message: "This appointment is already cancelled.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This appointment can no longer be cancelled.",
      });
    }

    // ================================================
    // PRESERVE PAYMENT STATUS
    // ================================================

    const wasPaid = appointment.paymentStatus === "paid";

    const paymentMessage = wasPaid
      ? "Payment remains paid. Any applicable refund must be processed separately."
      : "No payment refund has been processed.";

    // ================================================
    // SAVE DOCTOR PROFILE ID
    // ================================================

    const doctorProfileId = appointment.doctor;

    let doctorUserId = null;

    try {
      const doctorProfile =
        await Doctor.findById(doctorProfileId).select("user");

      doctorUserId = doctorProfile?.user || null;
    } catch (lookupError) {
      console.error("DOCTOR USER LOOKUP ERROR:", lookupError.message);
    }

    // ================================================
    // POPULATE APPOINTMENT
    // ================================================

    try {
      await populateAppointment(appointment);
    } catch (populateError) {
      console.error(
        "CANCEL APPOINTMENT POPULATE ERROR:",
        populateError.message,
      );
    }

    // ================================================
    // NOTIFICATION DETAILS
    // ================================================

    const patientName =
      [
        appointment.patientDetails?.firstName,

        appointment.patientDetails?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      appointment.patient?.name ||
      "Patient";

    const doctorName = appointment.doctor?.user?.name || "Doctor";

    const formattedDate = appointment.appointmentDate
      ? new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

    const formattedTime =
      [appointment.timeSlot?.startTime, appointment.timeSlot?.endTime]
        .filter(Boolean)
        .join(" - ") || "N/A";

    // ================================================
    // NOTIFICATION RECIPIENTS
    // ================================================

    const notificationAppointment = {
      _id: appointment._id,

      patient: userId,

      doctor: {
        user: doctorUserId,
      },
    };

    // ================================================
    // PATIENT + DOCTOR NOTIFICATIONS
    // ================================================

    void notifyPatientAndDoctor(
      notificationAppointment,

      {
        title: "Appointment Cancelled",

        message:
          `Dear ${patientName}, your appointment ` +
          `with ${doctorName} scheduled for ` +
          `${formattedDate} at ${formattedTime} ` +
          `has been cancelled. ` +
          `Reason: ${cleanReason}. ` +
          paymentMessage,
      },

      {
        title: "Patient Cancelled Appointment",

        message:
          `${patientName} cancelled the appointment ` +
          `scheduled for ${formattedDate} ` +
          `at ${formattedTime}. ` +
          `Reason: ${cleanReason}.`,
      },

      "appointment_cancelled",
      "patient_cancelled",
    ).catch((error) => {
      console.error("CANCELLATION NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // ADMIN NOTIFICATION
    // ================================================

    void notifyAdmins(notificationAppointment, {
      type: "appointment_cancelled",

      title: "Patient Cancelled Appointment",

      message:
        `${patientName} cancelled an appointment ` +
        `with ${doctorName} scheduled for ` +
        `${formattedDate} at ${formattedTime}. ` +
        `Reason: ${cleanReason}. ` +
        (wasPaid
          ? "Payment was completed. Refund review may be required."
          : "Payment was not completed."),

      sendEmail: false,

      eventAction: "patient_cancelled",
    }).catch((error) => {
      console.error("ADMIN CANCELLATION NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message: wasPaid
        ? "Appointment cancelled. Payment remains paid until an actual refund is processed."
        : "Appointment cancelled successfully.",

      appointment,

      displayStatus: "Cancelled",

      paymentDisplayStatus: wasPaid
        ? "Paid - Refund Not Processed"
        : appointment.paymentStatus,

      refundRequired: wasPaid,

      refundProcessed: appointment.paymentStatus === "refunded",
    });
  } catch (error) {
    console.error("CANCEL APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to cancel appointment.",

      ...getErrorResponse(error),
    });
  }
};

// ======================================================
// END OF SECTION 2/4
// DO NOT ADD module.exports YET.
// CONTINUE WITH SECTION 3 BELOW.
// ======================================================

/* ======================================================
   6. GET DOCTOR APPOINTMENTS

   GET /api/appointments/doctor/my-appointments

   FEATURES:
   - Doctor authentication
   - Doctor ownership
   - Appointment status filter
   - Doctor status filter
   - Payment status filter
   - Pagination
   - Patient and doctor details
====================================================== */

const getDoctorAppointments = async (req, res) => {
  try {
    // ================================================
    // 1. AUTHENTICATION
    // ================================================

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // 2. FIND LOGGED-IN DOCTOR
    // ================================================

    const doctor = await Doctor.findOne({
      user: userId,
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    // ================================================
    // 3. QUERY PARAMETERS
    // ================================================

    const {
      status,
      doctorStatus,
      paymentStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      doctor: doctor._id,
    };

    // ================================================
    // 4. ALLOWED FILTER VALUES
    // ================================================

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    const allowedDoctorStatuses = ["pending", "accepted", "rejected"];

    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    // ================================================
    // 5. APPOINTMENT STATUS FILTER
    // ================================================

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status.",
        });
      }

      query.status = status;
    }

    // ================================================
    // 6. DOCTOR STATUS FILTER
    // ================================================

    if (doctorStatus) {
      if (!allowedDoctorStatuses.includes(doctorStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor status.",
        });
      }

      query.doctorStatus = doctorStatus;
    }

    // ================================================
    // 7. PAYMENT STATUS FILTER
    // ================================================

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      query.paymentStatus = paymentStatus;
    }

    // ================================================
    // 8. PAGINATION
    // ================================================

    const pagination = getPagination(page, limit);

    // ================================================
    // 9. FETCH DOCTOR APPOINTMENTS
    // ================================================

    const [appointments, totalAppointments] = await Promise.all([
      Appointment.find(query)
        .populate("patient", "name email phone image")
        .populate({
          path: "doctor",
          select: "speciality hospital consultationFee",
          populate: {
            path: "user",
            select: "name email phone image",
          },
        })
        .sort({
          appointmentDate: 1,
          createdAt: -1,
        })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      Appointment.countDocuments(query),
    ]);

    // ================================================
    // 10. SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,
      message: "Doctor appointments retrieved successfully.",
      count: appointments.length,
      totalAppointments,
      pagination: getPaginationResponse(
        totalAppointments,
        pagination.currentPage,
        pagination.limit,
      ),
      appointments,
    });
  } catch (error) {
    console.error("GET DOCTOR APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching doctor appointments.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   7. DOCTOR ACCEPT APPOINTMENT

   PUT /api/appointments/:appointmentId/accept

   RULES:
   - Only assigned doctor
   - Payment must be paid
   - Appointment must be confirmed
   - Slot must still be occupied
   - Cannot accept cancelled/rejected bookings
   - Atomic update
   - Patient + Admin notifications
====================================================== */

const acceptAppointment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { appointmentId } = req.params;

    // ================================================
    // 1. AUTHENTICATION
    // ================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // 2. VALIDATE APPOINTMENT ID
    // ================================================

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    // ================================================
    // 3. FIND DOCTOR PROFILE
    // ================================================

    const doctor = await Doctor.findOne({
      user: userId,
    }).select("_id user");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    // ================================================
    // 4. FIND APPOINTMENT
    // ================================================

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // ================================================
    // 5. VERIFY DOCTOR OWNERSHIP
    // ================================================

    if (String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this appointment.",
      });
    }

    // ================================================
    // 6. CHECK APPOINTMENT STATUS
    // ================================================

    if (appointment.status === "cancelled") {
      return res.status(409).json({
        success: false,
        message: "Cancelled appointments cannot be accepted.",
      });
    }

    if (appointment.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "Completed appointments cannot be accepted.",
      });
    }

    if (appointment.status !== "confirmed") {
      return res.status(409).json({
        success: false,
        message: "Only confirmed appointments can be accepted.",
      });
    }

    // ================================================
    // 7. CHECK PAYMENT STATUS
    // ================================================

    if (appointment.paymentStatus !== "paid") {
      return res.status(409).json({
        success: false,
        message: "Appointment payment has not been completed.",
      });
    }

    // ================================================
    // 8. CHECK DOCTOR DECISION
    // ================================================

    if (appointment.doctorStatus === "accepted") {
      return res.status(409).json({
        success: false,
        message: "Appointment has already been accepted.",
      });
    }

    if (appointment.doctorStatus === "rejected") {
      return res.status(409).json({
        success: false,
        message: "Rejected appointment cannot be accepted.",
      });
    }

    // ================================================
    // 9. CHECK SLOT OCCUPANCY
    // ================================================

    if (appointment.slotOccupied !== true) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is no longer reserved.",
      });
    }

    // ================================================
    // 10. ATOMIC ACCEPTANCE
    // ================================================

    const updated = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctor: doctor._id,
        status: "confirmed",
        paymentStatus: "paid",
        doctorStatus: "pending",
        slotOccupied: true,
      },
      {
        $set: {
          doctorStatus: "accepted",
          acceptedAt: new Date(),
          rejectionReason: "",
          rejectedAt: null,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Appointment status changed. Please refresh.",
      });
    }

    // ================================================
    // 11. POPULATE WITHOUT REVERSING UPDATE
    // ================================================

    try {
      await populateAppointment(updated);
    } catch (populateError) {
      console.error("ACCEPT POPULATE ERROR:", populateError.message);
    }

    // ================================================
    // 12. NOTIFICATION DETAILS
    // ================================================

    const patientName =
      [updated.patientDetails?.firstName, updated.patientDetails?.lastName]
        .filter(Boolean)
        .join(" ") ||
      updated.patient?.name ||
      "Patient";

    const doctorName = updated.doctor?.user?.name || "Doctor";

    const formattedDate = updated.appointmentDate
      ? new Date(updated.appointmentDate).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

    const formattedTime =
      [updated.timeSlot?.startTime, updated.timeSlot?.endTime]
        .filter(Boolean)
        .join(" - ") || "N/A";

    // ================================================
    // 13. NOTIFICATION RECIPIENTS
    // ================================================

    const notificationAppointment = {
      _id: updated._id,
      patient: updated.patient?._id || updated.patient,
      doctor: {
        user: doctor.user,
      },
    };

    // ================================================
    // 14. PATIENT NOTIFICATION
    // ================================================

    void notifyPatientAndDoctor(
      notificationAppointment,
      {
        title: "Appointment Accepted",
        message:
          `Dear ${patientName}, your appointment ` +
          `with ${doctorName} on ${formattedDate} ` +
          `at ${formattedTime} has been accepted ` +
          `by your doctor.`,
      },
      null,
      "appointment_approved",
      "doctor_accepted",
    ).catch((error) => {
      console.error("ACCEPT NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // 15. ADMIN NOTIFICATION
    // ================================================

    void notifyAdmins(notificationAppointment, {
      type: "appointment_approved",
      title: "Doctor Accepted Appointment",
      message:
        `${doctorName} accepted the appointment ` +
        `for ${patientName} scheduled on ` +
        `${formattedDate} at ${formattedTime}.`,
      sendEmail: false,
      eventAction: "doctor_accepted",
    }).catch((error) => {
      console.error("ADMIN ACCEPT NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // 16. SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,
      message: "Appointment accepted successfully.",
      appointment: updated,
    });
  } catch (error) {
    console.error("ACCEPT APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to accept appointment.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   8. DOCTOR REJECT APPOINTMENT

   PUT /api/appointments/:appointmentId/reject

   RULES:
   - Only assigned doctor
   - Cannot reject accepted/completed/cancelled
   - Atomic rejection
   - Release reserved slot
   - Preserve payment status
   - Patient + Admin notifications

   IMPORTANT:
   Rejection does not automatically refund payment.
====================================================== */

const rejectAppointment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { appointmentId } = req.params;
    const { reason } = req.body || {};

    // ================================================
    // 1. AUTHENTICATION
    // ================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // 2. VALIDATE ID
    // ================================================

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    // ================================================
    // 3. VALIDATE REASON
    // ================================================

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const cleanReason = reason.trim();

    if (cleanReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason cannot exceed 500 characters.",
      });
    }

    // ================================================
    // 4. FIND DOCTOR
    // ================================================

    const doctor = await Doctor.findOne({
      user: userId,
    }).select("_id user");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    // ================================================
    // 5. FIND APPOINTMENT
    // ================================================

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // ================================================
    // 6. VERIFY OWNERSHIP
    // ================================================

    if (String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this appointment.",
      });
    }

    // ================================================
    // 7. VALIDATE STATUS
    // ================================================

    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(409).json({
        success: false,
        message: "Cancelled or completed appointments cannot be rejected.",
      });
    }

    if (appointment.doctorStatus === "accepted") {
      return res.status(409).json({
        success: false,
        message: "Accepted appointment cannot be rejected.",
      });
    }

    if (appointment.doctorStatus === "rejected") {
      return res.status(409).json({
        success: false,
        message: "Appointment has already been rejected.",
      });
    }

    // ================================================
    // 8. ATOMIC REJECTION + SLOT RELEASE
    // ================================================

    const updated = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctor: doctor._id,
        status: {
          $in: ["pending", "confirmed"],
        },
        doctorStatus: "pending",
        slotOccupied: true,
      },
      {
        $set: {
          doctorStatus: "rejected",
          rejectionReason: cleanReason,
          rejectedAt: new Date(),
          acceptedAt: null,
          slotOccupied: false,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message:
          "Appointment status changed or slot is no longer reserved. Please refresh.",
      });
    }

    // ================================================
    // 9. PAYMENT STATUS
    // ================================================

    const wasPaid = updated.paymentStatus === "paid";

    // Refund must be processed separately.

    // ================================================
    // 10. POPULATE
    // ================================================

    try {
      await populateAppointment(updated);
    } catch (populateError) {
      console.error("REJECT POPULATE ERROR:", populateError.message);
    }

    // ================================================
    // 11. NOTIFICATION DETAILS
    // ================================================

    const patientName =
      [updated.patientDetails?.firstName, updated.patientDetails?.lastName]
        .filter(Boolean)
        .join(" ") ||
      updated.patient?.name ||
      "Patient";

    const doctorName = updated.doctor?.user?.name || "Doctor";

    const formattedDate = updated.appointmentDate
      ? new Date(updated.appointmentDate).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

    const formattedTime =
      [updated.timeSlot?.startTime, updated.timeSlot?.endTime]
        .filter(Boolean)
        .join(" - ") || "N/A";

    // ================================================
    // 12. NOTIFICATION RECIPIENTS
    // ================================================

    const notificationAppointment = {
      _id: updated._id,
      patient: updated.patient?._id || updated.patient,
      doctor: {
        user: doctor.user,
      },
    };

    // ================================================
    // 13. PATIENT NOTIFICATION
    // ================================================

    void notifyPatientAndDoctor(
      notificationAppointment,
      {
        title: "Appointment Rejected",
        message:
          `Dear ${patientName}, your appointment ` +
          `with ${doctorName} scheduled for ` +
          `${formattedDate} at ${formattedTime} ` +
          `has been rejected. ` +
          `Reason: ${cleanReason}. ` +
          (wasPaid
            ? "Your payment remains recorded as paid. Any applicable refund must be processed separately."
            : "No completed payment is recorded for this appointment."),
      },
      null,
      "appointment_rejected",
      "doctor_rejected",
    ).catch((error) => {
      console.error("REJECT NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // 14. ADMIN NOTIFICATION
    // ================================================

    void notifyAdmins(notificationAppointment, {
      type: "appointment_rejected",
      title: "Doctor Rejected Appointment",
      message:
        `${doctorName} rejected the appointment ` +
        `for ${patientName} scheduled on ` +
        `${formattedDate} at ${formattedTime}. ` +
        `Reason: ${cleanReason}. ` +
        (wasPaid
          ? "Payment was completed. Refund review may be required."
          : "Payment was not completed."),
      sendEmail: false,
      eventAction: "doctor_rejected",
    }).catch((error) => {
      console.error("ADMIN REJECT NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // 15. SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,
      message: "Appointment rejected successfully.",
      appointment: updated,
      refundRequired: wasPaid,
      refundProcessed: updated.paymentStatus === "refunded",
    });
  } catch (error) {
    console.error("REJECT APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject appointment.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   9. PATIENT DASHBOARD STATS

   GET /api/appointments/patient/dashboard-stats

   RESPONSE STRUCTURE PRESERVED
====================================================== */

const getPatientDashboardStats = async (req, res) => {
  try {
    const patientId = req.user?._id;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({
        patient: patientId,
      }),

      Appointment.countDocuments({
        patient: patientId,
        status: "pending",
      }),

      Appointment.countDocuments({
        patient: patientId,
        status: "confirmed",
      }),

      Appointment.countDocuments({
        patient: patientId,
        status: "completed",
      }),

      Appointment.countDocuments({
        patient: patientId,
        status: "cancelled",
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Patient dashboard statistics retrieved successfully.",
      stats: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
      },
    });
  } catch (error) {
    console.error("GET PATIENT DASHBOARD STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching patient dashboard statistics.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   10. DOCTOR DASHBOARD STATS

   GET /api/appointments/doctor/dashboard-stats

   FEATURES:
   - Unique patients
   - Today's patients
   - Today's appointments
   - Pending doctor requests
   - Completed appointments
   - Recent patients

   TODAY = ASIA/COLOMBO CALENDAR DATE
====================================================== */

const getDoctorDashboardStats = async (req, res) => {
  try {
    // ================================================
    // 1. AUTHENTICATION
    // ================================================

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // 2. FIND DOCTOR
    // ================================================

    const doctor = await Doctor.findOne({
      user: userId,
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const doctorId = doctor._id;

    // ================================================
    // 3. COLOMBO TODAY
    // ================================================

    // Do not use new Date() directly for
    // the hospital's calendar date.

    const todayDateString = getColomboToday();

    const { startOfDay, endOfDay } = getDayRange(todayDateString);

    // ================================================
    // 4. VALID BOOKING FILTER
    // ================================================

    // A valid consultation booking:
    // - Payment completed
    // - Appointment confirmed or completed
    // - Doctor has not rejected it

    const validBookings = {
      doctor: doctorId,
      paymentStatus: "paid",
      status: {
        $in: ["confirmed", "completed"],
      },
      doctorStatus: {
        $ne: "rejected",
      },
    };

    // ================================================
    // 5. TODAY'S BOOKING FILTER
    // ================================================

    // endOfDay is EXCLUSIVE.

    const todayBookings = {
      ...validBookings,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    };

    // ================================================
    // 6. FETCH DASHBOARD DATA
    // ================================================

    const [
      allPatientIds,
      todayPatientIds,
      appointmentsToday,
      pendingRequests,
      completedAppointments,
      recentAppointments,
    ] = await Promise.all([
      // Unique patients with valid bookings.
      Appointment.distinct("patient", validBookings),

      // Unique patients today.
      Appointment.distinct("patient", todayBookings),

      // Valid appointments today.
      Appointment.countDocuments(todayBookings),

      // Pending doctor decisions.
      Appointment.countDocuments({
        doctor: doctorId,
        paymentStatus: "paid",
        status: "confirmed",
        doctorStatus: "pending",
        slotOccupied: true,
      }),

      // Completed consultations.
      Appointment.countDocuments({
        doctor: doctorId,
        status: "completed",
      }),

      // Recent valid appointments.
      Appointment.find(validBookings)
        .sort({
          appointmentDate: -1,
          createdAt: -1,
        })
        .limit(10)
        .populate("patient", "name firstName lastName email phone image")
        .lean(),
    ]);

    // ================================================
    // 7. FORMAT RECENT PATIENTS
    // ================================================

    const recentPatients = recentAppointments.map((appointment) => ({
      appointmentId: appointment._id,

      patientId: appointment.patient?._id || null,

      name:
        [appointment.patient?.firstName, appointment.patient?.lastName]
          .filter(Boolean)
          .join(" ") ||
        appointment.patient?.name ||
        [
          appointment.patientDetails?.firstName,
          appointment.patientDetails?.lastName,
        ]
          .filter(Boolean)
          .join(" ") ||
        "Unknown Patient",

      image: appointment.patient?.image || "",

      appointmentDate: appointment.appointmentDate,

      timeSlot: appointment.timeSlot,

      status: appointment.status,

      doctorStatus: appointment.doctorStatus,
    }));

    // ================================================
    // 8. SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,
      stats: {
        totalPatients: allPatientIds.length,

        patientsToday: todayPatientIds.length,

        appointmentsToday,

        pendingRequests,

        completedAppointments,
      },
      recentPatients,
    });
  } catch (error) {
    console.error("DOCTOR DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load doctor dashboard.",
      ...getErrorResponse(error),
    });
  }
};

// ======================================================
// END OF SECTION 3/4
// DO NOT ADD module.exports HERE.
// SECTION 4 CONTINUES BELOW.
// ======================================================

/* ======================================================
   11. DOCTOR - GET MY PATIENTS

   GET /api/appointments/doctor/my-patients
====================================================== */

const getDoctorMyPatients = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const doctor = await Doctor.findOne({
      user: userId,
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      paymentStatus: "paid",
      patient: { $ne: null },
    })
      .select(
        "patient patientDetails appointmentDate " +
          "timeSlot status doctorStatus createdAt",
      )
      .populate(
        "patient",
        "name firstName lastName image " +
          "dateOfBirth bloodGroup address gender isActive",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      })
      .lean();

    // Group all paid appointments by patient.
    // Keep original totalAppointments semantics.
    const patientMap = new Map();

    for (const appointment of appointments) {
      const patient = appointment.patient;

      if (!patient?._id) continue;

      const patientId = String(patient._id);

      const validBooking =
        ["confirmed", "completed"].includes(appointment.status) &&
        appointment.doctorStatus !== "rejected";

      if (!patientMap.has(patientId)) {
        const fullName =
          [patient.firstName, patient.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          patient.name ||
          [
            appointment.patientDetails?.firstName,
            appointment.patientDetails?.lastName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          "Unknown Patient";

        patientMap.set(patientId, {
          patientId,
          name: fullName,
          image: patient.image || "",
          dateOfBirth: patient.dateOfBirth || null,
          bloodGroup: patient.bloodGroup || null,
          address: patient.address || null,
          gender: patient.gender || null,
          status: "inactive",
          lastAppointment: null,
          lastBooking: null,
          totalAppointments: 0,
          hasValidBooking: false,
        });
      }

      const item = patientMap.get(patientId);

      item.totalAppointments += 1;

      if (validBooking) {
        item.hasValidBooking = true;
      }

      // Appointments are sorted newest first.
      if (!item.lastAppointment) {
        item.lastAppointment = {
          appointmentId: appointment._id,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.timeSlot?.startTime || "",
          endTime: appointment.timeSlot?.endTime || "",
          status: appointment.status,
          doctorStatus: appointment.doctorStatus,
        };
      }

      if (
        appointment.createdAt &&
        (!item.lastBooking ||
          new Date(appointment.createdAt) > new Date(item.lastBooking))
      ) {
        item.lastBooking = appointment.createdAt;
      }
    }

    // Today's date in Asia/Colombo.
    const todayString = getColomboToday();

    const [currentYear, currentMonth, currentDay] = todayString
      .split("-")
      .map(Number);

    const patients = Array.from(patientMap.values()).map((patient) => {
      let age = null;

      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth);

        if (!Number.isNaN(dob.getTime())) {
          // Treat dateOfBirth as a calendar date
          // stored at UTC midnight.
          const birthYear = dob.getUTCFullYear();
          const birthMonth = dob.getUTCMonth() + 1;
          const birthDay = dob.getUTCDate();

          const birthDateString =
            `${birthYear}-` +
            `${String(birthMonth).padStart(2, "0")}-` +
            `${String(birthDay).padStart(2, "0")}`;

          if (birthDateString <= todayString) {
            age = currentYear - birthYear;

            const birthdayNotReached =
              currentMonth < birthMonth ||
              (currentMonth === birthMonth && currentDay < birthDay);

            if (birthdayNotReached) {
              age -= 1;
            }
          }
        }
      }

      const { hasValidBooking, dateOfBirth, ...rest } = patient;

      return {
        ...rest,
        age,
        status: hasValidBooking ? "active" : "inactive",
      };
    });

    const activePatients = patients.filter(
      (patient) => patient.status === "active",
    ).length;

    const inactivePatients = patients.length - activePatients;

    return res.status(200).json({
      success: true,
      message: "Doctor patients retrieved successfully.",
      stats: {
        totalPatients: patients.length,
        activePatients,
        inactivePatients,
      },
      patients,
    });
  } catch (error) {
    console.error("GET DOCTOR MY PATIENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load doctor patients.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   12. ADMIN - GET ALL APPOINTMENTS

   GET /api/appointments/admin/all

   FEATURES:
   - Admin authorization
   - Search by patient snapshot
   - Status filters
   - Pagination
====================================================== */

const getAdminAppointments = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const {
      search = "",
      status,
      doctorStatus,
      paymentStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    const allowedDoctorStatuses = ["pending", "accepted", "rejected"];

    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    // Appointment status filter.
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status.",
        });
      }

      query.status = status;
    }

    // Doctor decision filter.
    if (doctorStatus) {
      if (!allowedDoctorStatuses.includes(doctorStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor status.",
        });
      }

      query.doctorStatus = doctorStatus;
    }

    // Payment status filter.
    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      query.paymentStatus = paymentStatus;
    }

    // Search patient details saved at booking.
    const cleanSearch = typeof search === "string" ? search.trim() : "";

    if (cleanSearch) {
      if (cleanSearch.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Search term cannot exceed 100 characters.",
        });
      }

      // Escape regular-expression characters.
      const escapedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(escapedSearch, "i");

      query.$or = [
        {
          "patientDetails.firstName": searchRegex,
        },
        {
          "patientDetails.lastName": searchRegex,
        },
        {
          "patientDetails.email": searchRegex,
        },
        {
          "patientDetails.phone": searchRegex,
        },
      ];
    }

    const pagination = getPagination(page, limit);

    const [appointments, totalAppointments] = await Promise.all([
      Appointment.find(query)
        .populate("patient", "name email phone image gender")
        .populate({
          path: "doctor",
          select: "user speciality hospital consultationFee",
          populate: {
            path: "user",
            select: "name email phone image",
          },
        })
        .sort({
          createdAt: -1,
        })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      Appointment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin appointments retrieved successfully.",
      count: appointments.length,
      totalAppointments,
      pagination: getPaginationResponse(
        totalAppointments,
        pagination.currentPage,
        pagination.limit,
      ),
      appointments,
    });
  } catch (error) {
    console.error("GET ADMIN APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin appointments.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   13. ADMIN - CANCEL APPOINTMENT

   PUT /api/appointments/admin/:appointmentId/cancel

   FEATURES:
   - Admin authorization
   - Atomic cancellation
   - Release slotOccupied
   - Preserve payment status
   - Patient notification
   - Doctor notification
   - Admin notification

   IMPORTANT:
   Cancellation does not automatically refund.
====================================================== */

const cancelAdminAppointment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { appointmentId } = req.params;
    const { reason } = req.body || {};

    // ================================================
    // AUTHENTICATION
    // ================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ================================================
    // ADMIN AUTHORIZATION
    // ================================================

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    // ================================================
    // VALIDATE APPOINTMENT ID
    // ================================================

    if (!isValidId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    // ================================================
    // VALIDATE CANCELLATION REASON
    // ================================================

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required.",
      });
    }

    const cleanReason = reason.trim();

    if (cleanReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason cannot exceed 500 characters.",
      });
    }

    // ================================================
    // ATOMIC CANCELLATION + SLOT RELEASE
    // ================================================

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        status: {
          $in: ["pending", "confirmed"],
        },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: cleanReason,
          cancelledAt: new Date(),

          // Release this reserved slot.
          slotOccupied: false,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // ================================================
    // HANDLE FAILED CANCELLATION
    // ================================================

    if (!appointment) {
      const existing =
        await Appointment.findById(appointmentId).select("status");

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          existing.status === "cancelled"
            ? "Appointment is already cancelled."
            : "This appointment cannot be cancelled.",
      });
    }

    // ================================================
    // PAYMENT STATUS
    // ================================================

    // Never change paymentStatus to refunded
    // unless the payment provider confirms it.
    const wasPaid = appointment.paymentStatus === "paid";

    // Save original IDs before populate.
    const patientUserId = appointment.patient;
    const doctorProfileId = appointment.doctor;

    // ================================================
    // RESOLVE DOCTOR USER ID
    // ================================================

    let doctorUserId = null;

    try {
      const doctorProfile =
        await Doctor.findById(doctorProfileId).select("user");

      doctorUserId = doctorProfile?.user || null;
    } catch (lookupError) {
      console.error("ADMIN CANCEL DOCTOR LOOKUP ERROR:", lookupError.message);
    }

    // ================================================
    // POPULATE
    // ================================================

    // The cancellation has already succeeded.
    // Do not return 500 if population fails.

    try {
      await populateAppointment(appointment);
    } catch (populateError) {
      console.error("ADMIN CANCEL POPULATE ERROR:", populateError.message);
    }

    // ================================================
    // NOTIFICATION DETAILS
    // ================================================

    const patientName =
      [
        appointment.patientDetails?.firstName,
        appointment.patientDetails?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      appointment.patient?.name ||
      "Patient";

    const doctorName = appointment.doctor?.user?.name || "Doctor";

    // appointmentDate uses the UTC-midnight
    // calendar convention from Appointment.js.
    const formattedDate = appointment.appointmentDate
      ? new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

    const formattedTime =
      [appointment.timeSlot?.startTime, appointment.timeSlot?.endTime]
        .filter(Boolean)
        .join(" - ") || "N/A";

    const refundMessage = wasPaid
      ? "Your payment remains recorded as paid. Any applicable refund must be processed separately."
      : "No payment refund has been processed.";

    // ================================================
    // NOTIFICATION RECIPIENTS
    // ================================================

    const notificationAppointment = {
      _id: appointment._id,
      patient: patientUserId,
      doctor: {
        user: doctorUserId,
      },
    };

    // ================================================
    // PATIENT + DOCTOR NOTIFICATIONS
    // ================================================

    void notifyPatientAndDoctor(
      notificationAppointment,

      // Patient notification.
      {
        title: "Appointment Cancelled by Administration",
        message:
          `Dear ${patientName}, your appointment ` +
          `with ${doctorName} on ${formattedDate} ` +
          `at ${formattedTime} has been cancelled ` +
          `by the hospital administration. ` +
          `Reason: ${cleanReason}. ` +
          refundMessage,
      },

      // Doctor notification.
      {
        title: "Appointment Cancelled by Admin",
        message:
          `The hospital administration cancelled ` +
          `the appointment for ${patientName} ` +
          `on ${formattedDate} at ${formattedTime}. ` +
          `Reason: ${cleanReason}.`,
      },

      "appointment_cancelled",
      "admin_cancelled",
    ).catch((error) => {
      console.error("ADMIN CANCEL NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // ADMIN NOTIFICATIONS
    // ================================================

    void notifyAdmins(notificationAppointment, {
      type: "appointment_cancelled",
      title: "Appointment Cancelled by Admin",
      message:
        `An administrator cancelled the ` +
        `appointment for ${patientName} ` +
        `with ${doctorName} on ` +
        `${formattedDate} at ${formattedTime}. ` +
        `Reason: ${cleanReason}. ` +
        (wasPaid
          ? "Payment was completed. Refund review may be required."
          : "Payment was not completed."),
      sendEmail: false,
      eventAction: "admin_cancelled",
    }).catch((error) => {
      console.error("ADMIN SELF NOTIFICATION ERROR:", error.message);
    });

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return res.status(200).json({
      success: true,

      message: wasPaid
        ? "Appointment cancelled by admin. Any applicable refund must be processed separately."
        : "Appointment cancelled successfully by admin.",

      appointment,
      paymentStatus: appointment.paymentStatus,
      refundRequired: wasPaid,
      refundProcessed: appointment.paymentStatus === "refunded",
    });
  } catch (error) {
    console.error("ADMIN CANCEL APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel appointment.",
      ...getErrorResponse(error),
    });
  }
};

/* ======================================================
   EXPORT ALL 13 CONTROLLERS
====================================================== */

module.exports = {
  // Patient appointment management
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,

  // Doctor appointment management
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,

  // Dashboard statistics
  getPatientDashboardStats,
  getDoctorDashboardStats,

  // Doctor patient management
  getDoctorMyPatients,

  // Admin appointment management
  getAdminAppointments,
  cancelAdminAppointment,
};

// ======================================================
// END OF appointmentController.js
// ======================================================
