import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ======================================================
// LOCAL STORAGE HELPERS
// ======================================================

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return null;

    const user = JSON.parse(storedUser);

    if (!user || typeof user !== "object" || Array.isArray(user)) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Invalid stored user:", error);
    localStorage.removeItem("user");
    return null;
  }
};

const getStoredToken = () => {
  return localStorage.getItem("token");
};

const saveAuth = (user, token) => {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
};

const saveUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

const clearStoredAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

// ======================================================
// ERROR HELPERS
// ======================================================

const getErrorPayload = (error, fallback) => ({
  message: error.response?.data?.message || error.message || fallback,

  status: error.response?.status || null,

  code: error.response?.data?.code || null,
});

const getErrorMessage = (action, fallback) => {
  return (
    action.payload?.message ||
    action.payload ||
    action.error?.message ||
    fallback
  );
};

const isUnauthorized = (action) => {
  return action.payload?.status === 401;
};

// ======================================================
// 1. LOGIN USER
// POST /api/auth/login
// ======================================================

export const loginUser = createAsyncThunk(
  "auth/loginUser",

  async (loginData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", loginData);

      const { user, token } = response.data;

      if (!user || !token) {
        return rejectWithValue({
          message: "Invalid login response: user or token missing",
          status: null,
        });
      }

      return {
        user,
        token,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Login failed. Please try again."),
      );
    }
  },
);

// ======================================================
// 2. REGISTER USER
// POST /api/auth/register
// ======================================================

export const registerUser = createAsyncThunk(
  "auth/registerUser",

  async (registerData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", registerData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Registration failed. Please try again."),
      );
    }
  },
);

// ======================================================
// 3. GET LOGGED-IN USER PROFILE
// GET /api/auth/profile
// ======================================================

export const getProfile = createAsyncThunk(
  "auth/getProfile",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");

      const user = response.data?.user || response.data;

      if (!user || typeof user !== "object") {
        return rejectWithValue({
          message: "User profile not found",
          status: null,
        });
      }

      return user;
    } catch (error) {
      return rejectWithValue(getErrorPayload(error, "Failed to load profile"));
    }
  },
);

// ======================================================
// 4. UPDATE PROFILE
// PUT /api/auth/profile
// ======================================================

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",

  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/profile", profileData);

      const user = response.data?.user;

      if (!user) {
        return rejectWithValue({
          message: "Updated user data missing from response",
          status: null,
        });
      }

      return {
        user,
        message: response.data?.message || "Profile updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to update profile"),
      );
    }
  },
);

// ======================================================
// 5. CHANGE PASSWORD
// PUT /api/auth/change-password
// ======================================================

export const changePassword = createAsyncThunk(
  "auth/changePassword",

  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/change-password", passwordData);

      return {
        message:
          response.data?.message ||
          "Password changed successfully. Please log in again.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to change password"),
      );
    }
  },
);

// ======================================================
// 6. UPLOAD PROFILE IMAGE
// PUT /api/auth/profile/image
// ======================================================

export const uploadProfileImage = createAsyncThunk(
  "auth/uploadProfileImage",

  async (imageFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      formData.append("image", imageFile);

      const response = await api.put("/auth/profile/image", formData);

      const user = response.data?.user;

      if (!user) {
        return rejectWithValue({
          message: "Updated user data missing from image upload response",
          status: null,
        });
      }

      return {
        user,
        message: response.data?.message || "Profile image updated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to upload profile image"),
      );
    }
  },
);

// ======================================================
// 7. DEACTIVATE ACCOUNT
// DELETE /api/auth/account
// ======================================================

export const deactivateAccount = createAsyncThunk(
  "auth/deactivateAccount",

  async ({ currentPassword, confirmation }, { rejectWithValue }) => {
    try {
      const response = await api.delete("/auth/account", {
        data: {
          currentPassword,
          confirmation,
        },
      });

      return {
        message:
          response.data?.message ||
          "Your account has been deactivated successfully",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to deactivate account"),
      );
    }
  },
);

