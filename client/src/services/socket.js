import { io } from "socket.io-client";

// ======================================================
// SOCKET CONFIGURATION
// ======================================================

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;
let activeToken = null;

// ======================================================
// CONNECT SOCKET
// ======================================================

export const connectSocket = (token) => {
  if (!token) {
    return null;
  }

  // Reuse existing connection for same token.
  if (socket && activeToken === token) {
    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  // Disconnect previous user's connection.
  disconnectSocket();

  activeToken = token;

  const newSocket = io(SOCKET_URL, {
    autoConnect: false,

    auth: {
      token,
    },

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,

    transports: ["websocket", "polling"],
  });

  socket = newSocket;

  // ====================================================
  // SOCKET EVENTS
  // ====================================================

  newSocket.on("connect", () => {
    console.log("Socket connected:", newSocket.id);
  });

  newSocket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  newSocket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  newSocket.connect();

  return newSocket;
};

// ======================================================
// GET EXISTING SOCKET
// ======================================================

export const getSocket = () => socket;

// ======================================================
// DISCONNECT SOCKET
// ======================================================

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeToken = null;
};
