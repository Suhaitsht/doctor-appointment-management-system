"use strict";

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const {
  generateSlots,
  isThirtyMinuteSlot,
  slotsOverlap,
} = require("../utils/appointmentSlots");

/* ======================================================
   01. CONSTANTS
====================================================== */

const USER_PUBLIC_FIELDS =
  "name firstName lastName email phone image role isActive";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DOCTOR_UPLOAD_DIR = path.resolve(__dirname, "../uploads/doctors");

/* ======================================================
   02. ERROR HELPERS
====================================================== */

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const handleError = (res, error, action) => {
  console.error(`DOCTOR ${action} ERROR:`, error);

  if (error.statusCode) {
    return sendError(res, error.statusCode, error.message);
  }

  if (error.code === 11000) {
    return sendError(res, 409, "Email or unique value already exists");
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return sendError(res, 400, error.message);
  }

  return sendError(res, 500, `Server error while ${action}`);
};

/* ======================================================
   03. INPUT VALIDATION
====================================================== */

const requiredText = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    badRequest(`${field} is required`);
  }

  return value.trim();
};

const optionalText = (value, field) => {
  if (typeof value !== "string") {
    badRequest(`${field} must be text`);
  }

  return value.trim();
};

const normalizeEmail = (value) => {
  const email = requiredText(value, "Email").toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    badRequest("Invalid email address");
  }

  return email;
};

const validatePassword = (password) => {
  if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
    badRequest(
      "Password must contain at least 8 characters, " +
        "one uppercase letter, one lowercase letter, " +
        "and one number",
    );
  }

  return password;
};

const parseNumber = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    badRequest(`${field} must be a non-negative number`);
  }

  return number;
};

const parseDate = (value, field) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    badRequest(`Invalid ${field}`);
  }

  return date;
};

const parseBoolean = (value) => {
  if (value === true || value === "true" || value === 1) {
    return true;
  }

  if (value === false || value === "false" || value === 0) {
    return false;
  }

  badRequest("Boolean value must be true or false");
};

/* ======================================================
   04. ARRAY / OBJECT PARSERS
====================================================== */

const parseArrayField = (value, field) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON handled below.
    }
  }

  badRequest(`${field} must be a valid array`);
};

const parseObjectField = (value) => {
  if (value === undefined) {
    return {};
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON handled below.
    }
  }

  badRequest("Profile must be a valid object");
};

/* ======================================================
   05. SUBDOCUMENT HELPERS
====================================================== */

const normalizeSubdocumentId = (item) => {
  if (!item._id) {
    return {};
  }

  if (!mongoose.isValidObjectId(item._id)) {
    badRequest("Invalid subdocument ID");
  }

  return {
    _id: item._id,
  };
};

const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate && endDate < startDate) {
    badRequest("End date cannot be before start date");
  }
};

/* ======================================================
   06. NORMALIZE LANGUAGES
====================================================== */

const normalizeLanguages = (value) => {
  const languages = parseArrayField(value, "Languages");

  if (!languages.every((item) => typeof item === "string")) {
    badRequest("Languages must contain strings");
  }

  const unique = new Map();

  for (const item of languages) {
    const language = item.trim();

    if (language) {
      unique.set(language.toLowerCase(), language);
    }
  }

  return [...unique.values()];
};

/* ======================================================
   07. NORMALIZE MEMBERSHIPS
====================================================== */

const normalizeMemberships = (value) => {
  const memberships = parseArrayField(value, "Memberships");

  return memberships
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        badRequest("Invalid membership");
      }

      return {
        ...normalizeSubdocumentId(item),

        title: optionalText(item.title ?? "", "Membership title"),

        description: optionalText(
          item.description ?? "",
          "Membership description",
        ),
      };
    })
    .filter((item) => item.title || item.description);
};

/* ======================================================
   08. NORMALIZE EXPERIENCES
====================================================== */