// ======================================================
// 8. FORGOT PASSWORD
// POST /api/auth/forgot-password
//
// PUBLIC ENDPOINT - NO JWT REQUIRED
// ======================================================

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",

  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      return {
        message:
          response.data?.message ||
          "If an active account exists with this email, a password reset link will be sent.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(
          error,
          "Unable to process your password reset request.",
        ),
      );
    }
  },
);

// ======================================================
// 9. RESET PASSWORD
// POST /api/auth/reset-password/:token
//
// PUBLIC ENDPOINT - NO JWT REQUIRED
// ======================================================

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",

  async ({ token, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        {
          newPassword,
          confirmPassword,
        },
      );

      return {
        message:
          response.data?.message ||
          "Password reset successfully. Please log in with your new password.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Unable to reset password."),
      );
    }
  },
);

// ======================================================
// INITIAL AUTH STATE
// ======================================================

const storedUser = getStoredUser();
const storedToken = getStoredToken();

const initialState = {
  // Authentication
  user: storedUser,
  token: storedToken,

  isAuthenticated: Boolean(storedUser && storedToken),

  // Existing loading states
  loading: false,
  updateLoading: false,
  passwordLoading: false,
  imageUploadLoading: false,
  deactivateLoading: false,

  // Existing messages
  error: null,
  successMessage: null,

  // Forgot password state
  forgotPasswordLoading: false,
  forgotPasswordError: null,
  forgotPasswordSuccess: false,
  forgotPasswordMessage: null,

  // Reset password state
  resetPasswordLoading: false,
  resetPasswordError: null,
  resetPasswordSuccess: false,
  resetPasswordMessage: null,

  // Request tracking
  sessionVersion: 0,
  loginRequestId: null,

  // Prevent stale recovery responses
  forgotPasswordRequestId: null,
  resetPasswordRequestId: null,
};

// ======================================================
// AUTH RESET HELPER
// ======================================================

const resetAuthState = (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;

  state.loading = false;
  state.updateLoading = false;
  state.passwordLoading = false;
  state.imageUploadLoading = false;
  state.deactivateLoading = false;

  state.loginRequestId = null;

  state.sessionVersion += 1;
};

