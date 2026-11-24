"use strict";

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");

// ======================================================
// HELPER: EXTRACT BEARER TOKEN
// ======================================================

const extractBearerToken = (authorization) => {
  if (typeof authorization !== "string") {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  return match ? match[1] : null;
};

// ======================================================
// HELPER: EXTRACT USER ID FROM JWT
// ======================================================

const getTokenUserId = (decoded) => {
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  const userId = decoded.id || decoded.userId || decoded._id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return String(userId);
};

// ======================================================
// HELPER: VALIDATE JWT TOKEN VERSION
// ======================================================

const isTokenRevoked = (decoded, user) => {
  // Reject legacy tokens without tokenVersion.
  if (!Number.isSafeInteger(decoded.tokenVersion) || decoded.tokenVersion < 0) {
    return true;
  }

  const currentVersion = user.tokenVersion ?? 0;

  // Reject unexpected or invalid database values.
  if (!Number.isSafeInteger(currentVersion) || currentVersion < 0) {
    return true;
  }

  // A password change increments tokenVersion.
  // All previously issued JWTs become invalid.
  return decoded.tokenVersion !== currentVersion;
};

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

const protect = async (req, res, next) => {
  try {
    // ==================================================
    // 1. EXTRACT BEARER TOKEN
    // ==================================================

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing or malformed.",
      });
    }

    // ==================================================
    // 2. VERIFY JWT SECRET
    // ==================================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication service is unavailable.",
      });
    }

    // ==================================================
    // 3. VERIFY JWT SIGNATURE AND EXPIRY
    // ==================================================

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        code: "INVALID_TOKEN",
      });
    }

    // ==================================================
    // 4. VALIDATE TOKEN PAYLOAD
    // ==================================================

    const userId = getTokenUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
        code: "INVALID_TOKEN_PAYLOAD",
      });
    }

    // ==================================================
    // 5. FETCH USER WITH TOKEN VERSION
    // ==================================================

    const user = await User.findById(userId).select("+tokenVersion -password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    // ==================================================
    // 6. CHECK ACCOUNT STATUS
    // ==================================================

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled. Please contact the hospital administrator.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    // ==================================================
    // 7. CHECK TOKEN VERSION
    // ==================================================

    if (isTokenRevoked(decoded, user)) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
        code: "TOKEN_REVOKED",
      });
    }

    // ==================================================
    // 8. ATTACH AUTHENTICATED USER
    // ==================================================

    // Remove the internal version field from the
    // user object passed to downstream controllers.
    user.tokenVersion = undefined;

    req.user = user;

    // ==================================================
    // 9. CONTINUE TO PROTECTED ROUTE
    // ==================================================

    return next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

module.exports = protect;