const normalizeExperiences = (value) => {
  const experiences = parseArrayField(value, "Experiences");

  return experiences.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      badRequest("Invalid experience");
    }

    const startDate = parseDate(item.startDate, "start date");

    const endDate = parseDate(item.endDate, "end date");

    validateDateRange(startDate, endDate);

    return {
      ...normalizeSubdocumentId(item),

      hospital: optionalText(item.hospital ?? "", "Hospital"),

      yearsOfExperience: parseNumber(
        item.yearsOfExperience ?? item.years,
        "Years of experience",
      ),

      jobDescription: optionalText(
        item.jobDescription ?? item.description ?? "",
        "Job description",
      ),

      startDate,
      endDate,
    };
  });
};

/* ======================================================
   09. NORMALIZE EDUCATION
====================================================== */

const normalizeEducation = (value) => {
  const education = parseArrayField(value, "Education");

  return education.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      badRequest("Invalid education");
    }

    const startDate = parseDate(item.startDate, "start date");

    const endDate = parseDate(item.endDate, "end date");

    validateDateRange(startDate, endDate);

    return {
      ...normalizeSubdocumentId(item),

      institutionName: optionalText(
        item.institutionName ?? item.institution ?? "",
        "Institution",
      ),

      course: optionalText(item.course ?? "", "Course"),

      startDate,
      endDate,

      numberOfYears: parseNumber(
        item.numberOfYears ?? item.years,
        "Number of years",
      ),

      description: optionalText(item.description ?? "", "Description"),

      logo: optionalText(item.logo ?? "", "Logo"),
    };
  });
};

/* ======================================================
   10. IMAGE HELPERS
====================================================== */

const getUploadedImagePath = (file) => {
  if (!file) return "";

  return `/uploads/doctors/${file.filename}`;
};

const removeUploadedImage = async (imagePath) => {
  if (
    typeof imagePath !== "string" ||
    !imagePath.startsWith("/uploads/doctors/")
  ) {
    return;
  }

  const filename = path.basename(imagePath);

  const fullPath = path.join(DOCTOR_UPLOAD_DIR, filename);

  try {
    await fs.promises.unlink(fullPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("DOCTOR IMAGE CLEANUP:", error);
    }
  }
};

/* ======================================================
   11. EMAIL AVAILABILITY
====================================================== */

const checkEmailAvailability = async (email, excludeId) => {
  const filter = { email };

  if (excludeId) {
    filter._id = {
      $ne: excludeId,
    };
  }

  const exists = await User.exists(filter);

  if (exists) {
    badRequest("Email already in use");
  }
};

/* ======================================================
   12. DOCTOR AUTHORIZATION
====================================================== */

const ensureDoctor = (req, res) => {
  if (!req.user?._id) {
    sendError(res, 401, "Please login first");

    return false;
  }

  if (req.user.role !== "doctor") {
    sendError(res, 403, "Doctor access only");

    return false;
  }

  if (req.user.isActive === false) {
    sendError(res, 403, "Doctor account is inactive");

    return false;
  }

  return true;
};

/* ======================================================
   13. DOCTOR PROFILE RESPONSE
====================================================== */

const getNameParts = (user) => {
  const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: user.firstName || parts[0] || "",

    lastName: user.lastName || parts.slice(1).join(" "),
  };
};

const buildProfileResponse = (doctor) => {
  const user = doctor.user;

  return {
    ...getNameParts(user),

    displayName: doctor.displayName || user.name || "",

    designation: doctor.designation || "",

    phone: user.phone || "",
    email: user.email || "",
    image: user.image || "",

    languages: doctor.languages || [],

    memberships: doctor.memberships || [],

    experiences: doctor.experiences || [],

    education: doctor.education || [],

    speciality: doctor.speciality,

    hospital: doctor.hospital,

    consultationFee: doctor.consultationFee,

    isAvailable: doctor.isAvailable ?? false,
  };
};

/* ======================================================
   14. CREATE DOCTOR - ADMIN
   POST /api/doctors
====================================================== */