// ======================================================
// CREATE AUTH SLICE
// ======================================================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    logout: (state) => {
      resetAuthState(state);

      state.error = null;
      state.successMessage = null;
    },

    // --------------------------------------------------
    // CLEAR AUTH ERROR
    // --------------------------------------------------

    clearAuthError: (state) => {
      state.error = null;
    },

    // --------------------------------------------------
    // CLEAR EXISTING AUTH MESSAGES
    // --------------------------------------------------

    clearAuthMessage: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // --------------------------------------------------
    // CLEAR FORGOT PASSWORD STATE
    // --------------------------------------------------

    clearForgotPasswordState: (state) => {
      state.forgotPasswordLoading = false;
      state.forgotPasswordError = null;
      state.forgotPasswordSuccess = false;
      state.forgotPasswordMessage = null;

      // Ignore older responses after clearing.
      state.forgotPasswordRequestId = null;
    },

    // --------------------------------------------------
    // CLEAR RESET PASSWORD STATE
    // --------------------------------------------------

    clearResetPasswordState: (state) => {
      state.resetPasswordLoading = false;
      state.resetPasswordError = null;
      state.resetPasswordSuccess = false;
      state.resetPasswordMessage = null;

      state.resetPasswordRequestId = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // LOGIN
      // ==================================================

      .addCase(loginUser.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;

        state.loginRequestId = action.meta.requestId;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        if (state.loginRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;

        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;

        state.loginRequestId = null;
        state.sessionVersion += 1;

        state.error = null;
        state.successMessage = "Login successful";
      })

      .addCase(loginUser.rejected, (state, action) => {
        if (state.loginRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.loginRequestId = null;

        state.error = getErrorMessage(action, "Login failed");

        state.successMessage = null;
      })

      // ==================================================
      // REGISTER
      // ==================================================

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.successMessage =
          action.payload?.message || "Registration successful";
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;

        state.error = getErrorMessage(action, "Registration failed");

        state.successMessage = null;
      })

      // ==================================================
      // GET PROFILE
      // ==================================================

      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;

        if (!state.token || !state.isAuthenticated) {
          return;
        }

        state.user = action.payload;
        state.error = null;
      })

      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;

        state.error = getErrorMessage(action, "Failed to load profile");

        if (isUnauthorized(action)) {
          resetAuthState(state);
        }
      })

      // ==================================================
      // UPDATE PROFILE
      // ==================================================

      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;

        if (!state.isAuthenticated || !state.token) {
          return;
        }

        state.user = action.payload.user;
        state.error = null;
        state.successMessage = action.payload.message;
      })

      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;

        state.error = getErrorMessage(action, "Failed to update profile");

        state.successMessage = null;

        if (isUnauthorized(action)) {
          resetAuthState(state);
        }
      })

      // ==================================================
      // CHANGE PASSWORD
      // ==================================================

      .addCase(changePassword.pending, (state) => {
        state.passwordLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(changePassword.fulfilled, (state, action) => {
        // Backend increments tokenVersion,
        // so the current JWT is now invalid.
        // Clear authentication immediately.
        resetAuthState(state);

        state.error = null;
        state.successMessage = action.payload.message;
      })

      .addCase(changePassword.rejected, (state, action) => {
        state.passwordLoading = false;

        state.error = getErrorMessage(action, "Failed to change password");

        state.successMessage = null;

        if (isUnauthorized(action)) {
          resetAuthState(state);
        }
      })

      // ==================================================
      // PROFILE IMAGE UPLOAD
      // ==================================================

      .addCase(uploadProfileImage.pending, (state) => {
        state.imageUploadLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.imageUploadLoading = false;

        if (!state.isAuthenticated || !state.token) {
          return;
        }

        state.user = action.payload.user;
        state.error = null;
        state.successMessage = action.payload.message;
      })

      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.imageUploadLoading = false;

        state.error = getErrorMessage(action, "Failed to upload profile image");

        state.successMessage = null;

        if (isUnauthorized(action)) {
          resetAuthState(state);
        }
      })

      // ==================================================
      // DEACTIVATE ACCOUNT
      // ==================================================

      .addCase(deactivateAccount.pending, (state) => {
        state.deactivateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deactivateAccount.fulfilled, (state, action) => {
        resetAuthState(state);

        state.error = null;
        state.successMessage = action.payload.message;
      })

      .addCase(deactivateAccount.rejected, (state, action) => {
        state.deactivateLoading = false;

        state.error = getErrorMessage(action, "Failed to deactivate account");

        state.successMessage = null;

        if (isUnauthorized(action)) {
          resetAuthState(state);
        }
      })

      // ==================================================
      // FORGOT PASSWORD
      // ==================================================

      .addCase(forgotPassword.pending, (state, action) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
        state.forgotPasswordSuccess = false;
        state.forgotPasswordMessage = null;

        state.forgotPasswordRequestId = action.meta.requestId;
      })

      .addCase(forgotPassword.fulfilled, (state, action) => {
        if (state.forgotPasswordRequestId !== action.meta.requestId) {
          return;
        }

        state.forgotPasswordLoading = false;
        state.forgotPasswordError = null;
        state.forgotPasswordSuccess = true;

        state.forgotPasswordMessage = action.payload.message;

        state.forgotPasswordRequestId = null;
      })

      .addCase(forgotPassword.rejected, (state, action) => {
        if (state.forgotPasswordRequestId !== action.meta.requestId) {
          return;
        }

        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = false;

        state.forgotPasswordError = getErrorMessage(
          action,
          "Failed to send password reset link",
        );

        state.forgotPasswordMessage = null;
        state.forgotPasswordRequestId = null;
      })

      // ==================================================
      // RESET PASSWORD
      // ==================================================

      .addCase(resetPassword.pending, (state, action) => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
        state.resetPasswordSuccess = false;
        state.resetPasswordMessage = null;

        state.resetPasswordRequestId = action.meta.requestId;
      })

      .addCase(resetPassword.fulfilled, (state, action) => {
        if (state.resetPasswordRequestId !== action.meta.requestId) {
          return;
        }

        state.resetPasswordLoading = false;
        state.resetPasswordError = null;
        state.resetPasswordSuccess = true;

        state.resetPasswordMessage = action.payload.message;

        state.resetPasswordRequestId = null;

        // Password reset invalidates old JWTs.
        // Remove any previously stored session.
        resetAuthState(state);
      })

      .addCase(resetPassword.rejected, (state, action) => {
        if (state.resetPasswordRequestId !== action.meta.requestId) {
          return;
        }

        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;

        state.resetPasswordError = getErrorMessage(
          action,
          "Failed to reset password",
        );

        state.resetPasswordMessage = null;
        state.resetPasswordRequestId = null;
      });
  },
});

