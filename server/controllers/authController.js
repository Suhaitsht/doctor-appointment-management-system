"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ======================================================
// SHARED HELPERS
// ======================================================

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidPassword = (password) =>
  typeof password === "string" && PASSWORD_REGEX.test(password);

const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email);

const normalizeEmail = (email) => email.trim().toLowerCase();

const isActiveAccount = (user) => user.isActive !== false;

const passwordError =
  "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number";

// ======================================================
// GENERATE JWT TOKEN
// ======================================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: String(user._id),
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "2d",
    },
  );
};

// ======================================================
// SAFE USER RESPONSE
// ======================================================

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  email: user.email,
  phone: user.phone,
  role: user.role,
  image: user.image || "",
  dateOfBirth: user.dateOfBirth || null,
  gender: user.gender || "",
  bloodGroup: user.bloodGroup || "",
  address: user.address || {},
  isActive: user.isActive !== false,
});

// ======================================================
// 1. REGISTER PATIENT
// POST /api/auth/register
// ======================================================

const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nameParts = cleanName.split(/\s+/);

    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    const user = await User.create({
      name: cleanName,
      firstName,
      lastName,
      phone: cleanPhone,
      email: normalizedEmail,
      password: hashedPassword,
      role: "patient",
      isActive: true,
      tokenVersion: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
};

// ======================================================
// 2. LOGIN USER
// POST /api/auth/login
// ======================================================

const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Explicitly select hidden security fields.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +tokenVersion");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!isActiveAccount(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Re-read current token version before signing.
    // This reduces the window for issuing a stale JWT.
    const currentUser = await User.findById(user._id).select("+tokenVersion");

    if (!currentUser || !isActiveAccount(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Account is unavailable",
      });
    }

    const token = generateToken(currentUser);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: formatUser(currentUser),
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

// ======================================================
// 3. GET CURRENT USER PROFILE
// GET /api/auth/profile
// Protected route
// ======================================================

const getProfile = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!isActiveAccount(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
        code: "ACCOUNT_INACTIVE",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// ======================================================
// HELPER: GET TODAY IN SRI LANKA
// ======================================================

const getColomboToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return [values.year, values.month, values.day].join("-");
};

// ======================================================
// HELPER: VALIDATE DATE OF BIRTH
// ======================================================

const parseDateOfBirth = (value) => {
  if (value === null || value === "") {
    return {
      valid: true,
      date: null,
    };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return {
      valid: false,
      message: "Date of birth must use YYYY-MM-DD format",
    };
  }

  const [year, month, day] = value.split("-").map(Number);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return {
      valid: false,
      message: "Invalid date of birth",
    };
  }

  if (value > getColomboToday()) {
    return {
      valid: false,
      message: "Date of birth cannot be in the future",
    };
  }

  return {
    valid: true,
    date: parsedDate,
  };
};

// ======================================================
// HELPER: VALIDATE PROFILE TEXT
// ======================================================

const cleanProfileText = (value, fieldName, maxLength = 150) => {
  if (typeof value !== "string") {
    return {
      valid: false,
      message: `${fieldName} must be a string`,
    };
  }

  const cleaned = value.trim();

  if (cleaned.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  return {
    valid: true,
    value: cleaned,
  };
};

// ======================================================
// 4. UPDATE CURRENT USER PROFILE
// PUT /api/auth/profile
// Protected route
// ======================================================

const updateProfile = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!isActiveAccount(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const { firstName, lastName, phone, dateOfBirth, bloodGroup, address } =
      req.body || {};

    // FIRST NAME
    if (firstName !== undefined) {
      const result = cleanProfileText(firstName, "First name", 100);

      if (!result.valid || !result.value) {
        return res.status(400).json({
          success: false,
          message: result.message || "First name is required",
        });
      }

      user.firstName = result.value;
    }

    // LAST NAME
    if (lastName !== undefined) {
      const result = cleanProfileText(lastName, "Last name", 100);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      user.lastName = result.value;
    }

    // SYNCHRONIZE FULL NAME
    if (firstName !== undefined || lastName !== undefined) {
      const fullName = [user.firstName || "", user.lastName || ""]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty",
        });
      }

      user.name = fullName;
    }

    // PHONE
    if (phone !== undefined) {
      const result = cleanProfileText(phone, "Phone number", 30);

      if (!result.valid || !result.value) {
        return res.status(400).json({
          success: false,
          message: result.message || "Phone number is required",
        });
      }

      user.phone = result.value;
    }

    // DATE OF BIRTH
    if (dateOfBirth !== undefined) {
      const result = parseDateOfBirth(dateOfBirth);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      user.dateOfBirth = result.date;
    }

    // BLOOD GROUP
    if (bloodGroup !== undefined) {
      const allowedBloodGroups = [
        "",
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];

      if (
        typeof bloodGroup !== "string" ||
        !allowedBloodGroups.includes(bloodGroup.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid blood group",
        });
      }

      user.bloodGroup = bloodGroup.trim();
    }

    // ADDRESS
    if (address !== undefined) {
      if (
        address === null ||
        typeof address !== "object" ||
        Array.isArray(address)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid address",
        });
      }

      const allowedFields = [
        "addressLine",
        "city",
        "state",
        "country",
        "pincode",
      ];

      const currentAddress = user.address?.toObject?.() || user.address || {};

      const updatedAddress = {
        ...currentAddress,
      };

      for (const field of allowedFields) {
        if (address[field] !== undefined) {
          const result = cleanProfileText(address[field], field, 200);

          if (!result.valid) {
            return res.status(400).json({
              success: false,
              message: result.message,
            });
          }

          updatedAddress[field] = result.value;
        }
      }

      user.address = updatedAddress;
    }

    await user.save();

    const updatedUser = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// ======================================================
