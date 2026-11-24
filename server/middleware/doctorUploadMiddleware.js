"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/* ======================================================
   DOCTOR IMAGE DIRECTORY
====================================================== */

const uploadDir = path.resolve(__dirname, "../uploads/doctors");

fs.mkdirSync(uploadDir, {
  recursive: true,
});

/* ======================================================
   ALLOWED IMAGE FORMATS
====================================================== */

const formats = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/* ======================================================
   STORAGE
====================================================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = extensions[file.mimetype];

    if (!extension) {
      return cb(new Error("Unsupported image format"));
    }

    cb(null, `doctor-${crypto.randomUUID()}${extension}`);
  },
});

/* ======================================================
   FILE FILTER
====================================================== */

const fileFilter = (req, file, cb) => {
  const allowedExtensions = formats[file.mimetype];

  if (!allowedExtensions) {
    return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
  }

  const extension = path.extname(file.originalname || "").toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return cb(new Error("Image extension does not match its MIME type."));
  }

  cb(null, true);
};

/* ======================================================
   EXPORT
====================================================== */

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 30,
  },
});
