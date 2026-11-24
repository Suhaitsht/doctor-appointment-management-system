import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "@/api/axios";

// ======================================================
// FETCH PATIENT INVOICES
// GET /api/invoices/patient/me
// ======================================================

export const fetchMyInvoices = createAsyncThunk(
  "invoices/fetchMyInvoices",

  async (_, thunkAPI) => {
    try {
      const response = await api.get("/invoices/patient/me");

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch invoices.",
      );
    }
  },
);

// ======================================================
// FETCH SINGLE INVOICE
// GET /api/invoices/:invoiceId
// ======================================================

export const fetchInvoiceById = createAsyncThunk(
  "invoices/fetchInvoiceById",

  async (invoiceId, thunkAPI) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch invoice.",
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  invoices: [],

  selectedInvoice: null,

  loading: false,

  detailsLoading: false,

  error: null,

  detailsError: null,
};

// ======================================================
// SLICE
// ======================================================

const invoiceSlice = createSlice({
  name: "invoices",

  initialState,

  reducers: {
    clearInvoiceError: (state) => {
      state.error = null;
      state.detailsError = null;
    },

    clearSelectedInvoice: (state) => {
      state.selectedInvoice = null;
      state.detailsError = null;
    },

    resetInvoices: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // FETCH MY INVOICES
      // ==================================================

      .addCase(fetchMyInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMyInvoices.fulfilled, (state, action) => {
        state.loading = false;

        state.invoices = action.payload?.invoices || [];

        state.error = null;
      })

      .addCase(fetchMyInvoices.rejected, (state, action) => {
        state.loading = false;

        state.invoices = [];

        state.error = action.payload || "Failed to fetch invoices.";
      })

      // ==================================================
      // FETCH SINGLE INVOICE
      // ==================================================

      .addCase(fetchInvoiceById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.detailsLoading = false;

        state.selectedInvoice = action.payload?.invoice || null;

        state.detailsError = null;
      })

      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.detailsLoading = false;

        state.selectedInvoice = null;

        state.detailsError = action.payload || "Failed to fetch invoice.";
      });
  },
});

// ======================================================
// ACTIONS
// ======================================================

export const { clearInvoiceError, clearSelectedInvoice, resetInvoices } =
  invoiceSlice.actions;

// ======================================================
// SELECTORS
// ======================================================

export const selectInvoices = (state) => state.invoices?.invoices || [];

export const selectInvoiceLoading = (state) => state.invoices?.loading || false;

export const selectInvoiceError = (state) => state.invoices?.error || null;

export const selectSelectedInvoice = (state) =>
  state.invoices?.selectedInvoice || null;

export const selectInvoiceDetailsLoading = (state) =>
  state.invoices?.detailsLoading || false;

export const selectInvoiceDetailsError = (state) =>
  state.invoices?.detailsError || null;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default invoiceSlice.reducer;