// 5. CHANGE PASSWORD
// PUT /api/auth/change-password
// Protected route
// ======================================================

const changePassword = async (req, res) => {
  try {
    // 1. AUTHENTICATION
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // 2. REQUEST DATA
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string" ||
      !newPassword ||
      typeof confirmPassword !== "string" ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirm password are required",
      });
    }

    // 3. CONFIRM NEW PASSWORD
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // 4. PASSWORD STRENGTH
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // 5. FETCH USER WITH PASSWORD
    const user = await User.findById(req.user._id).select(
      "+password +tokenVersion",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!isActiveAccount(user)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
        code: "ACCOUNT_INACTIVE",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "Password authentication is unavailable",
      });
    }

    // 6. VERIFY CURRENT PASSWORD
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 7. PREVENT PASSWORD REUSE
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // 8. HASH NEW PASSWORD
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 9. ATOMIC PASSWORD UPDATE
    //
    // Match the password hash originally verified.
    // If another request already changed it, this
    // update will not succeed.
    //
    // $inc atomically increases tokenVersion.
    // Old JWTs will be rejected by authMiddleware.

    const result = await User.updateOne(
      {
        _id: user._id,
        password: user.password,
        isActive: { $ne: false },
      },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
        $inc: {
          tokenVersion: 1,
        },
      },
    );

    // 10. CHECK UPDATE RESULT
    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        success: false,
        message:
          "Password was changed by another request. Please log in again.",
        code: "PASSWORD_CHANGE_CONFLICT",
      });
    }

    // 11. SUCCESS
    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

// ======================================================
// HELPER: DELETE UPLOADED FILE SAFELY
// ======================================================

const deleteUploadedFile = async (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("FILE DELETE ERROR:", error.message);
    }
  }
};

// ======================================================
// HELPER: RESOLVE PROFILE IMAGE PATH
// ======================================================

const resolveProfileImagePath = (imageUrl) => {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/profiles/")
  ) {
    return null;
  }

  const filename = imageUrl.slice("/uploads/profiles/".length);

  if (
    !filename ||
    filename === "." ||
    filename === ".." ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    return null;
  }

  const profilesDirectory = path.resolve(__dirname, "../uploads/profiles");

  return path.join(profilesDirectory, filename);
};

// ======================================================
// 6. UPDATE PROFILE IMAGE
// PUT /api/auth/profile/image
// Protected route
// multipart/form-data field: image
// ======================================================

const updateProfileImage = async (req, res) => {
  let databaseSaved = false;

  try {
    if (!req.user?._id) {
      await deleteUploadedFile(req.file?.path);

      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile image",
      });
    }

    if (!req.file.filename || !req.file.path) {
      await deleteUploadedFile(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Invalid uploaded image",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      await deleteUploadedFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!isActiveAccount(user)) {
      await deleteUploadedFile(req.file.path);

      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const oldImage = user.image || "";

    const newImagePath = `/uploads/profiles/${req.file.filename}`;

    user.image = newImagePath;

    await user.save();

    databaseSaved = true;

    if (oldImage && oldImage !== newImagePath) {
      const oldImagePath = resolveProfileImagePath(oldImage);

      if (oldImagePath) {
        await deleteUploadedFile(oldImagePath);
      }
    }

    const updatedUser = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE IMAGE ERROR:", error);

    if (!databaseSaved) {
      await deleteUploadedFile(req.file?.path);
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile image",
    });
  }
};

