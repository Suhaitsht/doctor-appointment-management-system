import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../../api/axios";

// ======================================================
// HELPER - GET ERROR MESSAGE
// ======================================================

const getErrorMessage = (error, fallback = "Something went wrong") => {
  return error?.response?.data?.message || error?.message || fallback;
};

// ======================================================
// HELPER - BUILD FORMDATA
// ======================================================

const buildSpecialityFormData = (specialityData) => {
  const formData = new FormData();

  // Speciality name
  if (specialityData.name !== undefined) {
    formData.append("name", specialityData.name);
  }

  // Status
  if (specialityData.isActive !== undefined) {
    formData.append("isActive", String(specialityData.isActive));
  }

  // IMPORTANT:
  // Only append image when it is
  // an actual File object.
  if (typeof File !== "undefined" && specialityData.image instanceof File) {
    formData.append("image", specialityData.image);
  }

  return formData;
};

// ======================================================
// GET ALL SPECIALITIES
// ADMIN
// GET /api/specialities
// ======================================================

export const fetchSpecialities = createAsyncThunk(
  "specialities/fetchSpecialities",

  async (_, thunkAPI) => {
    try {
      const response = await api.get("/specialities");

      return response.data?.specialities || [];
    } catch (error) {
      console.error("FETCH SPECIALITIES ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch specialities"),
      );
    }
  },
);

// ======================================================
// GET PUBLIC SPECIALITIES
// GET /api/specialities/public
// ======================================================

export const fetchPublicSpecialities = createAsyncThunk(
  "specialities/fetchPublicSpecialities",

  async (_, thunkAPI) => {
    try {
      const response = await api.get("/specialities/public");

      return response.data?.specialities || [];
    } catch (error) {
      console.error("FETCH PUBLIC SPECIALITIES ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch public specialities"),
      );
    }
  },
);

// ======================================================
// GET SINGLE SPECIALITY
// ADMIN
// GET /api/specialities/:id
// ======================================================

