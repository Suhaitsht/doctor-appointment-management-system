import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const getConsultationFromResponse = (payload) => {
  if (!payload) return null;

  return (
    payload?.consultation ||
    payload?.data?.consultation ||
    payload?.data ||
    null
  );
};

// ======================================================
// COMPLETE CONSULTATION
//
// POST /api/consultations/:appointmentId/complete
// ======================================================

export const completeConsultation = createAsyncThunk(
  "consultations/completeConsultation",

  async ({ appointmentId, consultationData }, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      if (!consultationData) {
        return rejectWithValue("Consultation data is required.");
      }

      const response = await api.post(
        `/consultations/${appointmentId}/complete`,
        consultationData,
      );

      return response.data;
    } catch (error) {
      console.error(
        "Complete Consultation Error:",
        error?.response?.data || error?.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to complete consultation."),
      );
    }
  },
);

// ======================================================
// FETCH CONSULTATION BY APPOINTMENT
//
// GET /api/consultations/appointment/:appointmentId
// ======================================================

export const fetchConsultationByAppointment = createAsyncThunk(
  "consultations/fetchConsultationByAppointment",

  async (appointmentId, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const response = await api.get(
        `/consultations/appointment/${appointmentId}`,
      );

      return response.data;
    } catch (error) {
      console.error(
        "Fetch Consultation Error:",
        error?.response?.data || error?.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load consultation record."),
      );
    }
  },
);

// ======================================================
// FETCH LOGGED-IN PATIENT MEDICAL RECORDS
//
// GET /api/consultations/patient/me
// ======================================================