const createDoctor = async (req, res) => {
  let createdUser = null;
  let createdDoctor = null;

  const uploadedImage = getUploadedImagePath(req.file);

  try {
    const body = req.body || {};

    const name = requiredText(body.name, "Name");

    const email = normalizeEmail(body.email);

    const phone = requiredText(body.phone, "Phone");

    const speciality = requiredText(body.speciality, "Speciality");

    validatePassword(body.password);

    await checkEmailAvailability(email);

    const doctorData = {
      speciality,

      hospital:
        body.hospital === undefined
          ? ""
          : optionalText(body.hospital, "Hospital"),

      consultationFee: parseNumber(body.consultationFee, "Consultation fee"),

      memberSince: body.memberSince
        ? parseDate(body.memberSince, "Member since")
        : new Date(),

      displayName:
        body.displayName === undefined
          ? ""
          : optionalText(body.displayName, "Display name"),

      designation:
        body.designation === undefined
          ? ""
          : optionalText(body.designation, "Designation"),

      languages:
        body.languages === undefined ? [] : normalizeLanguages(body.languages),

      memberships:
        body.memberships === undefined
          ? []
          : normalizeMemberships(body.memberships),

      experiences:
        body.experiences === undefined
          ? []
          : normalizeExperiences(body.experiences),

      education:
        body.education === undefined ? [] : normalizeEducation(body.education),

      isAvailable: false,
    };

    const hashedPassword = await bcrypt.hash(body.password, 10);

    createdUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "doctor",
      image: uploadedImage,
      isActive: true,
    });

    createdDoctor = await Doctor.create({
      ...doctorData,
      user: createdUser._id,
    });

    const populatedDoctor = await Doctor.findById(createdDoctor._id).populate(
      "user",
      USER_PUBLIC_FIELDS,
    );

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor: populatedDoctor,
    });
  } catch (error) {
    // Compensating rollback if doctor creation fails.
    if (createdUser?._id && !createdDoctor?._id) {
      try {
        await User.findByIdAndDelete(createdUser._id);
      } catch (rollbackError) {
        console.error("DOCTOR CREATE ROLLBACK:", rollbackError);
      }
    }

    await removeUploadedImage(uploadedImage);

    return handleError(res, error, "creating doctor");
  }
};

/* ======================================================
   15. GET ALL DOCTORS - ADMIN
   GET /api/doctors
====================================================== */

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("user", USER_PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    return handleError(res, error, "fetching doctors");
  }
};

/* ======================================================
   16. GET SINGLE DOCTOR - ADMIN
   GET /api/doctors/:id
====================================================== */

const GetSingleDoctor = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, "Invalid doctor ID");
    }

    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      USER_PUBLIC_FIELDS,
    );

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    return handleError(res, error, "fetching doctor");
  }
};

/* ======================================================
   17. UPDATE DOCTOR - ADMIN
   PUT /api/doctors/:id
====================================================== */