export const fetchSpecialityById = createAsyncThunk(
  "specialities/fetchSpecialityById",

  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/specialities/${id}`);

      return response.data?.speciality || null;
    } catch (error) {
      console.error("FETCH SPECIALITY ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to fetch speciality"),
      );
    }
  },
);

// ======================================================
// CREATE SPECIALITY
// ADMIN
// POST /api/specialities
// ======================================================

export const createSpeciality = createAsyncThunk(
  "specialities/createSpeciality",

  async (specialityData, thunkAPI) => {
    try {
      const formData = buildSpecialityFormData(specialityData);

      // Debug
      console.log("CREATE SPECIALITY DATA:", specialityData);

      for (const [key, value] of formData.entries()) {
        console.log("FORM DATA:", key, value);
      }

      const response = await api.post("/specialities", formData);

      return response.data?.speciality;
    } catch (error) {
      console.error("CREATE SPECIALITY ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to create speciality"),
      );
    }
  },
);

// ======================================================
// UPDATE SPECIALITY
// ADMIN
// PUT /api/specialities/:id
// ======================================================

export const updateSpeciality = createAsyncThunk(
  "specialities/updateSpeciality",

  async ({ id, specialityData }, thunkAPI) => {
    try {
      const formData = buildSpecialityFormData(specialityData);

      console.log("UPDATE SPECIALITY:", id, specialityData);

      const response = await api.put(`/specialities/${id}`, formData);

      return response.data?.speciality;
    } catch (error) {
      console.error("UPDATE SPECIALITY ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to update speciality"),
      );
    }
  },
);

// ======================================================
// DELETE SPECIALITY
// ADMIN
// DELETE /api/specialities/:id
// ======================================================

export const deleteSpeciality = createAsyncThunk(
  "specialities/deleteSpeciality",

  async (id, thunkAPI) => {
    try {
      await api.delete(`/specialities/${id}`);

      return id;
    } catch (error) {
      console.error("DELETE SPECIALITY ERROR:", error);

      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Failed to delete speciality"),
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  // Admin speciality list
  specialities: [],

  // Public speciality list
  publicSpecialities: [],

  // Single selected speciality
  speciality: null,

  // Loading states
  loading: false,
  creating: false,
  updating: false,
  deleting: false,

  // Error
  error: null,
};

// ======================================================
// SLICE
// ======================================================

const specialitySlice = createSlice({
  name: "specialities",

  initialState,

  reducers: {
    // -----------------------------------------------
    // CLEAR ERROR
    // -----------------------------------------------

    clearSpecialityError: (state) => {
      state.error = null;
    },

    // -----------------------------------------------
    // CLEAR SELECTED SPECIALITY
    // -----------------------------------------------

    clearSelectedSpeciality: (state) => {
      state.speciality = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // FETCH ALL
      // ==================================================

      .addCase(fetchSpecialities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchSpecialities.fulfilled, (state, action) => {
        state.loading = false;

        state.specialities = action.payload;

        state.error = null;
      })

      .addCase(fetchSpecialities.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to fetch specialities";
      })

      // ==================================================
      // FETCH PUBLIC
      // ==================================================

      .addCase(fetchPublicSpecialities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPublicSpecialities.fulfilled, (state, action) => {
        state.loading = false;

        state.publicSpecialities = action.payload;

        state.error = null;
      })

      .addCase(fetchPublicSpecialities.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to fetch public specialities";
      })

      // ==================================================
      // FETCH SINGLE
      // ==================================================

      .addCase(fetchSpecialityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchSpecialityById.fulfilled, (state, action) => {
        state.loading = false;

        state.speciality = action.payload;

        state.error = null;
      })

      .addCase(fetchSpecialityById.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Failed to fetch speciality";
      })

      // ==================================================
      // CREATE
      // ==================================================

      .addCase(createSpeciality.pending, (state) => {
        state.creating = true;
        state.error = null;
      })

      .addCase(createSpeciality.fulfilled, (state, action) => {
        state.creating = false;

        if (action.payload) {
          // Add new speciality
          // to beginning of table
          state.specialities.unshift(action.payload);
        }

        state.error = null;
      })

      .addCase(createSpeciality.rejected, (state, action) => {
        state.creating = false;

        state.error = action.payload || "Failed to create speciality";
      })

      // ==================================================
      // UPDATE
      // ==================================================

      .addCase(updateSpeciality.pending, (state) => {
        state.updating = true;
        state.error = null;
      })

      .addCase(updateSpeciality.fulfilled, (state, action) => {
        state.updating = false;

        const updatedSpeciality = action.payload;

        if (updatedSpeciality) {
          const index = state.specialities.findIndex(
            (speciality) => speciality._id === updatedSpeciality._id,
          );

          if (index !== -1) {
            state.specialities[index] = updatedSpeciality;
          }

          // Update selected speciality too
          if (state.speciality?._id === updatedSpeciality._id) {
            state.speciality = updatedSpeciality;
          }
        }

        state.error = null;
      })

      .addCase(updateSpeciality.rejected, (state, action) => {
        state.updating = false;

        state.error = action.payload || "Failed to update speciality";
      })

      // ==================================================
      // DELETE
      // ==================================================

      .addCase(deleteSpeciality.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deleteSpeciality.fulfilled, (state, action) => {
        state.deleting = false;

        const deletedId = action.payload;

        state.specialities = state.specialities.filter(
          (speciality) => speciality._id !== deletedId,
        );

        // Clear selected speciality
        // if it was deleted

        if (state.speciality?._id === deletedId) {
          state.speciality = null;
        }

        state.error = null;
      })

      .addCase(deleteSpeciality.rejected, (state, action) => {
        state.deleting = false;

        state.error = action.payload || "Failed to delete speciality";
      });
  },
});

// ======================================================
// EXPORT ACTIONS
// ======================================================

export const { clearSpecialityError, clearSelectedSpeciality } =
  specialitySlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default specialitySlice.reducer;
