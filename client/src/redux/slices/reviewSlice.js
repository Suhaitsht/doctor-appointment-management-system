import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import axios from "axios";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

// ==========================================
// HELPER - EXTRACT REVIEWS
// ==========================================

const extractReviews = (data) => {
  if (Array.isArray(data?.reviews)) {
    return data.reviews;
  }

  if (Array.isArray(data?.data?.reviews)) {
    return data.data.reviews;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || error.message || fallback;
};

// ==========================================
// 1. FETCH DOCTOR REVIEWS
// GET /api/reviews/doctor/:doctorId
// ==========================================

export const fetchDoctorReviews = createAsyncThunk(
  "reviews/fetchDoctorReviews",

  async (doctorId, { rejectWithValue, signal }) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/reviews/doctor/${doctorId}`,
        { signal },
      );

      const reviews = extractReviews(data).filter(
        (review) => review.isVisible !== false,
      );

      return {
        doctorId: String(doctorId),
        reviews,

        averageRating: data?.averageRating ?? data?.data?.averageRating ?? null,

        totalReviews: data?.totalReviews ?? data?.data?.totalReviews ?? null,
      };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        getErrorMessage(error, "Unable to load doctor reviews."),
      );
    }
  },
);

// ==========================================
// 2. FETCH PUBLIC REVIEWS
// GET /api/reviews/public
// ==========================================

export const fetchPublicReviews = createAsyncThunk(
  "reviews/fetchPublicReviews",

  async (limit = 6, { rejectWithValue, signal }) => {
    try {
      const { data } = await axios.get(`${API_URL}/reviews/public`, {
        params: { limit },
        signal,
      });

      if (data?.success === false) {
        throw new Error(data.message || "Unable to load reviews.");
      }

      return extractReviews(data).filter(
        (review) => review.isVisible !== false,
      );
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        getErrorMessage(error, "Unable to load public reviews."),
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  // DOCTOR REVIEWS
  doctorId: null,
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  loading: false,
  error: null,
  requestId: null,

  // PUBLIC HOME PAGE REVIEWS
  publicReviews: [],
  publicLoading: false,
  publicError: null,
  publicLoaded: false,
  publicRequestId: null,
};

// ==========================================
// REVIEW SLICE
// ==========================================

const reviewSlice = createSlice({
  name: "reviews",

  initialState,

  reducers: {
    clearDoctorReviews: (state) => {
      state.doctorId = null;
      state.reviews = [];
      state.averageRating = 0;
      state.totalReviews = 0;
      state.loading = false;
      state.error = null;
      state.requestId = null;
    },

    clearPublicReviews: (state) => {
      state.publicReviews = [];
      state.publicLoading = false;
      state.publicError = null;
      state.publicLoaded = false;
      state.publicRequestId = null;
    },

    clearReviewErrors: (state) => {
      state.error = null;
      state.publicError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ====================================
      // DOCTOR REVIEWS - PENDING
      // ====================================

      .addCase(fetchDoctorReviews.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        state.doctorId = String(action.meta.arg);

        state.requestId = action.meta.requestId;

        state.reviews = [];
        state.averageRating = 0;
        state.totalReviews = 0;
      })

      // ====================================
      // DOCTOR REVIEWS - SUCCESS
      // ====================================

      .addCase(fetchDoctorReviews.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) {
          return;
        }

        const { reviews, averageRating, totalReviews } = action.payload;

        const sum = reviews.reduce(
          (total, review) => total + Number(review.rating || 0),
          0,
        );

        state.reviews = reviews;

        state.averageRating =
          averageRating != null && Number.isFinite(Number(averageRating))
            ? Number(averageRating)
            : reviews.length
              ? sum / reviews.length
              : 0;

        state.totalReviews =
          totalReviews != null && Number.isFinite(Number(totalReviews))
            ? Number(totalReviews)
            : reviews.length;

        state.loading = false;
        state.requestId = null;
      })

      // ====================================
      // DOCTOR REVIEWS - ERROR
      // ====================================

      .addCase(fetchDoctorReviews.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.requestId = null;

        if (!action.meta.aborted) {
          state.error = action.payload || "Failed to load doctor reviews.";
        }
      })

      // ====================================
      // PUBLIC REVIEWS - PENDING
      // ====================================

      .addCase(fetchPublicReviews.pending, (state, action) => {
        state.publicLoading = true;
        state.publicError = null;

        state.publicRequestId = action.meta.requestId;
      })

      // ====================================
      // PUBLIC REVIEWS - SUCCESS
      // ====================================

      .addCase(fetchPublicReviews.fulfilled, (state, action) => {
        if (state.publicRequestId !== action.meta.requestId) {
          return;
        }

        state.publicReviews = action.payload;
        state.publicLoading = false;
        state.publicLoaded = true;
        state.publicError = null;
        state.publicRequestId = null;
      })

      // ====================================
      // PUBLIC REVIEWS - ERROR
      // ====================================

      .addCase(fetchPublicReviews.rejected, (state, action) => {
        if (state.publicRequestId !== action.meta.requestId) {
          return;
        }

        state.publicLoading = false;
        state.publicRequestId = null;

        if (!action.meta.aborted) {
          state.publicError =
            action.payload || "Failed to load public reviews.";
        }
      });
  },
});

// ==========================================
// EXPORT ACTIONS
// ==========================================

export const { clearDoctorReviews, clearPublicReviews, clearReviewErrors } =
  reviewSlice.actions;

// ==========================================
// EXPORT SELECTORS
// ==========================================

export const selectDoctorReviews = (state) => state.reviews.reviews;

export const selectPublicReviews = (state) => state.reviews.publicReviews;

export const selectPublicReviewsLoading = (state) =>
  state.reviews.publicLoading;

export const selectPublicReviewsError = (state) => state.reviews.publicError;

// ==========================================
// EXPORT REDUCER
// ==========================================

export default reviewSlice.reducer;