// ======================================================
// ACTION EXPORTS
// ======================================================

export const {
  logout,
  clearAuthError,
  clearAuthMessage,
  clearForgotPasswordState,
  clearResetPasswordState,
} = authSlice.actions;

// ======================================================
// LOGOUT THUNK
// ======================================================

export const logoutUser = () => (dispatch) => {
  clearStoredAuth();
  dispatch(logout());
};

// ======================================================
// PERSIST AUTH MIDDLEWARE
// ======================================================

export const persistAuthMiddleware = (store) => (next) => (action) => {
  const previousVersion = store.getState().auth?.sessionVersion;

  const result = next(action);

  const state = store.getState().auth;

  if (!state) return result;

  const sessionChanged = state.sessionVersion !== previousVersion;

  if (sessionChanged) {
    if (state.isAuthenticated && state.user && state.token) {
      saveAuth(state.user, state.token);
    } else {
      clearStoredAuth();
    }
  }

  if (
    (getProfile.fulfilled.match(action) ||
      updateProfile.fulfilled.match(action) ||
      uploadProfileImage.fulfilled.match(action)) &&
    state.isAuthenticated &&
    state.user &&
    state.token
  ) {
    saveUser(state.user);
  }

  return result;
};

// ======================================================
// EXISTING SELECTORS
// ======================================================

export const selectAuthUser = (state) => state.auth.user;

export const selectAuthToken = (state) => state.auth.token;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export const selectAuthLoading = (state) => state.auth.loading;

export const selectProfileUpdateLoading = (state) => state.auth.updateLoading;

export const selectPasswordLoading = (state) => state.auth.passwordLoading;

export const selectImageUploadLoading = (state) =>
  state.auth.imageUploadLoading;

export const selectDeactivateLoading = (state) => state.auth.deactivateLoading;

export const selectAuthError = (state) => state.auth.error;

export const selectAuthSuccessMessage = (state) => state.auth.successMessage;

// ======================================================
// NEW FORGOT PASSWORD SELECTORS
// ======================================================

export const selectForgotPasswordLoading = (state) =>
  state.auth.forgotPasswordLoading;

export const selectForgotPasswordError = (state) =>
  state.auth.forgotPasswordError;

export const selectForgotPasswordSuccess = (state) =>
  state.auth.forgotPasswordSuccess;

export const selectForgotPasswordMessage = (state) =>
  state.auth.forgotPasswordMessage;

// ======================================================
// NEW RESET PASSWORD SELECTORS
// ======================================================

export const selectResetPasswordLoading = (state) =>
  state.auth.resetPasswordLoading;

export const selectResetPasswordError = (state) =>
  state.auth.resetPasswordError;

export const selectResetPasswordSuccess = (state) =>
  state.auth.resetPasswordSuccess;

export const selectResetPasswordMessage = (state) =>
  state.auth.resetPasswordMessage;

// ======================================================
// REDUCER EXPORT
// ======================================================

export default authSlice.reducer;