const updateDoctor = async (req, res) => {
  const uploadedImage = getUploadedImagePath(req.file);

  let imageSaved = false;
  let previousImage = "";

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      badRequest("Invalid doctor ID");
    }

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      const error = new Error("Doctor not found");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(doctor.user);

    if (!user) {
      const error = new Error("Doctor user not found");
      error.statusCode = 404;
      throw error;
    }

    const body = req.body || {};

    previousImage = user.image || "";

    /* ----------------------------------------------
       USER NAME
    ---------------------------------------------- */

    if (body.name !== undefined) {
      const name = requiredText(body.name, "Name");

      const parts = name.split(/\s+/);

      user.name = name;
      user.firstName = parts[0] || "";
      user.lastName = parts.slice(1).join(" ");
    }

    /* ----------------------------------------------
       USER EMAIL
    ---------------------------------------------- */

    if (body.email !== undefined) {
      const email = normalizeEmail(body.email);

      await checkEmailAvailability(email, user._id);

      user.email = email;
    }

    /* ----------------------------------------------
       USER PHONE
    ---------------------------------------------- */

    if (body.phone !== undefined) {
      user.phone = requiredText(body.phone, "Phone");
    }

    /* ----------------------------------------------
       ACCOUNT STATUS
    ---------------------------------------------- */

    if (body.status !== undefined) {
      user.isActive = parseBoolean(body.status);
    }

    /* ----------------------------------------------
       PASSWORD
    ---------------------------------------------- */

    if (body.password !== undefined) {
      validatePassword(body.password);

      user.password = await bcrypt.hash(body.password, 10);
    }

    /* ----------------------------------------------
       PROFILE IMAGE
    ---------------------------------------------- */

    if (req.file) {
      user.image = uploadedImage;
    }

    /* ----------------------------------------------
       DOCTOR SPECIALITY
    ---------------------------------------------- */

    if (body.speciality !== undefined) {
      doctor.speciality = requiredText(body.speciality, "Speciality");
    }

    /* ----------------------------------------------
       HOSPITAL
    ---------------------------------------------- */

    if (body.hospital !== undefined) {
      doctor.hospital = optionalText(body.hospital, "Hospital");
    }

    /* ----------------------------------------------
       CONSULTATION FEE
    ---------------------------------------------- */

    if (body.consultationFee !== undefined) {
      doctor.consultationFee = parseNumber(
        body.consultationFee,
        "Consultation fee",
      );
    }

    /* ----------------------------------------------
       MEMBER SINCE
    ---------------------------------------------- */

    if (body.memberSince !== undefined && body.memberSince !== "") {
      doctor.memberSince = parseDate(body.memberSince, "Member since");
    }

    /* ----------------------------------------------
       DISPLAY NAME
    ---------------------------------------------- */

    if (body.displayName !== undefined) {
      doctor.displayName = optionalText(body.displayName, "Display name");
    }

    /* ----------------------------------------------
       DESIGNATION
    ---------------------------------------------- */

    if (body.designation !== undefined) {
      doctor.designation = optionalText(body.designation, "Designation");
    }

    /* ----------------------------------------------
       LANGUAGES
    ---------------------------------------------- */

    if (body.languages !== undefined) {
      doctor.languages = normalizeLanguages(body.languages);
    }

    /* ----------------------------------------------
       MEMBERSHIPS
    ---------------------------------------------- */

    if (body.memberships !== undefined) {
      doctor.memberships = normalizeMemberships(body.memberships);
    }

    /* ----------------------------------------------
       EXPERIENCES
    ---------------------------------------------- */

    if (body.experiences !== undefined) {
      doctor.experiences = normalizeExperiences(body.experiences);
    }

    /* ----------------------------------------------
       EDUCATION
    ---------------------------------------------- */

    if (body.education !== undefined) {
      doctor.education = normalizeEducation(body.education);
    }

    /* ----------------------------------------------
       VALIDATION
    ---------------------------------------------- */

    await user.validate();
    await doctor.validate();

    /* ----------------------------------------------
       SAVE
    ---------------------------------------------- */

    await user.save();
    imageSaved = true;

    await doctor.save();

    /* ----------------------------------------------
       CLEANUP PREVIOUS IMAGE
    ---------------------------------------------- */

    if (req.file && previousImage && previousImage !== uploadedImage) {
      await removeUploadedImage(previousImage);
    }

    const updatedDoctor = await Doctor.findById(doctor._id).populate(
      "user",
      USER_PUBLIC_FIELDS,
    );

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    // Delete the new upload only if it was not
    // successfully referenced by the saved user.
    if (!imageSaved) {
      await removeUploadedImage(uploadedImage);
    }

    return handleError(res, error, "updating doctor");
  }
};

/* ======================================================
   18. DELETE DOCTOR - ADMIN
   DELETE /api/doctors/:id

   SOFT DELETE:
   Preserves existing appointment references.
====================================================== */

const deleteDoctor = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, "Invalid doctor ID");
    }

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const user = await User.findById(doctor.user);

    if (!user) {
      return sendError(res, 404, "Doctor user not found");
    }

    /* ----------------------------------------------
       DEACTIVATE ACCOUNT
    ---------------------------------------------- */

    user.isActive = false;

    /* ----------------------------------------------
       DISABLE DOCTOR AVAILABILITY
    ---------------------------------------------- */

    doctor.isAvailable = false;

    await user.save();
    await doctor.save();

    return res.status(200).json({
      success: true,
      message:
        "Doctor deactivated successfully. " +
        "Existing medical records are preserved.",
    });
  } catch (error) {
    return handleError(res, error, "deactivating doctor");
  }
};

/* ======================================================
   19. UPDATE DOCTOR ACCOUNT STATUS - ADMIN
   PATCH /api/doctors/:id/status
====================================================== */

const updateDoctorStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, "Invalid doctor ID");
    }

    const { status } = req.body || {};

    if (status === undefined) {
      return sendError(res, 400, "Status is required");
    }

    const isActive = parseBoolean(status);

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    const user = await User.findById(doctor.user);

    if (!user) {
      return sendError(res, 404, "Doctor user not found");
    }

    user.isActive = isActive;

    // Deactivated doctors cannot remain available.
    if (!isActive) {
      doctor.isAvailable = false;
    }

    await user.validate();
    await doctor.validate();

    await user.save();
    await doctor.save();

    const updatedDoctor = await Doctor.findById(doctor._id).populate(
      "user",
      USER_PUBLIC_FIELDS,
    );

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Doctor activated successfully"
        : "Doctor deactivated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    return handleError(res, error, "updating doctor status");
  }
};

/* ======================================================
   20. GET MY WEEKLY AVAILABILITY
   GET /api/doctors/availability
   ACCESS: DOCTOR ONLY
====================================================== */

const getMyAvailability = async (req, res) => {
  try {
    // Verify authenticated doctor.
    if (!ensureDoctor(req, res)) {
      return;
    }

    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).select("availability");

    if (!doctor) {
      return sendError(res, 404, "Doctor profile not found");
    }

    return res.status(200).json({
      success: true,

      // Preserved for existing frontend compatibility.
      status: true,

      availability: doctor.availability || [],
    });
  } catch (error) {
    return handleError(res, error, "fetching availability");
  }
};

/* ======================================================
   21. UPDATE MY WEEKLY AVAILABILITY
   PUT /api/doctors/availability
   ACCESS: DOCTOR ONLY
====================================================== */

const updateAvailability = async (req, res) => {
  try {
    // 1. Doctor authorization
    if (!ensureDoctor(req, res)) {
      return;
    }

    const availability = req.body?.availability;

    if (!Array.isArray(availability) || availability.length > 7) {
      return sendError(
        res,
        400,
        "Availability must be an array of up to 7 days",
      );
    }

    const validDays = new Set([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);

    const usedDays = new Set();
    const generatedAvailability = [];

    // 2. Validate and generate each day's slots
    for (const item of availability) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !validDays.has(item.day)
      ) {
        return sendError(res, 400, "Invalid availability day");
      }

      if (usedDays.has(item.day)) {
        return sendError(res, 400, `${item.day} appears more than once`);
      }

      usedDays.add(item.day);

      if (!Array.isArray(item.slots) || item.slots.length > 20) {
        return sendError(res, 400, `Invalid working hours for ${item.day}`);
      }

      let daySlots = [];

      // 3. Convert working ranges into 30-minute slots
      for (const range of item.slots) {
        if (
          !range ||
          typeof range.startTime !== "string" ||
          typeof range.endTime !== "string"
        ) {
          return sendError(res, 400, `Invalid time range on ${item.day}`);
        }

        let slots;

        try {
          slots = generateSlots(range.startTime, range.endTime);
        } catch (error) {
          return sendError(res, 400, `${item.day}: ${error.message}`);
        }

        daySlots.push(...slots);
      }

      // 4. Sort generated slots
      daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      // 5. Reject overlapping working ranges
      for (let i = 1; i < daySlots.length; i++) {
        if (slotsOverlap(daySlots[i - 1], daySlots[i])) {
          return sendError(
            res,
            400,
            `Overlapping working hours on ${item.day}`,
          );
        }
      }

      // 6. Ensure all generated slots are 30 minutes
      if (
        daySlots.some(
          (slot) => !isThirtyMinuteSlot(slot.startTime, slot.endTime),
        )
      ) {
        return sendError(res, 400, `Invalid 30-minute slots on ${item.day}`);
      }

      generatedAvailability.push({
        day: item.day,
        slots: daySlots,
      });
    }

    // 7. Find logged-in doctor
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return sendError(res, 404, "Doctor profile not found");
    }

    // 8. Protect existing future reservations
    const today = Appointment.colomboTodayDateOnly();

    const futureBookings = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: {
        $gte: Appointment.dateOnlyToUTC(today),
      },
      slotOccupied: true,
    })
      .select("appointmentDate timeSlot")
      .lean();

    for (const booking of futureBookings) {
      const date = Appointment.dateUTCToDateOnly(booking.appointmentDate);

      const day = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }).format(booking.appointmentDate);

      const schedule = generatedAvailability.find((item) => item.day === day);

      // Existing booking must remain covered by the
      // new schedule. A legacy 3-hour booking must be
      // reviewed/rescheduled before this update.
      const bookingStart = booking.timeSlot?.startTime;
      const bookingEnd = booking.timeSlot?.endTime;

      const matchingSlot = schedule?.slots.some(
        (slot) =>
          slot.startTime === bookingStart && slot.endTime === bookingEnd,
      );

      if (!matchingSlot) {
        return sendError(
          res,
          409,
          `Schedule cannot be changed. An existing booking on ${date} (${bookingStart}–${bookingEnd}) would be affected.`,
        );
      }
    }

    // 9. Save generated 30-minute slots
    doctor.availability = generatedAvailability;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor availability updated with 30-minute slots",
      availability: doctor.availability,
    });
  } catch (error) {
    return handleError(res, error, "updating availability");
  }
};

