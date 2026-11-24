const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");

const User = require("../models/User");

// ============================================
// CONSTANTS
// ============================================

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s()-]+$/;

const GENDERS = ["", "Male", "Female", "Other"];
const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

// ============================================
// GENERAL HELPERS
// ============================================

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const sanitizePatient = (patient) => {
  const data = patient.toObject ? patient.toObject() : { ...patient };

  delete data.password;
  delete data.__v;

  return data;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// ============================================
// DATE OF BIRTH VALIDATION
// ============================================

const parseDateOfBirth = (value) => {
  if (value === null || value === "") {
    return { valid: true, date: null };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false, date: null };
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value > today
  ) {
    return { valid: false, date: null };
  }

  return { valid: true, date };
};

// ============================================
// ADDRESS VALIDATION
// ============================================

const parseAddress = (value) => {
  const empty = {
    addressLine: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  };

  if (value === null || value === "") {
    return { valid: true, address: empty };
  }

  let address = value;

  if (typeof value === "string") {
    if (value.trim().startsWith("{")) {
      try {
        address = JSON.parse(value);
      } catch {
        return { valid: false };
      }
    } else {
      address = { addressLine: value };
    }
  }

  if (!isPlainObject(address)) {
    return { valid: false };
  }

  const result = { ...empty };

  for (const key of Object.keys(empty)) {
    if (address[key] !== undefined && typeof address[key] !== "string") {
      return { valid: false };
    }

    result[key] = address[key]?.trim() || "";
  }

  return { valid: true, address: result };
};

// ============================================
// BOOLEAN VALIDATION
// ============================================

const parseBoolean = (value) => {
  if (value === true || value === "true") {
    return { valid: true, value: true };
  }

  if (value === false || value === "false") {
    return { valid: true, value: false };
  }

  return { valid: false };
};

// ============================================
// IMAGE VALIDATION
// ============================================

const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (buffer.subarray(0, 8).equals(png)) {
    return "image/png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

const validateImage = async (file) => {
  if (!file) {
    return { valid: true, imageUrl: "" };
  }

  if (!file.path || !file.filename) {
    return { valid: false, message: "Invalid image." };
  }

  if (!file.size || file.size > MAX_IMAGE_SIZE || !IMAGE_TYPES[file.mimetype]) {
    return {
      valid: false,
      message: "Only JPG, PNG or WebP up to 5MB allowed.",
    };
  }

  const handle = await fs.open(file.path, "r");
  let header = Buffer.alloc(12);

  try {
    const { bytesRead } = await handle.read(header, 0, 12, 0);
    header = header.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }

  const detected = detectImageType(header);
  const extension = path.extname(file.filename).toLowerCase();

  if (
    detected !== file.mimetype ||
    !IMAGE_TYPES[detected]?.includes(extension)
  ) {
    return {
      valid: false,
      message: "Invalid image content or extension.",
    };
  }

  return {
    valid: true,
    imageUrl: `/uploads/profiles/${path.basename(file.filename)}`,
  };
};

const deleteUploadedFile = async (file) => {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("IMAGE CLEANUP ERROR:", error);
    }
  }
};

const deleteStoredImage = async (imageUrl) => {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/profiles/")
  ) {
    return;
  }

  const filename = path.basename(imageUrl);
  const filePath = path.join(process.cwd(), "uploads", "profiles", filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("STORED IMAGE CLEANUP:", error);
    }
  }
};

// ============================================
// GET ALL PATIENTS
// GET /api/admin/patients
// ============================================

