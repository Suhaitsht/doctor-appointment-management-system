import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/api/axios";

// ==========================================
// FETCH PUBLIC SPECIALITIES
// ==========================================

export const fetchHomeSpecialities = createAsyncThunk(
  "homeSpecialities/fetchPublic",
  async (_, { rejectWithValue, signal }) => {
    try {
      const response = await api.get("/specialities/public", {
        signal,
      });

      console.log("HOME SPECIALITIES API:", response.data);

      const data = response.data?.specialities;

      if (!Array.isArray(data)) {
        return rejectWithValue("Invalid speciality API response format");
      }

      return data;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load specialities",
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  specialities: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// ==========================================
// SLICE
// ==========================================

const homeSpecialitySlice = createSlice({
  name: "homeSpecialities",
  initialState,

  reducers: {
    clearHomeSpecialityError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeSpecialities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchHomeSpecialities.fulfilled, (state, action) => {
        state.loading = false;
        state.specialities = action.payload;
        state.lastFetched = Date.now();
      })

      .addCase(fetchHomeSpecialities.rejected, (state, action) => {
        state.loading = false;

        if (!action.meta.aborted) {
          state.error = action.payload || "Failed to load specialities";
        }
      });
  },
});

export const { clearHomeSpecialityError } = homeSpecialitySlice.actions;

export default homeSpecialitySlice.reducer;
