import axios from "axios";

// ======================================================
// API BASE URL
// ======================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ======================================================
// CREATE AXIOS INSTANCE
// ======================================================

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 30000,

  headers: {
    Accept: "application/json",
  },
});

// ======================================================
// REQUEST INTERCEPTOR
// Automatically attach JWT token
// ======================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.delete("Authorization");
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    // ----------------------------------------------
    // NETWORK ERROR
    // ----------------------------------------------

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        console.error("API request timed out.");
      } else {
        console.error("Network error. Check backend connection.");
      }

      return Promise.reject(error);
    }

    const status = error.response.status;

    // ----------------------------------------------
    // 401 UNAUTHORIZED
    // ----------------------------------------------

    if (status === 401) {
      console.warn("Unauthorized request or expired token.");

      // Do not directly modify Redux here.
      // Auth thunks handle their own 401 responses.
    }

    // ----------------------------------------------
    // 403 FORBIDDEN
    // ----------------------------------------------

    if (status === 403) {
      console.warn("Access denied. Insufficient permissions.");
    }

    // ----------------------------------------------
    // 404 NOT FOUND
    // ----------------------------------------------

    if (status === 404) {
      console.warn("Requested API endpoint not found.");
    }

    // ----------------------------------------------
    // SERVER ERROR
    // ----------------------------------------------

    if (status >= 500) {
      console.error("Backend server error:", error.response.data);
    }

    return Promise.reject(error);
  },
);

// ======================================================
// EXPORT
// ======================================================

export default api;
