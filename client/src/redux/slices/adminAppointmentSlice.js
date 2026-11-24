import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../api/axios";

// ======================================================
// 1. FETCH ADMIN APPOINTMENTS
// GET /api/appointments/admin/all
// ======================================================

export const fetchAdminAppointments = createAsyncThunk(
  "adminAppointments/fetchAll",

  async (
    {
      page = 1,
      limit = 10,
      status = "all",
      paymentStatus = "all",
      date = "",
      search = "",
    } = {},
    { rejectWithValue, signal },
  ) => {
    try {
      const params = {
        page,
        limit,
      };

      // Appointment status filter
      if (status && status !== "all") {
        params.status = status;
      }

      // Payment status filter
      if (paymentStatus && paymentStatus !== "all") {
        params.paymentStatus = paymentStatus;
      }

      // Date filter
      if (date) {
        params.date = date;
      }

      // Search filter
      if (typeof search === "string" && search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/appointments/admin/all", {
        params,
        signal,
      });

      return response.data;
    } catch (error) {
      // Allow Redux Toolkit to handle aborted requests.
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Unable to load admin appointments.",
      );
    }
  },
);

// ======================================================
// 2. ADMIN - CANCEL APPOINTMENT
// PATCH /api/appointments/admin/:appointmentId/cancel
// ======================================================

export const cancelAdminAppointment = createAsyncThunk(
  "adminAppointments/cancel",

  async ({ appointmentId, reason }, { rejectWithValue, signal }) => {
    try {
      // Validate appointment ID
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      // Validate cancellation reason
      if (typeof reason !== "string" || !reason.trim()) {
        return rejectWithValue("Cancellation reason is required.");
      }

      const cleanReason = reason.trim();

      if (cleanReason.length > 500) {
        return rejectWithValue(
          "Cancellation reason cannot exceed 500 characters.",
        );
      }

      const response = await api.patch(
        `/appointments/admin/${appointmentId}/cancel`,
        {
          reason: cleanReason,
        },
        {
          signal,
        },
      );

      return response.data;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel appointment.",
      );
    }
  },
);

// ======================================================
// 3. INITIAL STATE
// ======================================================

const initialState = {
  // Admin appointment records
  appointments: [],

  // Fetch state
  loading: false,
  error: null,

  // Total records
  totalAppointments: 0,

  // Server-side pagination
  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Prevent stale fetch responses
  currentRequestId: null,

  // Cancellation state
  cancelLoading: false,
  cancelError: null,
  cancelSuccess: null,

  // Track the appointment currently being cancelled
  cancellingAppointmentId: null,

  // Prevent stale cancellation responses
  currentCancelRequestId: null,
};

// ======================================================
// 4. ADMIN APPOINTMENT SLICE
// ======================================================