/* ======================================================
   22. ESCAPE REGEX HELPER
====================================================== */

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* ======================================================
   23. GET PUBLIC DOCTORS
   GET /api/doctors/public
   ACCESS: PUBLIC
====================================================== */

const getPublicDoctors = async (req, res) => {
  try {
    const { search, speciality } = req.query || {};

    const filter = {};

    // ==========================================
    // SPECIALITY FILTER
    // ==========================================

    if (typeof speciality === "string" && speciality.trim()) {
      filter.speciality = {
        $regex: escapeRegex(speciality.trim()),
        $options: "i",
      };
    }

    // ==========================================
    // ACTIVE DOCTOR USER FILTER
    // ==========================================

    const userMatch = {
      isActive: true,
      role: "doctor",
    };

    // ==========================================
    // DOCTOR NAME SEARCH
    // ==========================================

    if (typeof search === "string" && search.trim()) {
      userMatch.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    // ==========================================
    // FETCH DOCTORS
    // ==========================================

    const doctors = await Doctor.find(filter)
      .populate({
        path: "user",
        select: USER_PUBLIC_FIELDS,
        match: userMatch,
      })
      .sort({ createdAt: -1 })
      .lean();

    // ==========================================
    // REMOVE INACTIVE / UNMATCHED USERS
    // ==========================================

    const activeDoctors = doctors.filter((doctor) => doctor.user !== null);

    // ==========================================
    // COUNT UNIQUE COMPLETED PATIENTS
    // ==========================================

    const doctorIds = activeDoctors.map((doctor) => doctor._id);

    let patientStats = [];

    if (doctorIds.length > 0) {
      patientStats = await Appointment.aggregate([
        {
          $match: {
            doctor: { $in: doctorIds },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              doctor: "$doctor",
              patient: "$patient",
            },
          },
        },
        {
          $group: {
            _id: "$_id.doctor",
            patientCount: { $sum: 1 },
          },
        },
      ]);
    }

    // ==========================================
    // CREATE PATIENT COUNT LOOKUP
    // ==========================================

    const patientCountMap = new Map(
      patientStats.map((item) => [String(item._id), item.patientCount]),
    );

    // ==========================================
    // ADD PATIENT COUNT TO DOCTOR DATA
    // ==========================================

    const doctorsWithStats = activeDoctors.map((doctor) => ({
      ...doctor,

      patientCount: patientCountMap.get(String(doctor._id)) ?? 0,
    }));

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      count: doctorsWithStats.length,
      doctors: doctorsWithStats,
    });
  } catch (error) {
    return handleError(res, error, "fetching public doctors");
  }
};

/* ======================================================
   24. GET PUBLIC DOCTOR BY ID
   GET /api/doctors/public/:id
   ACCESS: PUBLIC
====================================================== */

const getPublicDoctorById = async (req, res) => {
  try {
    /* ----------------------------------------------
       VALIDATE DOCTOR ID
    ---------------------------------------------- */

    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 400, "Invalid doctor ID");
    }

    /* ----------------------------------------------
       FETCH ACTIVE DOCTOR
    ---------------------------------------------- */

    const doctor = await Doctor.findById(req.params.id).populate({
      path: "user",
      select: USER_PUBLIC_FIELDS,
      match: {
        isActive: true,
        role: "doctor",
      },
    });

    if (!doctor || !doctor.user) {
      return sendError(res, 404, "Doctor not available");
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    return handleError(res, error, "fetching public doctor");
  }
};

