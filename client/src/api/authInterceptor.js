import api from "./axios";

import { logoutUser } from "@/redux/slices/authSlice";

// ======================================================
// AUTH INTERCEPTOR CONFIGURATION
// ======================================================

let interceptorId = null;
let isRedirecting = false;

const SESSION_INVALID_CODES = new Set([
  "TOKEN_REVOKED",
  "INVALID_TOKEN",
  "INVALID_TOKEN_PAYLOAD",
  "USER_NOT_FOUND",
]);

// ======================================================
// SETUP AUTH INTERCEPTOR
// ======================================================

export const setupAuthInterceptor = (store) => {
  // Avoid duplicate response interceptors.
  if (interceptorId !== null) {
    api.interceptors.response.eject(interceptorId);
  }

  interceptorId = api.interceptors.response.use(
    (response) => response,

    (error) => {
      const status = error.response?.status;
      const code = error.response?.data?.code;

      const isInvalidSession =
        status === 401 && SESSION_INVALID_CODES.has(code);

      if (!isInvalidSession) {
        return Promise.reject(error);
      }

      // Read the token used by the failed request.
      const requestAuthorization =
        error.config?.headers?.get?.("Authorization") ||
        error.config?.headers?.Authorization;

      const requestToken =
        typeof requestAuthorization === "string"
          ? requestAuthorization.replace(/^Bearer\s+/i, "").trim()
          : null;

      // Read the current authenticated session.
      const authState = store.getState().auth;

      const currentToken = authState?.token;

      const isAuthenticated = authState?.isAuthenticated === true;

      // Avoid logging out a newer session because
      // an older request returned 401.
      const isSameSession =
        Boolean(requestToken) && requestToken === currentToken;

      if (isAuthenticated && isSameSession && !isRedirecting) {
        isRedirecting = true;

        console.warn("Authentication session invalid:", code);

        // Clear Redux + localStorage.
        store.dispatch(logoutUser());

        // Redirect to login.
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        } else {
          isRedirecting = false;
        }
      }

      // Always reject so Redux thunks receive errors.
      return Promise.reject(error);
    },
  );

  // Optional cleanup.
  return () => {
    api.interceptors.response.eject(interceptorId);
    interceptorId = null;
    isRedirecting = false;
  };
};
