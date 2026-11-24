"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");

dotenv.config();

/* ======================================================
   DATABASE
====================================================== */

const connectDB = require("./config/db");

/* ======================================================
   SOCKET.IO
====================================================== */

const { initializeSocket } = require("./sockets/socket");

/* ======================================================
   ChatBot OpenAI
====================================================== */
const chatbotRoutes = require("./routes/chatbotRoutes");
const chatbotAvailabilityRoutes = require("./routes/chatbotAvailabilityRoutes");

/* ======================================================
   ROUTES
====================================================== */

const adminPatientRoutes = require("./routes/adminPatientRoutes");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const specialityRoutes = require("./routes/specialityRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const adminDashboardRoutes = require("./routes/adminDashborad");
const notificationRoutes = require("./routes/notificationRoutes");

const reviewRoutes = require("./routes/reviewRoutes");

/* ======================================================
   EXPRESS + HTTP SERVER
====================================================== */

const app = express();
const httpServer = http.createServer(app);

const PORT = Number(process.env.PORT || 5000);

const FRONTEND_URL =
  process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

const allowedOrigins = FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/* ======================================================
   CORS
====================================================== */

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");

      error.status = 403;

      return callback(error);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ======================================================
   BODY PARSERS
====================================================== */

app.use(
  express.json({
    limit: "10mb",
  }),
);

// PayHere form-urlencoded notifications.
app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb",
  }),
);

/* ======================================================
   STATIC FILES
====================================================== */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Doctor Booking API is running",
    service: "Jayanthi Medical Centre",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* ======================================================
   API ROUTES
====================================================== */

app.use("/api/auth", authRoutes);

app.use("/api/admin/patients", adminPatientRoutes);

app.use("/api/admin/dashboard", adminDashboardRoutes);

app.use("/api/doctors", doctorRoutes);

app.use("/api/specialities", specialityRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/consultations", consultationRoutes);

app.use("/api/invoices", invoiceRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/chatbot", chatbotRoutes);

app.use("/api/chatbot", chatbotAvailabilityRoutes);

app.use("/api/reviews", reviewRoutes);

/* ======================================================
   404 HANDLER
====================================================== */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  return res.status(status).json({
    success: false,
    message,
  });
});

/* ======================================================
   START SERVER
====================================================== */

let socketIO = null;

const startServer = async () => {
  try {
    // 1. Connect MongoDB.
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB connection is not ready");
    }

    console.log("MongoDB connected successfully");

    // 2. Initialize Socket.IO.
    socketIO = initializeSocket(httpServer);

    console.log("Socket.IO initialized");

    // 3. Start HTTP server.
    await new Promise((resolve, reject) => {
      httpServer.once("error", reject);

      httpServer.listen(PORT, () => {
        httpServer.removeListener("error", reject);
        resolve();
      });
    });

    const backendUrl = process.env.BACKEND_PUBLIC_URL
      ? process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "")
      : null;

    console.log("====================================");
    console.log(" JAYANTHI MEDICAL CENTRE BACKEND");
    console.log("====================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Notifications: http://localhost:${PORT}/api/notifications`);
    console.log(
      `PayHere callback: ${
        backendUrl
          ? `${backendUrl}/api/payments/payhere/notify`
          : "BACKEND_PUBLIC_URL not configured"
      }`,
    );
    console.log("====================================");
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

/* ======================================================
   GRACEFUL SHUTDOWN
====================================================== */

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`${signal} received. Shutting down...`);

  const forceExit = setTimeout(() => {
    console.error("Forced shutdown after timeout");

    process.exit(1);
  }, 10000);

  forceExit.unref();

  try {
    // Socket.IO close also closes its attached
    // HTTP server in supported Socket.IO versions.
    if (socketIO) {
      await new Promise((resolve) => {
        socketIO.close(() => resolve());
      });
    } else if (httpServer.listening) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) return reject(error);
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    clearTimeout(forceExit);

    console.log("Server stopped successfully");

    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);

    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

/* ======================================================
   RUN SERVER
====================================================== */

void startServer();