/* ======================================================
   25. GET MY DOCTOR PROFILE
   GET /api/doctors/me/profile
   ACCESS: DOCTOR ONLY
====================================================== */

const getMyDoctorProfile = async (req, res) => {
  try {
    if (!ensureDoctor(req, res)) {
      return;
    }

    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).populate("user", USER_PUBLIC_FIELDS);

    if (!doctor || !doctor.user) {
      return sendError(res, 404, "Doctor profile not found");
    }

    return res.status(200).json({
      success: true,
      doctor,
      profile: buildProfileResponse(doctor),
    });
  } catch (error) {
    return handleError(res, error, "fetching doctor profile");
  }
};

/* ======================================================
   26. UPDATE MY DOCTOR PROFILE
   PUT /api/doctors/me/profile
   ACCESS: DOCTOR ONLY
====================================================== */

const updateMyDoctorProfile = async (req, res) => {
  const uploadedImage = getUploadedImagePath(req.file);

  let imageSaved = false;
  let previousImage = "";

  try {
    if (!ensureDoctor(req, res)) {
      await removeUploadedImage(uploadedImage);
      return;
    }

    /* ----------------------------------------------
       FIND DOCTOR PROFILE
    ---------------------------------------------- */

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      const error = new Error("Doctor profile not found");
      error.statusCode = 404;
      throw error;
    }

    /* ----------------------------------------------
       FIND USER ACCOUNT
    ---------------------------------------------- */

    const user = await User.findById(req.user._id);

    if (!user) {
      const error = new Error("Doctor user not found");
      error.statusCode = 404;
      throw error;
    }

    previousImage = user.image || "";

    const body = req.body || {};

    /* ----------------------------------------------
       SUPPORT JSON AND MULTIPART PROFILE DATA
    ---------------------------------------------- */

    const nestedProfile = parseObjectField(body.profile);

    const data = {
      ...nestedProfile,
      ...body,
    };

    delete data.profile;

    /* ----------------------------------------------
       FIRST NAME + LAST NAME
    ---------------------------------------------- */

    if (data.firstName !== undefined || data.lastName !== undefined) {
      const previous = getNameParts(user);

      const firstName =
        data.firstName === undefined
          ? previous.firstName
          : optionalText(data.firstName, "First name");

      const lastName =
        data.lastName === undefined
          ? previous.lastName
          : optionalText(data.lastName, "Last name");

      if (!firstName) {
        badRequest("First name cannot be empty");
      }

      user.firstName = firstName;
      user.lastName = lastName;

      user.name = [firstName, lastName].filter(Boolean).join(" ");
    }

    /* ----------------------------------------------
       PHONE
    ---------------------------------------------- */

    if (data.phone !== undefined) {
      user.phone = requiredText(data.phone, "Phone");
    }

    /* ----------------------------------------------
       EMAIL
    ---------------------------------------------- */

    if (data.email !== undefined) {
      const email = normalizeEmail(data.email);

      await checkEmailAvailability(email, user._id);

      user.email = email;
    }

    /* ----------------------------------------------
       DISPLAY NAME
    ---------------------------------------------- */

    if (data.displayName !== undefined) {
      doctor.displayName = optionalText(data.displayName, "Display name");
    }

    /* ----------------------------------------------
       DESIGNATION
    ---------------------------------------------- */

    if (data.designation !== undefined) {
      doctor.designation = optionalText(data.designation, "Designation");
    }

    /* ----------------------------------------------
       LANGUAGES
    ---------------------------------------------- */

    if (data.languages !== undefined) {
      doctor.languages = normalizeLanguages(data.languages);
    }

    /* ----------------------------------------------
       MEMBERSHIPS
    ---------------------------------------------- */

    if (data.memberships !== undefined) {
      doctor.memberships = normalizeMemberships(data.memberships);
    }

    /* ----------------------------------------------
       EXPERIENCES
    ---------------------------------------------- */

    if (data.experiences !== undefined) {
      doctor.experiences = normalizeExperiences(data.experiences);
    }

    /* ----------------------------------------------
       EDUCATION
    ---------------------------------------------- */

    if (data.education !== undefined) {
      doctor.education = normalizeEducation(data.education);
    }

    /* ----------------------------------------------
       PROFILE IMAGE
    ---------------------------------------------- */

    const removeImage =
      data.removeImage === undefined ? false : parseBoolean(data.removeImage);

    if (req.file && removeImage) {
      badRequest("Cannot upload and remove an image in the same request");
    }

    if (req.file) {
      user.image = uploadedImage;
    } else if (removeImage) {
      user.image = "";
    }

    /* ----------------------------------------------
       VALIDATE USER AND DOCTOR
    ---------------------------------------------- */

    await user.validate();
    await doctor.validate();

    /* ----------------------------------------------
       SAVE USER AND DOCTOR
    ---------------------------------------------- */

    await user.save();
    imageSaved = true;

    await doctor.save();

    /* ----------------------------------------------
       REMOVE OLD IMAGE AFTER SUCCESS
    ---------------------------------------------- */

    if (
      (req.file || removeImage) &&
      previousImage &&
      previousImage !== user.image
    ) {
      await removeUploadedImage(previousImage);
    }

    /* ----------------------------------------------
       FETCH UPDATED PROFILE
    ---------------------------------------------- */

    const updatedDoctor = await Doctor.findById(doctor._id).populate(
      "user",
      USER_PUBLIC_FIELDS,
    );

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor,
      profile: buildProfileResponse(updatedDoctor),
    });
  } catch (error) {
    /*
      Only remove the newly uploaded image
      when it was not saved as User.image.
    */

    if (!imageSaved) {
      await removeUploadedImage(uploadedImage);
    }

    return handleError(res, error, "updating doctor profile");
  }
};