const getAdminPatients = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const search = String(req.query.search || "")
      .trim()
      .slice(0, 100);

    const status = String(req.query.status || "all");

    const filter = { role: "patient" };

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status !== "all") {
      return sendError(res, 400, "Invalid status.");
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [patients, totalPatients] = await Promise.all([
      User.find(filter)
        .select("-password -__v")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalPatients / limit));

    return res.status(200).json({
      success: true,
      message: "Patients fetched successfully.",
      patients,
      totalPatients,
      pagination: {
        currentPage: page,
        totalPages,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET PATIENTS ERROR:", error);
    return sendError(res, 500, "Unable to fetch patients.");
  }
};

// ============================================
// GET SINGLE PATIENT
// GET /api/admin/patients/:patientId
// ============================================

const getAdminPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.isValidObjectId(patientId)) {
      return sendError(res, 400, "Invalid patient ID.");
    }

    const patient = await User.findOne({
      _id: patientId,
      role: "patient",
    })
      .select("-password -__v")
      .lean();

    if (!patient) {
      return sendError(res, 404, "Patient not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Patient fetched successfully.",
      patient,
    });
  } catch (error) {
    console.error("GET PATIENT ERROR:", error);
    return sendError(res, 500, "Unable to fetch patient.");
  }
};

// ============================================
// CREATE PATIENT
// POST /api/admin/patients
// ============================================

const createAdminPatient = async (req, res) => {
  let created = false;

  const fail = async (status, message) => {
    await deleteUploadedFile(req.file);
    return sendError(res, status, message);
  };

  try {
    const {
      name,
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      isActive,
    } = req.body || {};

    // Required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return await fail(400, "Name, email, phone and password are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return await fail(400, "Invalid email.");
    }

    if (!PASSWORD_REGEX.test(password)) {
      return await fail(
        400,
        "Password requires 8 characters, uppercase, lowercase and number.",
      );
    }

    const normalizedPhone = phone.trim();

    if (
      normalizedPhone.length < 7 ||
      normalizedPhone.length > 20 ||
      !PHONE_REGEX.test(normalizedPhone)
    ) {
      return await fail(400, "Invalid phone number.");
    }

    // Gender validation
    if (gender !== undefined && !GENDERS.includes(gender)) {
      return await fail(400, "Gender must be Male, Female or Other.");
    }

    // Blood group validation
    if (bloodGroup !== undefined && !BLOOD_GROUPS.includes(bloodGroup)) {
      return await fail(400, "Invalid blood group.");
    }

    // DOB validation
    const dob = parseDateOfBirth(dateOfBirth ?? null);

    if (!dob.valid) {
      return await fail(400, "DOB must be a valid YYYY-MM-DD date.");
    }

    if (firstName !== undefined && typeof firstName !== "string") {
      return await fail(400, "Invalid first name.");
    }

    if (lastName !== undefined && typeof lastName !== "string") {
      return await fail(400, "Invalid last name.");
    }

    const parsedAddress = parseAddress(address ?? null);

    if (!parsedAddress.valid) {
      return await fail(400, "Invalid address.");
    }

    const parsedStatus =
      isActive === undefined
        ? { valid: true, value: true }
        : parseBoolean(isActive);

    if (!parsedStatus.valid) {
      return await fail(400, "Invalid account status.");
    }

    const imageValidation = await validateImage(req.file);

    if (!imageValidation.valid) {
      return await fail(400, imageValidation.message);
    }

    const exists = await User.exists({
      email: normalizedEmail,
    });

    if (exists) {
      return await fail(409, "Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const patient = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "patient",
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      dateOfBirth: dob.date,
      gender: gender || "",
      bloodGroup: bloodGroup || "",
      address: parsedAddress.address,
      image: imageValidation.imageUrl,
      isActive: parsedStatus.value,
    });

    created = true;

    return res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      patient: sanitizePatient(patient),
    });
  } catch (error) {
    console.error("CREATE PATIENT ERROR:", error);

    if (!created) {
      await deleteUploadedFile(req.file);
    }

    if (error.code === 11000) {
      return sendError(res, 409, "Email already registered.");
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, "Invalid patient information.");
    }

    return sendError(res, 500, "Unable to create patient.");
  }
};

// ============================================
// UPDATE PATIENT
// PUT /api/admin/patients/:patientId
// ============================================

