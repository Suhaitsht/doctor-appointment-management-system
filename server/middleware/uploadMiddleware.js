"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/* ======================================================
   1. PROFILE IMAGE DIRECTORY
====================================================== */

const uploadDir = path.resolve(__dirname, "../uploads/profiles");

fs.mkdirSync(uploadDir, {
  recursive: true,
});

/* ======================================================
   2. ALLOWED IMAGE FORMATS
====================================================== */

const allowedFormats = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const extensionMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/* ======================================================
   3. MULTER DISK STORAGE
====================================================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    try {
      const extension = extensionMap[file.mimetype];

      if (!extension) {
        return cb(new Error("Unsupported image format"));
      }

      const filename = `profile-${crypto.randomUUID()}${extension}`;

      return cb(null, filename);
    } catch (error) {
      return cb(error);
    }
  },
});

/* ======================================================
   4. FILE FILTER
====================================================== */

const fileFilter = (req, file, cb) => {
  const allowedExtensions = allowedFormats[file.mimetype];

  if (!allowedExtensions) {
    return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
  }

  const originalExtension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.includes(originalExtension)) {
    return cb(new Error("Image file extension does not match its format."));
  }

  return cb(null, true);
};

/* ======================================================
   5. UPLOAD CONFIGURATION
====================================================== */

const profileUpload = multer({
  storage,
  fileFilter,

  limits: {
    // Maximum image size: 2 MB
    fileSize: 2 * 1024 * 1024,

    // Only one image
    files: 1,

    // Maximum multipart fields
    fields: 20,

    // Restrict filename length
    fieldNameSize: 100,
  },
});

/* ======================================================
   6. EXPORT
====================================================== */

module.exports = profileUpload;