/* ======================================================
   27. UPDATE DOCTOR AVAILABLE STATUS
   PATCH /api/doctors/me/availability-status
   ACCESS: DOCTOR ONLY
====================================================== */

const updateDoctorAvailabilityStatus = async (req, res) => {
  try {
    if (!ensureDoctor(req, res)) {
      return;
    }

    const { isAvailable } = req.body || {};

    /* ----------------------------------------------
       VALIDATE BOOLEAN
    ---------------------------------------------- */

    if (typeof isAvailable !== "boolean") {
      return sendError(res, 400, "isAvailable must be true or false");
    }

    /* ----------------------------------------------
       UPDATE LOGGED-IN DOCTOR ONLY
    ---------------------------------------------- */

    const doctor = await Doctor.findOneAndUpdate(
      {
        user: req.user._id,
      },
      {
        $set: {
          isAvailable,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("user", USER_PUBLIC_FIELDS);

    if (!doctor || !doctor.user) {
      return sendError(res, 404, "Doctor profile not found");
    }

    /* ----------------------------------------------
       SUCCESS RESPONSE
    ---------------------------------------------- */

    return res.status(200).json({
      success: true,

      message: isAvailable
        ? "Doctor is now available"
        : "Doctor is now unavailable",

      isAvailable: doctor.isAvailable,

      doctor,

      profile: buildProfileResponse(doctor),
    });
  } catch (error) {
    return handleError(res, error, "updating availability status");
  }
};

/* ======================================================
   28. EXPORT ALL DOCTOR CONTROLLERS
====================================================== */

module.exports = {
  /* ----------------------------------------------
     ADMIN DOCTOR MANAGEMENT
  ---------------------------------------------- */

  createDoctor,
  getAllDoctors,
  GetSingleDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,

  /* ----------------------------------------------
     DOCTOR WEEKLY AVAILABILITY
  ---------------------------------------------- */

  getMyAvailability,
  updateAvailability,

  /* ----------------------------------------------
     PUBLIC DOCTOR ROUTES
  ---------------------------------------------- */

  getPublicDoctors,
  getPublicDoctorById,

  /* ----------------------------------------------
     DOCTOR PROFILE SETTINGS
  ---------------------------------------------- */

  getMyDoctorProfile,
  updateMyDoctorProfile,

  /* ----------------------------------------------
     DOCTOR AVAILABLE STATUS
  ---------------------------------------------- */

  updateDoctorAvailabilityStatus,
};
