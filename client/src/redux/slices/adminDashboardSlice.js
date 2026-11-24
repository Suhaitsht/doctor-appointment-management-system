import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// ==========================================
// API BASE URL
// ==========================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

// ==========================================
// GET AUTH TOKEN
// ==========================================

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    },
  };
};

// ==========================================
// FETCH DASHBOARD DATA
// ==========================================

export const fetchAdminDashboard = createAsyncThunk(
  "adminDashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const endpoints = [
        "/api/admin/dashboard/stats",
        "/api/admin/dashboard/doctors",
        "/api/admin/dashboard/patients",
        "/api/admin/dashboard/appointments",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          axios.get(`${API_URL}${endpoint}`, getAuthHeaders()),
        ),
      );

      return {
        stats: responses[0].data.stats,
        revenue: responses[0].data.revenue,
        doctors: responses[1].data.doctors,
        patients: responses[2].data.patients,
        appointments: responses[3].data.appointments,
      };
    } catch (error) {
      console.error(
        "ADMIN DASHBOARD API ERROR:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard data",
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  stats: {
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    activeDoctors: 0,
    activePatients: 0,
    inactivePatients: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    currency: "LKR",
  },

  revenue: null,
  doctors: [],
  patients: [],
  appointments: [],

  loading: false,
  error: null,
};

// ==========================================
// DASHBOARD SLICE
// ==========================================

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,

  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.revenue = action.payload.revenue;
        state.doctors = action.payload.doctors;
        state.patients = action.payload.patients;
        state.appointments = action.payload.appointments;
      })

      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { clearDashboardError } = adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;