const adminAppointmentSlice = createSlice({
  name: "adminAppointments",

  initialState,

  reducers: {
    // Clear fetch error
    clearAdminAppointmentError: (state) => {
      state.error = null;
    },

    // Clear cancellation messages
    clearAdminCancelStatus: (state) => {
      state.cancelError = null;
      state.cancelSuccess = null;
    },

    // Reset the complete admin appointment state
    resetAdminAppointments: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // FETCH ADMIN APPOINTMENTS - PENDING
      // ==================================================

      .addCase(fetchAdminAppointments.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        state.currentRequestId = action.meta.requestId;
      })

      // ==================================================
      // FETCH ADMIN APPOINTMENTS - FULFILLED
      // ==================================================

      .addCase(fetchAdminAppointments.fulfilled, (state, action) => {
        // Ignore stale responses
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        const data = action.payload || {};

        state.loading = false;
        state.error = null;
        state.currentRequestId = null;

        // Appointment records
        state.appointments = Array.isArray(data.appointments)
          ? data.appointments
          : [];

        // Total appointment count
        state.totalAppointments = Number(data.totalAppointments) || 0;

        // Pagination information
        state.pagination = {
          currentPage: Number(data.pagination?.currentPage) || 1,

          totalPages: Number(data.pagination?.totalPages) || 1,

          limit: Number(data.pagination?.limit) || 10,

          hasNextPage: Boolean(data.pagination?.hasNextPage),

          hasPreviousPage: Boolean(data.pagination?.hasPreviousPage),
        };
      })

      // ==================================================
      // FETCH ADMIN APPOINTMENTS - REJECTED
      // ==================================================

      .addCase(fetchAdminAppointments.rejected, (state, action) => {
        // Ignore stale responses
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;

        // Do not display an error for aborted requests
        if (action.meta.aborted) {
          return;
        }

        state.error =
          action.payload ||
          action.error?.message ||
          "Unable to load appointments.";

        state.appointments = [];
        state.totalAppointments = 0;
      })

      // ==================================================
      // CANCEL ADMIN APPOINTMENT - PENDING
      // ==================================================

      .addCase(cancelAdminAppointment.pending, (state, action) => {
        state.cancelLoading = true;

        state.cancelError = null;
        state.cancelSuccess = null;

        state.cancellingAppointmentId = action.meta.arg.appointmentId;

        state.currentCancelRequestId = action.meta.requestId;
      })

      // ==================================================
      // CANCEL ADMIN APPOINTMENT - FULFILLED
      // ==================================================

      .addCase(cancelAdminAppointment.fulfilled, (state, action) => {
        // Ignore stale cancellation responses
        if (state.currentCancelRequestId !== action.meta.requestId) {
          return;
        }

        const data = action.payload || {};

        const updatedAppointment = data.appointment;

        state.cancelLoading = false;
        state.cancelError = null;

        state.cancellingAppointmentId = null;
        state.currentCancelRequestId = null;

        state.cancelSuccess =
          data.message || "Appointment cancelled successfully.";

        // Update the appointment in the current list
        // without waiting for the next fetch.
        if (updatedAppointment?._id) {
          const appointmentIndex = state.appointments.findIndex(
            (appointment) =>
              String(appointment._id) === String(updatedAppointment._id),
          );

          if (appointmentIndex !== -1) {
            state.appointments[appointmentIndex] = updatedAppointment;
          }
        }

        // The component will refetch appointments
        // to synchronize filters and pagination.
      })

      // ==================================================
      // CANCEL ADMIN APPOINTMENT - REJECTED
      // ==================================================

      .addCase(cancelAdminAppointment.rejected, (state, action) => {
        // Ignore stale cancellation responses
        if (state.currentCancelRequestId !== action.meta.requestId) {
          return;
        }

        state.cancelLoading = false;

        state.cancellingAppointmentId = null;
        state.currentCancelRequestId = null;

        if (action.meta.aborted) {
          return;
        }

        state.cancelError =
          action.payload ||
          action.error?.message ||
          "Failed to cancel appointment.";

        state.cancelSuccess = null;
      });
  },
});

// ======================================================
// 5. ACTIONS
// ======================================================

export const {
  clearAdminAppointmentError,
  clearAdminCancelStatus,
  resetAdminAppointments,
} = adminAppointmentSlice.actions;

// ======================================================
// 6. SELECTORS
// ======================================================

// Get all admin appointments
export const selectAdminAppointments = (state) =>
  state.adminAppointments.appointments;

// Fetch loading state
export const selectAdminAppointmentsLoading = (state) =>
  state.adminAppointments.loading;

// Fetch error
export const selectAdminAppointmentsError = (state) =>
  state.adminAppointments.error;

// Total appointment count
export const selectAdminAppointmentsTotal = (state) =>
  state.adminAppointments.totalAppointments;

// Pagination information
export const selectAdminAppointmentsPagination = (state) =>
  state.adminAppointments.pagination;

// Cancellation loading state
export const selectAdminCancelLoading = (state) =>
  state.adminAppointments.cancelLoading;

// Cancellation error
export const selectAdminCancelError = (state) =>
  state.adminAppointments.cancelError;

// Cancellation success message
export const selectAdminCancelSuccess = (state) =>
  state.adminAppointments.cancelSuccess;

// ID of appointment being cancelled
export const selectAdminCancellingAppointmentId = (state) =>
  state.adminAppointments.cancellingAppointmentId;

// ======================================================
// 7. EXPORT REDUCER
// ======================================================

export default adminAppointmentSlice.reducer;