// ======================================================
// 7. DEACTIVATE PATIENT ACCOUNT
// DELETE /api/auth/account
// Protected route
// ======================================================

const deactivateAccount = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { currentPassword, confirmation } = req.body || {};

    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm account deletion',
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "This action is only available for patient accounts",
      });
    }

    if (!isActiveAccount(user)) {
      return res.status(400).json({
        success: false,
        message: "Account is already disabled",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "Password authentication is unavailable",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Atomic deactivation prevents overwriting
    // a concurrent password change.
    const result = await User.updateOne(
      {
        _id: user._id,
        role: "patient",
        password: user.password,
        isActive: { $ne: false },
      },
      {
        $set: {
          isActive: false,
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
        $inc: {
          tokenVersion: 1,
        },
      },
    );

    if (result.modifiedCount !== 1) {
      return res.status(409).json({
        success: false,
        message: "Account details changed. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your account has been deactivated successfully",
    });
  } catch (error) {
    console.error("DEACTIVATE ACCOUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deactivating account",
    });
  }
};

// ======================================================
// 8. ADMIN TEST
// Protected + Admin role required
// ======================================================

const adminTest = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Welcome Admin",
      user: formatUser(req.user),
    });
  } catch (error) {
    console.error("ADMIN TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// 9. FORGOT PASSWORD
// POST /api/auth/forgot-password
// ======================================================

const forgotPassword = async (req, res) => {
  const genericMessage =
    "If an active account exists with this email, a password reset link will be sent.";

  let savedUserId = null;
  let savedTokenHash = null;

  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !isValidEmail(normalizeEmail(email))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    // Do not reveal whether the email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // Verify frontend URL before saving token.
    const clientUrl = process.env.CLIENT_URL?.trim();

    if (!clientUrl) {
      throw new Error("CLIENT_URL is not configured");
    }

    // Generate secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store SHA-256 hash, never raw token.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Atomically replace any previous reset link.
    const result = await User.updateOne(
      {
        _id: user._id,
        isActive: true,
      },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: resetExpires,
        },
      },
    );

    if (result.matchedCount !== 1) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    savedUserId = user._id;
    savedTokenHash = hashedToken;

    const resetUrl =
      `${clientUrl.replace(/\/$/, "")}` + `/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Doccure - Reset Your Password",
      text: [
        "You requested a password reset.",
        "",
        `Reset your password: ${resetUrl}`,
        "",
        "This link expires in 15 minutes.",
        "If you did not request this, ignore this email.",
      ].join("\n"),
    });

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    // If email failed, remove only the token
    // created by this particular request.
    // Never erase a newer concurrent reset token.
    if (savedUserId && savedTokenHash) {
      try {
        await User.updateOne(
          {
            _id: savedUserId,
            resetPasswordToken: savedTokenHash,
          },
          {
            $unset: {
              resetPasswordToken: "",
              resetPasswordExpires: "",
            },
          },
        );
      } catch (cleanupError) {
        console.error("RESET TOKEN CLEANUP ERROR:", cleanupError);
      }
    }

    // Keep response generic to prevent
    // account enumeration.
    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  }
};

// ======================================================
// 10. RESET PASSWORD
// POST /api/auth/reset-password/:token
// ======================================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params || {};

    const { newPassword, confirmPassword } = req.body || {};

    // 1. VALIDATE RESET TOKEN
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // 2. VALIDATE PASSWORD INPUT
    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation are required",
      });
    }

    // 3. CONFIRM PASSWORD
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 4. PASSWORD STRENGTH
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // 5. HASH RESET TOKEN
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 6. FIND ACTIVE USER WITH VALID TOKEN
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "Password authentication is unavailable",
      });
    }

    // 7. PREVENT PASSWORD REUSE
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    // 8. HASH NEW PASSWORD
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 9. ATOMIC PASSWORD RESET
    //
    // Ensures:
    // - Token has not expired
    // - Token has not already been used
    // - Password was not concurrently changed
    // - Account is active
    //
    // $inc invalidates all previous JWTs.

    const result = await User.updateOne(
      {
        _id: user._id,
        password: user.password,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          $gt: new Date(),
        },
        isActive: true,
      },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
        $inc: {
          tokenVersion: 1,
        },
      },
    );

    // 10. VERIFY UPDATE
    if (result.modifiedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // 11. SUCCESS
    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resetting password",
    });
  }
};

// ======================================================
// EXPORT ALL AUTH CONTROLLERS
// ======================================================

module.exports = {
  registerUser,
  LoginUser,
  getProfile,
  updateProfile,
  changePassword,
  updateProfileImage,
  deactivateAccount,
  adminTest,
  forgotPassword,
  resetPassword,
};
