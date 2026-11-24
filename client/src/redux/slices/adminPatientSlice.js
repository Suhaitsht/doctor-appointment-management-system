import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ==========================================
// ERROR HELPER
// ==========================================

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

// ==========================================
// FORM DATA HELPER
// USED BY CREATE AND UPDATE
// ==========================================

const buildPatientFormData = (values) => {
  const formData = new FormData();

  const allowedFields = [
    "name",
    "email",
    "phone",
    "password",
    "firstName",
    "lastName",
    "dateOfBirth",

    // IMPORTANT: GENDER FIX
    "gender",

    "bloodGroup",
    "address",
    "isActive",
  ];

  for (const field of allowedFields) {
    const value = values[field];

    // Skip missing values
    if (value === undefined || value === null) {
      continue;
    }

    // Don't update password if empty
    if (field === "password" && value === "") {
      continue;
    }

    // Backend accepts address as JSON or string
    if (field === "address") {
      formData.append(
        "address",
        typeof value === "string" ? value : JSON.stringify(value),
      );

      continue;
    }

    // Convert values to strings for multipart/form-data
    formData.append(field, String(value));
  }

  // Backend Multer expects field name "image"
  const imageFile = values.imageFile || values.image;

  if (typeof File !== "undefined" && imageFile instanceof File) {
    formData.append("image", imageFile);
  }

  return formData;
};

// ==========================================
// FETCH ALL PATIENTS
// ==========================================

export const fetchAdminPatients = createAsyncThunk(
  "adminPatients/fetchAll",

  async (
    { page = 1, limit = 10, search = "", status = "all" } = {},
    { rejectWithValue, signal },
  ) => {
    try {
      const params = { page, limit };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status !== "all") {
        params.status = status;
      }

      const response = await api.get("/admin/patients", {
        params,
        signal,
      });

      return response.data;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        getErrorMessage(error, "Unable to load patients."),
      );
    }
  },
);

// ==========================================
// FETCH SINGLE PATIENT
// ==========================================

export const fetchAdminPatientById = createAsyncThunk(
  "adminPatients/fetchById",

  async (patientId, { rejectWithValue, signal }) => {
    try {
      const response = await api.get(`/admin/patients/${patientId}`, {
        signal,
      });

      return response.data.patient;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        getErrorMessage(error, "Unable to load patient profile."),
      );
    }
  },
);

// ==========================================
// CREATE PATIENT
// POST /api/admin/patients
// ==========================================

export const createAdminPatient = createAsyncThunk(
  "adminPatients/create",

  async (patientData, { rejectWithValue }) => {
    try {
      const formData = buildPatientFormData(patientData);

      const response = await api.post("/admin/patients", formData);

      return response.data.patient;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to create patient."),
      );
    }
  },
);

// ==========================================
// UPDATE PATIENT
// ==========================================

export const updateAdminPatient = createAsyncThunk(
  "adminPatients/update",

  async ({ patientId, patientData }, { rejectWithValue }) => {
    try {
      const formData = buildPatientFormData(patientData);

      // Keep PATCH if backend route uses router.patch().
      // Change to api.put() if route uses router.put().
      const response = await api.patch(
        `/admin/patients/${patientId}`,
        formData,
      );

      return response.data.patient;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to update patient."),
      );
    }
  },
);

// ==========================================
// DELETE PATIENT
// ==========================================

