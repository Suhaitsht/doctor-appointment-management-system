import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const getToken = (state) =>
  state.auth?.token || state.auth?.user?.token || localStorage.getItem("token");

const getError = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";

export const fetchAdminReviews = createAsyncThunk(
  "adminReviews/fetch",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState());

      const response = await axios.get(`${API_URL}/reviews/admin/all`, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search ?? "",
          rating: params.rating ?? "all",
          status: params.status ?? "all",
          sort: params.sort ?? "newest",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  },
);

export const updateAdminReviewVisibility = createAsyncThunk(
  "adminReviews/updateVisibility",
  async ({ reviewId, isVisible }, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState());

      const response = await axios.patch(
        `${API_URL}/reviews/admin/${reviewId}/visibility`,
        { isVisible },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.review;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  },
);

const initialState = {
  reviews: [],
  loading: false,
  updatingId: null,
  error: null,
  actionError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: {
    total: 0,
    visible: 0,
    hidden: 0,
    average: 0,
  },
  currentRequestId: null,
};

const adminReviewSlice = createSlice({
  name: "adminReviews",
  initialState,
  reducers: {
    clearAdminReviewError(state) {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminReviews.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;
        state.reviews = action.payload.reviews || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.stats = action.payload.stats || initialState.stats;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;
        state.error = action.payload || "Failed to load reviews.";
      })
      .addCase(updateAdminReviewVisibility.pending, (state, action) => {
        state.updatingId = action.meta.arg.reviewId;
        state.actionError = null;
      })
      .addCase(updateAdminReviewVisibility.fulfilled, (state, action) => {
        state.updatingId = null;

        const updated = action.payload;
        if (!updated?._id) return;

        const review = state.reviews.find((item) => item._id === updated._id);

        if (review) {
          review.isVisible = updated.isVisible;
        }
      })
      .addCase(updateAdminReviewVisibility.rejected, (state, action) => {
        state.updatingId = null;
        state.actionError = action.payload || "Unable to update review.";
      });
  },
});

export const { clearAdminReviewError } = adminReviewSlice.actions;

export default adminReviewSlice.reducer;
