const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");

let io = null;

// ======================================================
// INITIALIZE SOCKET.IO
// ======================================================

const initializeSocket = (httpServer) => {
  if (io) {
    return io;
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL or CLIENT_URL is required");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      credentials: true,
      methods: ["GET", "POST"],
    },

    transports: ["websocket", "polling"],

    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ====================================================
  // SOCKET AUTHENTICATION MIDDLEWARE
  // ====================================================

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });

      const userId = decoded.id || decoded.userId || decoded._id;

      if (!userId || !mongoose.isValidObjectId(userId)) {
        return next(new Error("Invalid token payload"));
      }

      // Verify the user still exists.

      const user = await User.findById(userId)
        .select("_id role isActive")
        .lean();

      if (!user) {
        return next(new Error("User account not found"));
      }

      if (user.isActive === false) {
        return next(new Error("User account is inactive"));
      }

      // Store verified identity on socket.

      socket.userId = String(user._id);
      socket.userRole = user.role;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);

      next(new Error("Invalid or expired token"));
    }
  });

  // ====================================================
  // SOCKET CONNECTION
  // ====================================================

  io.on("connection", (socket) => {
    const userId = socket.userId;

    const room = `user:${userId}`;

    // Join private user notification room.

    socket.join(room);

    console.log(`Socket connected: ${userId}`);

    // Optional acknowledgement event.

    socket.emit("socket:connected", {
      success: true,
      message: "Socket connected successfully",
      userId,
    });

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${userId}`, reason);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${userId}:`, error.message);
    });
  });

  console.log("Socket.IO initialized");

  return io;
};

// ======================================================
// GET SOCKET INSTANCE
// ======================================================

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
