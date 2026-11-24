import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// ==========================================
// API BASE URL
// ==========================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

// ==========================================
// AUTH HEADERS
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
// FORMAT TRANSACTION
// ==========================================

const formatTransaction = (payment) => {
  const patient = payment.patient || {};
  const appointment = payment.appointment || {};
  const doctor = appointment.doctor || {};

  const patientName =
    [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
    patient.name ||
    "Unknown Patient";

  const doctorName =
    doctor.displayName ||
    [doctor.user?.firstName, doctor.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    doctor.user?.name ||
    "Unknown Doctor";

  const createdAt = payment.createdAt ? new Date(payment.createdAt) : null;

  const validDate = createdAt && !Number.isNaN(createdAt.getTime());

  const image = patient.image || "";

  const patientImage = image
    ? /^https?:\/\//i.test(image)
      ? image
      : `${API_URL}/${image.replace(/^\/+/, "")}`
    : "";

  return {
    ...payment,

    id: payment._id,
    invoiceNumber: payment.orderId || "—",

    patientId: patient._id || "—",
    patientName,
    patientImage,
    doctorName,

    amount: Number(payment.amount) || 0,
    currency: payment.currency || "LKR",
    status: payment.status || "pending",
    paymentMethod: payment.paymentMethod || "—",

    date: validDate
      ? createdAt.toLocaleDateString("en-LK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Colombo",
        })
      : "—",

    time: validDate
      ? createdAt.toLocaleTimeString("en-LK", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Colombo",
        })
      : "—",
  };
};

// ==========================================
// FETCH ADMIN TRANSACTIONS
// ==========================================

export const fetchAdminTransactions = createAsyncThunk(
  "adminTransactions/fetchTransactions",
  async (filters = {}, { rejectWithValue, signal }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/dashboard/transactions`,
        {
          ...getAuthHeaders(),
          params: filters,
          signal,
        },
      );

      if (!response.data.success) {
        return rejectWithValue(
          response.data.message || "Failed to fetch transactions",
        );
      }

      return {
        transactions: (response.data.transactions || []).map(formatTransaction),

        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch transactions",
      );
    }
  },
);

// ==========================================
// EXPORT ADMIN TRANSACTIONS CSV
// ==========================================

export const exportAdminTransactions = createAsyncThunk(
  "adminTransactions/exportTransactions",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/dashboard/transactions/export`,
        {
          ...getAuthHeaders(),
          params: filters,
          responseType: "blob",
        },
      );

      // Return CSV text, not a Blob.
      // This keeps Redux actions serializable.
      const csv = await response.data.text();

      if (!csv) {
        return rejectWithValue("No transactions available for export");
      }

      return csv;
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        try {
          const data = JSON.parse(await error.response.data.text());

          return rejectWithValue(
            data.message || "Failed to export transactions",
          );
        } catch {
          return rejectWithValue("Failed to export transactions");
        }
      }

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to export transactions",
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  transactions: [],

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  loading: false,
  error: null,
  currentRequestId: null,

  exporting: false,
  exportError: null,
};

// ==========================================
// ADMIN TRANSACTIONS SLICE
// ==========================================

const adminTransactionsSlice = createSlice({
  name: "adminTransactions",

  initialState,

  reducers: {
    clearAdminTransactionsError: (state) => {
      state.error = null;
      state.exportError = null;
    },

    resetAdminTransactions: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // FETCH PENDING
      .addCase(fetchAdminTransactions.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })

      // FETCH SUCCESS
      .addCase(fetchAdminTransactions.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;

        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })

      // FETCH FAILED
      .addCase(fetchAdminTransactions.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;

        if (!action.meta.aborted) {
          state.error =
            action.payload ||
            action.error.message ||
            "Failed to fetch transactions";

          state.transactions = [];
        }
      })

      // EXPORT PENDING
      .addCase(exportAdminTransactions.pending, (state) => {
        state.exporting = true;
        state.exportError = null;
      })

      // EXPORT SUCCESS
      .addCase(exportAdminTransactions.fulfilled, (state) => {
        state.exporting = false;
      })

      // EXPORT FAILED
      .addCase(exportAdminTransactions.rejected, (state, action) => {
        state.exporting = false;

        state.exportError =
          action.payload ||
          action.error.message ||
          "Failed to export transactions";
      });
  },
});

export const { clearAdminTransactionsError, resetAdminTransactions } =
  adminTransactionsSlice.actions;

export default adminTransactionsSlice.reducer;