const updateAdminPatient = async (req, res) => {
  let saved = false;

  const fail = async (status, message) => {
    await deleteUploadedFile(req.file);
    return sendError(res, status, message);
  };

  try {
    const { patientId } = req.params;

    if (!mongoose.isValidObjectId(patientId)) {
      return await fail(400, "Invalid patient ID.");
    }

    const body = req.body || {};

    const allowedFields = [
      "name",
      "email",
      "phone",
      "password",
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "address",
      "isActive",
    ];

    for (const key of Object.keys(body)) {
      if (!allowedFields.includes(key)) {
        return await fail(400, `Unknown field: ${key}`);
      }
    }

    if (!Object.keys(body).length && !req.file) {
      return await fail(400, "No changes provided.");
    }

    const patient = await User.findOne({
      _id: patientId,
      role: "patient",
    });

    if (!patient) {
      return await fail(404, "Patient not found.");
    }

    const {
      name,
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      isActive,
    } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return await fail(400, "Invalid name.");
      }
      patient.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return await fail(400, "Invalid email.");
      }

      const normalizedEmail = email.trim().toLowerCase();

      const exists = await User.exists({
        email: normalizedEmail,
        _id: { $ne: patientId },
      });

      if (exists) {
        return await fail(409, "Email already registered.");
      }

      patient.email = normalizedEmail;
    }

    if (phone !== undefined) {
      if (
        typeof phone !== "string" ||
        phone.trim().length < 7 ||
        phone.trim().length > 20 ||
        !PHONE_REGEX.test(phone.trim())
      ) {
        return await fail(400, "Invalid phone.");
      }

      patient.phone = phone.trim();
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
        return await fail(400, "Invalid password.");
      }

      patient.password = await bcrypt.hash(password, 12);
    }

    if (firstName !== undefined) {
      if (typeof firstName !== "string") {
        return await fail(400, "Invalid first name.");
      }
      patient.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string") {
        return await fail(400, "Invalid last name.");
      }
      patient.lastName = lastName.trim();
    }

    if (dateOfBirth !== undefined) {
      const dob = parseDateOfBirth(dateOfBirth);

      if (!dob.valid) {
        return await fail(400, "Invalid date of birth.");
      }

      patient.dateOfBirth = dob.date;
    }

    // Update gender
    if (gender !== undefined) {
      if (!GENDERS.includes(gender)) {
        return await fail(400, "Gender must be Male, Female or Other.");
      }

      patient.gender = gender;
    }

    if (bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(bloodGroup)) {
        return await fail(400, "Invalid blood group.");
      }

      patient.bloodGroup = bloodGroup;
    }

    if (address !== undefined) {
      const parsed = parseAddress(address);

      if (!parsed.valid) {
        return await fail(400, "Invalid address.");
      }

      patient.address = parsed.address;
    }

    if (isActive !== undefined) {
      const parsed = parseBoolean(isActive);

      if (!parsed.valid) {
        return await fail(400, "Invalid account status.");
      }

      patient.isActive = parsed.value;
    }

    const oldImage = patient.image;

    if (req.file) {
      const imageValidation = await validateImage(req.file);

      if (!imageValidation.valid) {
        return await fail(400, imageValidation.message);
      }

      patient.image = imageValidation.imageUrl;
    }

    await patient.save();
    saved = true;

    if (req.file && oldImage) {
      await deleteStoredImage(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      patient: sanitizePatient(patient),
    });
  } catch (error) {
    console.error("UPDATE PATIENT ERROR:", error);

    if (!saved) {
      await deleteUploadedFile(req.file);
    }

    if (error.code === 11000) {
      return sendError(res, 409, "Email already registered.");
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, "Invalid patient information.");
    }

    return sendError(res, 500, "Unable to update patient.");
  }
};

// ============================================
// DELETE PATIENT
// DELETE /api/admin/patients/:patientId
// ============================================

const deleteAdminPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.isValidObjectId(patientId)) {
      return sendError(res, 400, "Invalid patient ID.");
    }

    const patient = await User.findOneAndDelete({
      _id: patientId,
      role: "patient",
    });

    if (!patient) {
      return sendError(res, 404, "Patient not found.");
    }

    await deleteStoredImage(patient.image);

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully.",
      deletedPatientId: patient._id,
    });
  } catch (error) {
    console.error("DELETE PATIENT ERROR:", error);
    return sendError(res, 500, "Unable to delete patient.");
  }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
  getAdminPatients,
  getAdminPatientById,
  createAdminPatient,
  updateAdminPatient,
  deleteAdminPatient,
};