export const fetchPatientConsultations = createAsyncThunk(
  "consultations/fetchPatientConsultations",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/consultations/patient/me");

      return {
        consultations: Array.isArray(response.data?.consultations)
          ? response.data.consultations
          : [],

        total: Number(response.data?.total) || 0,
      };
    } catch (error) {
      console.error(
        "Fetch Patient Consultations Error:",
        error?.response?.data || error?.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load medical records."),
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  // Single consultation
  consultation: null,

  consultationLoading: false,
  consultationError: null,
  consultationFetchSuccess: false,

  // Complete consultation
  completingConsultation: false,
  completeConsultationError: null,
  completeConsultationSuccess: false,

  // Patient medical history
  patientConsultations: [],
  patientConsultationsTotal: 0,
  patientConsultationsLoading: false,
  patientConsultationsError: null,
};

// ======================================================
// SLICE
// ======================================================

const consultationSlice = createSlice({
  name: "consultations",

  initialState,

  reducers: {
    // ==================================================
    // CLEAR COMPLETE CONSULTATION ERROR
    // ==================================================

    clearCompleteConsultationError: (state) => {
      state.completeConsultationError = null;
    },

    // ==================================================
    // CLEAR CONSULTATION ERROR
    // ==================================================

    clearConsultationError: (state) => {
      state.consultationError = null;
    },

    // ==================================================
    // CLEAR CONSULTATION RECORD
    // ==================================================

    clearConsultationRecord: (state) => {
      state.consultation = null;
      state.consultationLoading = false;
      state.consultationError = null;
      state.consultationFetchSuccess = false;
    },

    // ==================================================
    // RESET COMPLETE CONSULTATION
    // ==================================================

    resetCompleteConsultation: (state) => {
      state.completingConsultation = false;
      state.completeConsultationError = null;
      state.completeConsultationSuccess = false;
    },

    // ==================================================
    // RESET CONSULTATION FETCH
    // ==================================================

    resetConsultationFetch: (state) => {
      state.consultationLoading = false;
      state.consultationError = null;
      state.consultationFetchSuccess = false;
    },

    // ==================================================
    // CLEAR PATIENT CONSULTATIONS
    // ==================================================

    clearPatientConsultations: (state) => {
      state.patientConsultations = [];
      state.patientConsultationsTotal = 0;
      state.patientConsultationsLoading = false;
      state.patientConsultationsError = null;
    },

    // ==================================================
    // RESET EVERYTHING
    // ==================================================

    resetConsultation: (state) => {
      state.consultation = null;

      state.consultationLoading = false;
      state.consultationError = null;
      state.consultationFetchSuccess = false;

      state.completingConsultation = false;
      state.completeConsultationError = null;
      state.completeConsultationSuccess = false;

      state.patientConsultations = [];
      state.patientConsultationsTotal = 0;
      state.patientConsultationsLoading = false;
      state.patientConsultationsError = null;
    },
  },

  // ====================================================
  // EXTRA REDUCERS
  // ====================================================

  extraReducers: (builder) => {
    builder

      // ==================================================
      // COMPLETE CONSULTATION
      // ==================================================

      .addCase(completeConsultation.pending, (state) => {
        state.completingConsultation = true;
        state.completeConsultationError = null;
        state.completeConsultationSuccess = false;
      })

      .addCase(completeConsultation.fulfilled, (state, action) => {
        state.completingConsultation = false;
        state.completeConsultationError = null;
        state.completeConsultationSuccess = true;

        const consultation = getConsultationFromResponse(action.payload);

        if (consultation) {
          state.consultation = consultation;
        }
      })

      .addCase(completeConsultation.rejected, (state, action) => {
        state.completingConsultation = false;
        state.completeConsultationSuccess = false;

        state.completeConsultationError =
          typeof action.payload === "string"
            ? action.payload
            : action.error?.message || "Unable to complete consultation.";
      })

      // ==================================================
      // FETCH SINGLE CONSULTATION
      // ==================================================

      .addCase(fetchConsultationByAppointment.pending, (state) => {
        state.consultationLoading = true;
        state.consultationError = null;
        state.consultationFetchSuccess = false;

        // Prevent old record flashing while loading another one
        state.consultation = null;
      })

      .addCase(fetchConsultationByAppointment.fulfilled, (state, action) => {
        state.consultationLoading = false;
        state.consultationError = null;

        const consultation = getConsultationFromResponse(action.payload);

        state.consultation = consultation;
        state.consultationFetchSuccess = Boolean(consultation);
      })

      .addCase(fetchConsultationByAppointment.rejected, (state, action) => {
        state.consultationLoading = false;
        state.consultationFetchSuccess = false;
        state.consultation = null;

        state.consultationError =
          typeof action.payload === "string"
            ? action.payload
            : action.error?.message || "Unable to load consultation record.";
      })

      // ==================================================
      // FETCH PATIENT MEDICAL RECORDS
      // ==================================================

      .addCase(fetchPatientConsultations.pending, (state) => {
        state.patientConsultationsLoading = true;
        state.patientConsultationsError = null;
      })

      .addCase(fetchPatientConsultations.fulfilled, (state, action) => {
        state.patientConsultationsLoading = false;
        state.patientConsultationsError = null;

        state.patientConsultations = action.payload.consultations;
        state.patientConsultationsTotal = action.payload.total;
      })

      .addCase(fetchPatientConsultations.rejected, (state, action) => {
        state.patientConsultationsLoading = false;

        state.patientConsultationsError =
          typeof action.payload === "string"
            ? action.payload
            : action.error?.message || "Unable to load medical records.";
      });
  },
});

// ======================================================
// ACTIONS
// ======================================================

export const {
  clearCompleteConsultationError,
  clearConsultationError,
  clearConsultationRecord,
  clearPatientConsultations,
  resetCompleteConsultation,
  resetConsultationFetch,
  resetConsultation,
} = consultationSlice.actions;

// ======================================================
// SINGLE CONSULTATION SELECTORS
// ======================================================

export const selectConsultation = (state) =>
  state.consultations?.consultation ?? null;

export const selectConsultationLoading = (state) =>
  state.consultations?.consultationLoading ?? false;

export const selectConsultationError = (state) =>
  state.consultations?.consultationError ?? null;

export const selectConsultationFetchSuccess = (state) =>
  state.consultations?.consultationFetchSuccess ?? false;

// ======================================================
// COMPLETE CONSULTATION SELECTORS
// ======================================================

export const selectCompletingConsultation = (state) =>
  state.consultations?.completingConsultation ?? false;

export const selectCompleteConsultationError = (state) =>
  state.consultations?.completeConsultationError ?? null;

export const selectCompleteConsultationSuccess = (state) =>
  state.consultations?.completeConsultationSuccess ?? false;

// ======================================================
// PATIENT MEDICAL RECORD SELECTORS
// ======================================================

export const selectPatientConsultations = (state) =>
  state.consultations?.patientConsultations ?? [];

export const selectPatientConsultationsTotal = (state) =>
  state.consultations?.patientConsultationsTotal ?? 0;

export const selectPatientConsultationsLoading = (state) =>
  state.consultations?.patientConsultationsLoading ?? false;

export const selectPatientConsultationsError = (state) =>
  state.consultations?.patientConsultationsError ?? null;

// ======================================================
// DERIVED CONSULTATION SELECTORS
// ======================================================

export const selectConsultationPatient = (state) =>
  state.consultations?.consultation?.patient ?? null;

export const selectConsultationDoctor = (state) =>
  state.consultations?.consultation?.doctor ?? null;

export const selectConsultationAppointment = (state) =>
  state.consultations?.consultation?.appointment ?? null;

export const selectConsultationVitals = (state) =>
  state.consultations?.consultation?.vitals ?? {};

export const selectConsultationDiagnosis = (state) =>
  state.consultations?.consultation?.diagnosis ?? {};

export const selectConsultationMedications = (state) =>
  state.consultations?.consultation?.medications ?? [];

export const selectConsultationLabTests = (state) =>
  state.consultations?.consultation?.laboratoryTests ?? [];

export const selectConsultationComplaints = (state) =>
  state.consultations?.consultation?.complaints ?? [];

export const selectConsultationClinicalTags = (state) =>
  state.consultations?.consultation?.clinicalTags ?? [];

export const selectConsultationStatus = (state) =>
  state.consultations?.consultation?.status ?? null;

// ======================================================
// REDUCER
// ======================================================

export default consultationSlice.reducer;
