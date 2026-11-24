import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export const fetchFeaturedDoctors = createAsyncThunk(
  "featuredDoctors/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/doctors/public`);

      return response.data.doctors || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch doctors",
      );
    }
  },
);

const featuredDoctorsSlice = createSlice({
  name: "featuredDoctors",

  initialState: {
    doctors: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchFeaturedDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default featuredDoctorsSlice.reducer;