export const deleteAdminPatient = createAsyncThunk(
  "adminPatients/delete",

  async (patientId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/patients/${patientId}`);

      return response.data.deletedPatientId || patientId;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to delete patient."),
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  patients: [],
  loading: false,
  error: null,

  totalPatients: 0,

  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  currentRequestId: null,

  selectedPatient: null,
  profileLoading: false,
  profileError: null,
  currentProfileRequestId: null,

  // CRUD states
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,

  mutationError: null,
  mutationSuccess: null,
};

// ==========================================
// REDUX SLICE
// ==========================================

const adminPatientSlice = createSlice({
  name: "adminPatients",

  initialState,

  reducers: {
    clearAdminPatientError: (state) => {
      state.error = null;
    },

    clearSelectedAdminPatient: (state) => {
      state.selectedPatient = null;
      state.profileError = null;
      state.profileLoading = false;
      state.currentProfileRequestId = null;
    },

    clearAdminPatientMutation: (state) => {
      state.mutationError = null;
      state.mutationSuccess = null;
    },

    resetAdminPatients: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      // ====================================
      // FETCH ALL
      // ====================================

      .addCase(fetchAdminPatients.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })

      .addCase(fetchAdminPatients.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        const data = action.payload || {};

        state.loading = false;
        state.currentRequestId = null;

        state.patients = Array.isArray(data.patients) ? data.patients : [];

        state.totalPatients = Number(data.totalPatients) || 0;

        state.pagination = {
          currentPage: Number(data.pagination?.currentPage) || 1,

          totalPages: Number(data.pagination?.totalPages) || 1,

          limit: Number(data.pagination?.limit) || 10,

          hasNextPage: Boolean(data.pagination?.hasNextPage),

          hasPreviousPage: Boolean(data.pagination?.hasPreviousPage),
        };
      })

      .addCase(fetchAdminPatients.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;

        if (action.meta.aborted) {
          return;
        }

        state.error = action.payload || "Unable to load patients.";

        state.patients = [];
        state.totalPatients = 0;
      })

      // ====================================
      // FETCH SINGLE PATIENT
      // ====================================

      .addCase(fetchAdminPatientById.pending, (state, action) => {
        state.profileLoading = true;
        state.profileError = null;
        state.selectedPatient = null;
        state.currentProfileRequestId = action.meta.requestId;
      })

      .addCase(fetchAdminPatientById.fulfilled, (state, action) => {
        if (state.currentProfileRequestId !== action.meta.requestId) {
          return;
        }

        state.profileLoading = false;
        state.currentProfileRequestId = null;
        state.selectedPatient = action.payload;
      })

      .addCase(fetchAdminPatientById.rejected, (state, action) => {
        if (state.currentProfileRequestId !== action.meta.requestId) {
          return;
        }

        state.profileLoading = false;
        state.currentProfileRequestId = null;

        if (action.meta.aborted) {
          return;
        }

        state.profileError =
          action.payload || "Unable to load patient profile.";
      })

      // ====================================
      // CREATE PATIENT
      // ====================================

      .addCase(createAdminPatient.pending, (state) => {
        state.createLoading = true;
        state.mutationError = null;
        state.mutationSuccess = null;
      })

      .addCase(createAdminPatient.fulfilled, (state) => {
        state.createLoading = false;
        state.mutationSuccess = "Patient created successfully.";
      })

      .addCase(createAdminPatient.rejected, (state, action) => {
        state.createLoading = false;
        state.mutationError = action.payload || "Unable to create patient.";
      })

      // ====================================
      // UPDATE PATIENT
      // ====================================

      .addCase(updateAdminPatient.pending, (state) => {
        state.updateLoading = true;
        state.mutationError = null;
        state.mutationSuccess = null;
      })

      .addCase(updateAdminPatient.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.mutationSuccess = "Patient updated successfully.";

        const updatedPatient = action.payload;

        if (!updatedPatient?._id) {
          return;
        }

        const index = state.patients.findIndex(
          (patient) => patient._id === updatedPatient._id,
        );

        if (index !== -1) {
          state.patients[index] = updatedPatient;
        }

        if (state.selectedPatient?._id === updatedPatient._id) {
          state.selectedPatient = updatedPatient;
        }
      })

      .addCase(updateAdminPatient.rejected, (state, action) => {
        state.updateLoading = false;
        state.mutationError = action.payload || "Unable to update patient.";
      })

      // ====================================
      // DELETE PATIENT
      // ====================================

      .addCase(deleteAdminPatient.pending, (state) => {
        state.deleteLoading = true;
        state.mutationError = null;
        state.mutationSuccess = null;
      })

      .addCase(deleteAdminPatient.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.mutationSuccess = "Patient deleted successfully.";

        const deletedId = String(action.payload);

        state.patients = state.patients.filter(
          (patient) => String(patient._id) !== deletedId,
        );

        if (String(state.selectedPatient?._id) === deletedId) {
          state.selectedPatient = null;
        }

        state.totalPatients = Math.max(0, state.totalPatients - 1);
      })

      .addCase(deleteAdminPatient.rejected, (state, action) => {
        state.deleteLoading = false;
        state.mutationError = action.payload || "Unable to delete patient.";
      });
  },
});

// ==========================================
// ACTIONS
// ==========================================

export const {
  clearAdminPatientError,
  clearSelectedAdminPatient,
  clearAdminPatientMutation,
  resetAdminPatients,
} = adminPatientSlice.actions;

// ==========================================
// SELECTORS
// ==========================================

export const selectAdminPatients = (state) => state.adminPatients.patients;

export const selectAdminPatientsLoading = (state) =>
  state.adminPatients.loading;

export const selectAdminPatientsError = (state) => state.adminPatients.error;

export const selectAdminPatientsTotal = (state) =>
  state.adminPatients.totalPatients;

export const selectAdminPatientsPagination = (state) =>
  state.adminPatients.pagination;

export const selectAdminSelectedPatient = (state) =>
  state.adminPatients.selectedPatient;

export const selectAdminPatientProfileLoading = (state) =>
  state.adminPatients.profileLoading;

export const selectAdminPatientProfileError = (state) =>
  state.adminPatients.profileError;

export const selectAdminPatientCreateLoading = (state) =>
  state.adminPatients.createLoading;

export const selectAdminPatientUpdateLoading = (state) =>
  state.adminPatients.updateLoading;

export const selectAdminPatientDeleteLoading = (state) =>
  state.adminPatients.deleteLoading;

export const selectAdminPatientMutationError = (state) =>
  state.adminPatients.mutationError;

export const selectAdminPatientMutationSuccess = (state) =>
  state.adminPatients.mutationSuccess;

// ==========================================
// REDUCER
// ==========================================

export default adminPatientSlice.reducer;
