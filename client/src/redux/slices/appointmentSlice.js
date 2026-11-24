import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ======================================================
// ERROR HELPER
// ======================================================

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

// ======================================================
// UPDATE APPOINTMENT HELPER
// ======================================================

const updateAppointmentEverywhere = (state, updatedAppointment) => {
  if (!updatedAppointment?._id) return;

  const appointmentId = String(updatedAppointment._id);

  // Patient appointments
  const patientIndex = state.myAppointments.findIndex(
    (item) => String(item?._id || "") === appointmentId,
  );

  if (patientIndex !== -1) {
    state.myAppointments[patientIndex] = {
      ...state.myAppointments[patientIndex],
      ...updatedAppointment,
    };
  }

  // Doctor appointments
  const doctorIndex = state.doctorAppointments.findIndex(
    (item) => String(item?._id || "") === appointmentId,
  );

  if (doctorIndex !== -1) {
    state.doctorAppointments[doctorIndex] = {
      ...state.doctorAppointments[doctorIndex],
      ...updatedAppointment,
    };
  }

  // Selected appointment
  if (String(state.selectedAppointment?._id || "") === appointmentId) {
    state.selectedAppointment = {
      ...state.selectedAppointment,
      ...updatedAppointment,
    };
  }

  // Current appointment
  if (String(state.appointment?._id || "") === appointmentId) {
    state.appointment = {
      ...state.appointment,
      ...updatedAppointment,
    };
  }

  // Payment verification appointment
  if (
    String(state.paymentVerification?.appointment?._id || "") === appointmentId
  ) {
    state.paymentVerification = {
      ...state.paymentVerification,

      appointment: {
        ...state.paymentVerification.appointment,
        ...updatedAppointment,
      },
    };
  }
};

// ======================================================
// GET AVAILABLE DOCTOR SLOTS
// ======================================================

export const fetchAvailableSlots = createAsyncThunk(
  "appointments/fetchAvailableSlots",

  async ({ doctorId, date }, { rejectWithValue }) => {
    try {
      if (!doctorId) {
        return rejectWithValue("Doctor ID is required.");
      }

      if (!date) {
        return rejectWithValue("Appointment date is required.");
      }

      const response = await api.get(`/appointments/doctor/${doctorId}/slots`, {
        params: {
          date,
        },
      });

      return response.data?.slots || [];
    } catch (error) {
      console.error(
        "Fetch Slots Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load available slots."),
      );
    }
  },
);

// ======================================================
// CREATE APPOINTMENT
// ======================================================

export const createAppointment = createAsyncThunk(
  "appointments/createAppointment",

  async (appointmentData, { rejectWithValue }) => {
    try {
      if (!appointmentData) {
        return rejectWithValue("Appointment data is required.");
      }

      const response = await api.post("/appointments", appointmentData);

      return response.data;
    } catch (error) {
      console.error(
        "Create Appointment Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to create appointment."),
      );
    }
  },
);

// ======================================================
// INITIALIZE PAYHERE PAYMENT
// ======================================================

export const initializePayment = createAsyncThunk(
  "appointments/initializePayment",

  async (appointmentId, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const response = await api.post("/payments/initialize", {
        appointmentId,
      });

      return response.data;
    } catch (error) {
      console.error(
        "Initialize Payment Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to initialize payment."),
      );
    }
  },
);

// ======================================================
// VERIFY PAYMENT STATUS
// ======================================================

export const verifyPaymentStatus = createAsyncThunk(
  "appointments/verifyPaymentStatus",

  async (orderId, { rejectWithValue }) => {
    try {
      if (!orderId) {
        return rejectWithValue("Order ID is required.");
      }

      const response = await api.get(
        `/payments/status/${encodeURIComponent(orderId)}`,
      );

      return response.data;
    } catch (error) {
      console.error(
        "Verify Payment Status Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to verify payment status."),
      );
    }
  },
);

// ======================================================
// GET LOGGED-IN PATIENT APPOINTMENTS
// ======================================================

export const fetchMyAppointments = createAsyncThunk(
  "appointments/fetchMyAppointments",

  async (
    { page = 1, limit = 20, status = "", paymentStatus = "" } = {},
    { rejectWithValue },
  ) => {
    try {
      const params = {
        page,
        limit,
      };

      if (status) {
        params.status = status;
      }

      if (paymentStatus) {
        params.paymentStatus = paymentStatus;
      }

      const response = await api.get("/appointments/my-appointments", {
        params,
      });

      return response.data;
    } catch (error) {
      console.error(
        "Fetch My Appointments Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load your appointments."),
      );
    }
  },
);

// ======================================================
// GET PATIENT DASHBOARD STATS
// GET /api/appointments/patient/dashboard-stats
// ======================================================

export const fetchPatientDashboardStats = createAsyncThunk(
  "appointments/fetchPatientDashboardStats",

  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/appointments/patient/dashboard-stats");

      return (
        response.data?.stats || {
          totalAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
        }
      );
    } catch (error) {
      console.error(
        "Fetch Patient Dashboard Stats Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load dashboard statistics."),
      );
    }
  },
);

// ======================================================
// GET SINGLE APPOINTMENT
// GET /api/appointments/:appointmentId
// ======================================================

export const fetchAppointmentById = createAsyncThunk(
  "appointments/fetchAppointmentById",

  async (appointmentId, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const response = await api.get(`/appointments/${appointmentId}`);

      return response.data?.appointment || null;
    } catch (error) {
      console.error(
        "Fetch Appointment By ID Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load appointment details."),
      );
    }
  },
);

// ======================================================
// CANCEL PATIENT APPOINTMENT
// ======================================================

export const cancelAppointment = createAsyncThunk(
  "appointments/cancelAppointment",

  async ({ appointmentId, reason }, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const cleanReason = typeof reason === "string" ? reason.trim() : "";

      if (!cleanReason) {
        return rejectWithValue("Cancellation reason is required.");
      }

      const response = await api.put(`/appointments/${appointmentId}/cancel`, {
        reason: cleanReason,
      });

      return response.data;
    } catch (error) {
      console.error(
        "Cancel Appointment Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to cancel appointment."),
      );
    }
  },
);

// ======================================================
// GET LOGGED-IN DOCTOR APPOINTMENTS
// ======================================================

export const fetchDoctorAppointments = createAsyncThunk(
  "appointments/fetchDoctorAppointments",

  async (
    {
      page = 1,
      limit = 20,
      status = "",
      paymentStatus = "",
      doctorStatus = "",
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const params = {
        page,
        limit,
      };

      if (status) {
        params.status = status;
      }

      if (paymentStatus) {
        params.paymentStatus = paymentStatus;
      }

      if (doctorStatus) {
        params.doctorStatus = doctorStatus;
      }

      const response = await api.get("/appointments/doctor/my-appointments", {
        params,
      });

      return response.data;
    } catch (error) {
      console.error(
        "Fetch Doctor Appointments Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to load doctor appointments."),
      );
    }
  },
);

// ======================================================
// ACCEPT DOCTOR APPOINTMENT
// ======================================================

export const acceptDoctorAppointment = createAsyncThunk(
  "appointments/acceptDoctorAppointment",

  async (appointmentId, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const response = await api.put(`/appointments/${appointmentId}/accept`);

      return response.data;
    } catch (error) {
      console.error(
        "Accept Appointment Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to accept appointment."),
      );
    }
  },
);

// ======================================================
// REJECT DOCTOR APPOINTMENT
// ======================================================

export const rejectDoctorAppointment = createAsyncThunk(
  "appointments/rejectDoctorAppointment",

  async ({ appointmentId, reason }, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue("Appointment ID is required.");
      }

      const cleanReason = typeof reason === "string" ? reason.trim() : "";

      if (!cleanReason) {
        return rejectWithValue("Rejection reason is required.");
      }

      const response = await api.put(`/appointments/${appointmentId}/reject`, {
        reason: cleanReason,
      });

      return response.data;
    } catch (error) {
      console.error(
        "Reject Appointment Error:",
        error.response?.data || error.message,
      );

      return rejectWithValue(
        getErrorMessage(error, "Unable to reject appointment."),
      );
    }
  },
);

// ======================================================
// COMPLETE CONSULTATION
// ======================================================

export const completeConsultation = createAsyncThunk(
  "appointments/completeConsultation",

  async ({ appointmentId, consultationData }, { rejectWithValue }) => {
    try {
      if (!appointmentId) {
        return rejectWithValue({
          message: "Appointment ID is required.",
        });
      }

      console.log("Completing consultation:", {
        appointmentId,
        consultationData,
      });

      const response = await api.post(
        `/consultations/${appointmentId}`,
        consultationData,
      );

      console.log("Consultation response:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Complete Consultation Error:",
        error.response?.data || error,
      );

      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to complete consultation.",
        },
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  // Available slots
  availableSlots: [],
  slotsLoading: false,
  slotsError: null,

  // Create appointment
  appointment: null,
  appointmentId: null,
  creatingAppointment: false,
  createAppointmentError: null,
  appointmentSuccess: false,

  // Payment
  paymentData: null,
  paymentLoading: false,
  paymentError: null,
  paymentInitialized: false,

  // Payment verification
  paymentVerification: null,
  verifyingPayment: false,
  paymentVerificationError: null,

  // Patient appointments
  myAppointments: [],
  myAppointmentsLoading: false,
  myAppointmentsError: null,
  myAppointmentsTotal: 0,

  myAppointmentsPagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Patient dashboard stats
  patientDashboardStats: {
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  },

  patientDashboardStatsLoading: false,
  patientDashboardStatsError: null,

  // Selected appointment
  selectedAppointment: null,
  selectedAppointmentLoading: false,
  selectedAppointmentError: null,

  // Cancel appointment
  cancellingAppointment: false,
  cancelAppointmentError: null,
  cancelAppointmentSuccess: false,
  cancelledAppointment: null,

  // Doctor appointments
  doctorAppointments: [],
  doctorAppointmentsLoading: false,
  doctorAppointmentsError: null,
  doctorAppointmentsTotal: 0,

  doctorAppointmentsPagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Accept appointment
  acceptingAppointment: false,
  acceptAppointmentError: null,
  acceptedAppointment: null,

  // Reject appointment
  rejectingAppointment: false,
  rejectAppointmentError: null,
  rejectedAppointment: null,

  // Complete consultation
  completingConsultation: false,
  completeConsultationError: null,
  completeConsultationSuccess: false,
  completedConsultation: null,
};

// ======================================================
// SLICE
// ======================================================

const appointmentSlice = createSlice({
  name: "appointments",

  initialState,

  reducers: {
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
      state.slotsLoading = false;
      state.slotsError = null;
    },

    clearAppointmentError: (state) => {
      state.createAppointmentError = null;
    },

    clearPaymentError: (state) => {
      state.paymentError = null;
    },

    clearPaymentVerificationError: (state) => {
      state.paymentVerificationError = null;
    },

    clearMyAppointmentsError: (state) => {
      state.myAppointmentsError = null;
    },

    clearPatientDashboardStatsError: (state) => {
      state.patientDashboardStatsError = null;
    },

    clearSelectedAppointmentError: (state) => {
      state.selectedAppointmentError = null;
    },

    clearCancelAppointmentError: (state) => {
      state.cancelAppointmentError = null;
    },

    clearDoctorAppointmentsError: (state) => {
      state.doctorAppointmentsError = null;
    },

    clearAcceptAppointmentError: (state) => {
      state.acceptAppointmentError = null;
    },

    clearRejectAppointmentError: (state) => {
      state.rejectAppointmentError = null;
    },

    clearCompleteConsultationError: (state) => {
      state.completeConsultationError = null;
    },

    resetPaymentVerification: (state) => {
      state.paymentVerification = null;
      state.verifyingPayment = false;
      state.paymentVerificationError = null;
    },

    resetPayment: (state) => {
      state.paymentData = null;
      state.paymentLoading = false;
      state.paymentError = null;
      state.paymentInitialized = false;

      state.paymentVerification = null;
      state.verifyingPayment = false;
      state.paymentVerificationError = null;
    },

    resetAppointment: (state) => {
      state.appointment = null;
      state.appointmentId = null;
      state.creatingAppointment = false;
      state.createAppointmentError = null;
      state.appointmentSuccess = false;

      state.paymentData = null;
      state.paymentLoading = false;
      state.paymentError = null;
      state.paymentInitialized = false;

      state.paymentVerification = null;
      state.verifyingPayment = false;
      state.paymentVerificationError = null;
    },

    resetMyAppointments: (state) => {
      state.myAppointments = [];
      state.myAppointmentsLoading = false;
      state.myAppointmentsError = null;
      state.myAppointmentsTotal = 0;

      state.myAppointmentsPagination = {
        currentPage: 1,
        totalPages: 1,
        limit: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    },

    resetPatientDashboardStats: (state) => {
      state.patientDashboardStats = {
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
      };

      state.patientDashboardStatsLoading = false;

      state.patientDashboardStatsError = null;
    },

    resetSelectedAppointment: (state) => {
      state.selectedAppointment = null;
      state.selectedAppointmentLoading = false;
      state.selectedAppointmentError = null;
    },

    resetCancelAppointment: (state) => {
      state.cancellingAppointment = false;
      state.cancelAppointmentError = null;
      state.cancelAppointmentSuccess = false;
      state.cancelledAppointment = null;
    },

    resetDoctorAppointments: (state) => {
      state.doctorAppointments = [];
      state.doctorAppointmentsLoading = false;
      state.doctorAppointmentsError = null;
      state.doctorAppointmentsTotal = 0;

      state.doctorAppointmentsPagination = {
        currentPage: 1,
        totalPages: 1,
        limit: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      state.acceptingAppointment = false;
      state.acceptAppointmentError = null;
      state.acceptedAppointment = null;

      state.rejectingAppointment = false;
      state.rejectAppointmentError = null;
      state.rejectedAppointment = null;
    },

    resetCompleteConsultation: (state) => {
      state.completingConsultation = false;
      state.completeConsultationError = null;
      state.completeConsultationSuccess = false;
      state.completedConsultation = null;
    },
  },

  // ======================================================
  // EXTRA REDUCERS
  // ======================================================

  extraReducers: (builder) => {
    builder
      // ==================================================
      // AVAILABLE SLOTS
      // ==================================================

      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
        state.slotsError = null;
        state.availableSlots = [];
      })

      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.slotsError = null;

        state.availableSlots = Array.isArray(action.payload)
          ? action.payload
          : [];
      })

      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.slotsLoading = false;
        state.availableSlots = [];

        state.slotsError = action.payload || "Unable to load available slots.";
      })

      // ==================================================
      // CREATE APPOINTMENT
      // ==================================================

      .addCase(createAppointment.pending, (state) => {
        state.creatingAppointment = true;
        state.createAppointmentError = null;
        state.appointmentSuccess = false;

        state.appointment = null;
        state.appointmentId = null;
      })

      .addCase(createAppointment.fulfilled, (state, action) => {
        state.creatingAppointment = false;
        state.createAppointmentError = null;
        state.appointmentSuccess = true;

        state.appointment = action.payload?.appointment || null;

        state.appointmentId =
          action.payload?.appointmentId ||
          action.payload?.appointment?._id ||
          null;
      })

      .addCase(createAppointment.rejected, (state, action) => {
        state.creatingAppointment = false;
        state.appointmentSuccess = false;
        state.appointment = null;
        state.appointmentId = null;

        state.createAppointmentError =
          action.payload || "Unable to create appointment.";
      })

      // ==================================================
      // INITIALIZE PAYMENT
      // ==================================================

      .addCase(initializePayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
        state.paymentData = null;
        state.paymentInitialized = false;
      })

      .addCase(initializePayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = null;
        state.paymentInitialized = true;

        state.paymentData = action.payload?.payment || action.payload || null;
      })

      .addCase(initializePayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentData = null;
        state.paymentInitialized = false;

        state.paymentError = action.payload || "Unable to initialize payment.";
      })

      // ==================================================
      // VERIFY PAYMENT
      // ==================================================

      .addCase(verifyPaymentStatus.pending, (state) => {
        state.verifyingPayment = true;
        state.paymentVerificationError = null;
      })

      .addCase(verifyPaymentStatus.fulfilled, (state, action) => {
        state.verifyingPayment = false;
        state.paymentVerificationError = null;

        state.paymentVerification = action.payload;

        const verifiedAppointment = action.payload?.appointment;

        if (verifiedAppointment) {
          state.appointment = verifiedAppointment;

          state.appointmentId = verifiedAppointment._id || state.appointmentId;

          updateAppointmentEverywhere(state, verifiedAppointment);
        }
      })

      .addCase(verifyPaymentStatus.rejected, (state, action) => {
        state.verifyingPayment = false;

        state.paymentVerificationError =
          action.payload || "Unable to verify payment status.";
      })

      // ==================================================
      // PATIENT APPOINTMENTS
      // ==================================================

      .addCase(fetchMyAppointments.pending, (state) => {
        state.myAppointmentsLoading = true;
        state.myAppointmentsError = null;
      })

      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.myAppointmentsLoading = false;
        state.myAppointmentsError = null;

        const payload = action.payload || {};

        state.myAppointments = Array.isArray(payload.appointments)
          ? payload.appointments
          : [];

        state.myAppointmentsTotal = Number(payload.totalAppointments) || 0;

        state.myAppointmentsPagination = {
          currentPage: Number(payload?.pagination?.currentPage) || 1,

          totalPages: Number(payload?.pagination?.totalPages) || 1,

          limit: Number(payload?.pagination?.limit) || 20,

          hasNextPage: Boolean(payload?.pagination?.hasNextPage),

          hasPreviousPage: Boolean(payload?.pagination?.hasPreviousPage),
        };
      })

      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.myAppointmentsLoading = false;

        state.myAppointments = [];

        state.myAppointmentsError =
          action.payload || "Unable to load your appointments.";
      })

      // ==================================================
      // PATIENT DASHBOARD STATS
      // ==================================================

      .addCase(fetchPatientDashboardStats.pending, (state) => {
        state.patientDashboardStatsLoading = true;

        state.patientDashboardStatsError = null;
      })

      .addCase(fetchPatientDashboardStats.fulfilled, (state, action) => {
        state.patientDashboardStatsLoading = false;

        state.patientDashboardStatsError = null;

        const stats = action.payload || {};

        state.patientDashboardStats = {
          totalAppointments: Number(stats.totalAppointments) || 0,

          pendingAppointments: Number(stats.pendingAppointments) || 0,

          confirmedAppointments: Number(stats.confirmedAppointments) || 0,

          completedAppointments: Number(stats.completedAppointments) || 0,

          cancelledAppointments: Number(stats.cancelledAppointments) || 0,
        };
      })

      .addCase(fetchPatientDashboardStats.rejected, (state, action) => {
        state.patientDashboardStatsLoading = false;

        state.patientDashboardStatsError =
          action.payload || "Unable to load dashboard statistics.";
      })

      // ==================================================
      // SINGLE APPOINTMENT
      // ==================================================

      .addCase(fetchAppointmentById.pending, (state) => {
        state.selectedAppointmentLoading = true;

        state.selectedAppointmentError = null;

        state.selectedAppointment = null;
      })

      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.selectedAppointmentLoading = false;

        state.selectedAppointmentError = null;

        state.selectedAppointment = action.payload || null;
      })

      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.selectedAppointmentLoading = false;

        state.selectedAppointment = null;

        state.selectedAppointmentError =
          action.payload || "Unable to load appointment details.";
      })

      // ==================================================
      // CANCEL APPOINTMENT
      // ==================================================

      .addCase(cancelAppointment.pending, (state) => {
        state.cancellingAppointment = true;
        state.cancelAppointmentError = null;
        state.cancelAppointmentSuccess = false;
        state.cancelledAppointment = null;
      })

      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.cancellingAppointment = false;
        state.cancelAppointmentError = null;
        state.cancelAppointmentSuccess = true;

        const cancelledAppointment = action.payload?.appointment || null;

        state.cancelledAppointment = cancelledAppointment;

        updateAppointmentEverywhere(state, cancelledAppointment);
      })

      .addCase(cancelAppointment.rejected, (state, action) => {
        state.cancellingAppointment = false;

        state.cancelAppointmentSuccess = false;

        state.cancelledAppointment = null;

        state.cancelAppointmentError =
          action.payload || "Unable to cancel appointment.";
      })

      // ==================================================
      // DOCTOR APPOINTMENTS
      // ==================================================

      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.doctorAppointmentsLoading = true;

        state.doctorAppointmentsError = null;
      })

      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.doctorAppointmentsLoading = false;

        state.doctorAppointmentsError = null;

        const payload = action.payload || {};

        state.doctorAppointments = Array.isArray(payload.appointments)
          ? payload.appointments
          : [];

        state.doctorAppointmentsTotal = Number(payload.totalAppointments) || 0;

        state.doctorAppointmentsPagination = {
          currentPage: Number(payload?.pagination?.currentPage) || 1,

          totalPages: Number(payload?.pagination?.totalPages) || 1,

          limit: Number(payload?.pagination?.limit) || 20,

          hasNextPage: Boolean(payload?.pagination?.hasNextPage),

          hasPreviousPage: Boolean(payload?.pagination?.hasPreviousPage),
        };
      })

      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
        state.doctorAppointmentsLoading = false;

        state.doctorAppointments = [];

        state.doctorAppointmentsError =
          action.payload || "Unable to load doctor appointments.";
      })

      // ==================================================
      // ACCEPT APPOINTMENT
      // ==================================================

      .addCase(acceptDoctorAppointment.pending, (state) => {
        state.acceptingAppointment = true;
        state.acceptAppointmentError = null;
        state.acceptedAppointment = null;
      })

      .addCase(acceptDoctorAppointment.fulfilled, (state, action) => {
        state.acceptingAppointment = false;

        state.acceptAppointmentError = null;

        const updatedAppointment = action.payload?.appointment || null;

        state.acceptedAppointment = updatedAppointment;

        updateAppointmentEverywhere(state, updatedAppointment);
      })

      .addCase(acceptDoctorAppointment.rejected, (state, action) => {
        state.acceptingAppointment = false;

        state.acceptedAppointment = null;

        state.acceptAppointmentError =
          action.payload || "Unable to accept appointment.";
      })

      // ==================================================
      // REJECT APPOINTMENT
      // ==================================================

      .addCase(rejectDoctorAppointment.pending, (state) => {
        state.rejectingAppointment = true;
        state.rejectAppointmentError = null;
        state.rejectedAppointment = null;
      })

      .addCase(rejectDoctorAppointment.fulfilled, (state, action) => {
        state.rejectingAppointment = false;

        state.rejectAppointmentError = null;

        const updatedAppointment = action.payload?.appointment || null;

        state.rejectedAppointment = updatedAppointment;

        updateAppointmentEverywhere(state, updatedAppointment);
      })

      .addCase(rejectDoctorAppointment.rejected, (state, action) => {
        state.rejectingAppointment = false;

        state.rejectedAppointment = null;

        state.rejectAppointmentError =
          action.payload || "Unable to reject appointment.";
      })

      // ==================================================
      // COMPLETE CONSULTATION
      // ==================================================

      .addCase(completeConsultation.pending, (state) => {
        state.completingConsultation = true;

        state.completeConsultationError = null;

        state.completeConsultationSuccess = false;

        state.completedConsultation = null;
      })

      .addCase(completeConsultation.fulfilled, (state, action) => {
        state.completingConsultation = false;

        state.completeConsultationError = null;

        state.completeConsultationSuccess = true;

        const payload = action.payload || {};

        const updatedAppointment =
          payload?.appointment || payload?.data?.appointment || null;

        state.completedConsultation =
          payload?.consultation ||
          payload?.data?.consultation ||
          updatedAppointment?.consultation ||
          null;

        updateAppointmentEverywhere(state, updatedAppointment);
      })

      .addCase(completeConsultation.rejected, (state, action) => {
        state.completingConsultation = false;

        state.completeConsultationSuccess = false;

        state.completedConsultation = null;

        state.completeConsultationError =
          action.payload || "Unable to complete consultation.";
      });
  },
});

// ======================================================
// ACTIONS
// ======================================================

export const {
  clearAvailableSlots,
  clearAppointmentError,
  clearPaymentError,
  clearPaymentVerificationError,
  clearMyAppointmentsError,

  clearPatientDashboardStatsError,

  clearSelectedAppointmentError,
  clearCancelAppointmentError,
  clearDoctorAppointmentsError,
  clearAcceptAppointmentError,
  clearRejectAppointmentError,
  clearCompleteConsultationError,

  resetPayment,
  resetPaymentVerification,
  resetAppointment,
  resetMyAppointments,

  resetPatientDashboardStats,

  resetSelectedAppointment,
  resetCancelAppointment,
  resetDoctorAppointments,
  resetCompleteConsultation,
} = appointmentSlice.actions;

// ======================================================
// AVAILABLE SLOT SELECTORS
// ======================================================

export const selectAvailableSlots = (state) =>
  state.appointments.availableSlots;

export const selectSlotsLoading = (state) => state.appointments.slotsLoading;

export const selectSlotsError = (state) => state.appointments.slotsError;

// ======================================================
// CURRENT APPOINTMENT SELECTORS
// ======================================================

export const selectAppointment = (state) => state.appointments.appointment;

export const selectAppointmentId = (state) => state.appointments.appointmentId;

export const selectCreatingAppointment = (state) =>
  state.appointments.creatingAppointment;

export const selectAppointmentSuccess = (state) =>
  state.appointments.appointmentSuccess;

export const selectCreateAppointmentError = (state) =>
  state.appointments.createAppointmentError;

// ======================================================
// PAYMENT SELECTORS
// ======================================================

export const selectPaymentData = (state) => state.appointments.paymentData;

export const selectPaymentLoading = (state) =>
  state.appointments.paymentLoading;

export const selectPaymentError = (state) => state.appointments.paymentError;

export const selectPaymentInitialized = (state) =>
  state.appointments.paymentInitialized;

export const selectPaymentVerification = (state) =>
  state.appointments.paymentVerification;

export const selectVerifyingPayment = (state) =>
  state.appointments.verifyingPayment;

export const selectPaymentVerificationError = (state) =>
  state.appointments.paymentVerificationError;

// ======================================================
// PATIENT APPOINTMENT SELECTORS
// ======================================================

export const selectMyAppointments = (state) =>
  state.appointments.myAppointments;

export const selectMyAppointmentsLoading = (state) =>
  state.appointments.myAppointmentsLoading;

export const selectMyAppointmentsError = (state) =>
  state.appointments.myAppointmentsError;

export const selectMyAppointmentsTotal = (state) =>
  state.appointments.myAppointmentsTotal;

export const selectMyAppointmentsPagination = (state) =>
  state.appointments.myAppointmentsPagination;

// ======================================================
// PATIENT DASHBOARD STATS SELECTORS
// ======================================================

export const selectPatientDashboardStats = (state) =>
  state.appointments.patientDashboardStats;

export const selectPatientDashboardStatsLoading = (state) =>
  state.appointments.patientDashboardStatsLoading;

export const selectPatientDashboardStatsError = (state) =>
  state.appointments.patientDashboardStatsError;

export const selectPatientTotalAppointments = (state) =>
  state.appointments.patientDashboardStats?.totalAppointments || 0;

export const selectPatientPendingAppointments = (state) =>
  state.appointments.patientDashboardStats?.pendingAppointments || 0;

export const selectPatientConfirmedAppointments = (state) =>
  state.appointments.patientDashboardStats?.confirmedAppointments || 0;

export const selectPatientCompletedAppointments = (state) =>
  state.appointments.patientDashboardStats?.completedAppointments || 0;

export const selectPatientCancelledAppointments = (state) =>
  state.appointments.patientDashboardStats?.cancelledAppointments || 0;

// ======================================================
// SELECTED APPOINTMENT
// ======================================================

export const selectSelectedAppointment = (state) =>
  state.appointments.selectedAppointment;

export const selectSelectedAppointmentLoading = (state) =>
  state.appointments.selectedAppointmentLoading;

export const selectSelectedAppointmentError = (state) =>
  state.appointments.selectedAppointmentError;

// ======================================================
// CANCEL APPOINTMENT
// ======================================================

export const selectCancellingAppointment = (state) =>
  state.appointments.cancellingAppointment;

export const selectCancelAppointmentError = (state) =>
  state.appointments.cancelAppointmentError;

export const selectCancelAppointmentSuccess = (state) =>
  state.appointments.cancelAppointmentSuccess;

export const selectCancelledAppointment = (state) =>
  state.appointments.cancelledAppointment;

// ======================================================
// DOCTOR APPOINTMENTS
// ======================================================

export const selectDoctorAppointments = (state) =>
  state.appointments.doctorAppointments;

export const selectDoctorAppointmentsLoading = (state) =>
  state.appointments.doctorAppointmentsLoading;

export const selectDoctorAppointmentsError = (state) =>
  state.appointments.doctorAppointmentsError;

export const selectDoctorAppointmentsTotal = (state) =>
  state.appointments.doctorAppointmentsTotal;

export const selectDoctorAppointmentsPagination = (state) =>
  state.appointments.doctorAppointmentsPagination;

// ======================================================
// ACCEPT
// ======================================================

export const selectAcceptingAppointment = (state) =>
  state.appointments.acceptingAppointment;

export const selectAcceptAppointmentError = (state) =>
  state.appointments.acceptAppointmentError;

export const selectAcceptedAppointment = (state) =>
  state.appointments.acceptedAppointment;

// ======================================================
// REJECT
// ======================================================

export const selectRejectingAppointment = (state) =>
  state.appointments.rejectingAppointment;

export const selectRejectAppointmentError = (state) =>
  state.appointments.rejectAppointmentError;

export const selectRejectedAppointment = (state) =>
  state.appointments.rejectedAppointment;

// ======================================================
// COMPLETE CONSULTATION
// ======================================================

export const selectCompletingConsultation = (state) =>
  state.appointments.completingConsultation;

export const selectCompleteConsultationError = (state) =>
  state.appointments.completeConsultationError;

export const selectCompleteConsultationSuccess = (state) =>
  state.appointments.completeConsultationSuccess;

export const selectCompletedConsultation = (state) =>
  state.appointments.completedConsultation;

// ======================================================
// PAYMENT HELPERS
// ======================================================

export const selectVerifiedPayment = (state) =>
  state.appointments.paymentVerification?.payment || null;

export const selectVerifiedAppointment = (state) =>
  state.appointments.paymentVerification?.appointment || null;

export const selectIsPaymentPaid = (state) =>
  state.appointments.paymentVerification?.payment?.status === "paid";

export const selectIsAppointmentConfirmed = (state) => {
  const appointment = state.appointments.paymentVerification?.appointment;

  return (
    appointment?.status === "confirmed" && appointment?.paymentStatus === "paid"
  );
};

// ======================================================
// SELECTED APPOINTMENT HELPERS
// ======================================================

export const selectSelectedAppointmentDoctor = (state) =>
  state.appointments.selectedAppointment?.doctor || null;

export const selectSelectedAppointmentPatient = (state) =>
  state.appointments.selectedAppointment?.patient || null;

export const selectSelectedAppointmentPaymentStatus = (state) =>
  state.appointments.selectedAppointment?.paymentStatus || null;

export const selectSelectedAppointmentStatus = (state) =>
  state.appointments.selectedAppointment?.status || null;

// ======================================================
// CANCEL HELPERS
// ======================================================

export const selectCancelledAppointmentId = (state) =>
  state.appointments.cancelledAppointment?._id || null;

export const selectCancellationReason = (state) =>
  state.appointments.cancelledAppointment?.cancellationReason || "";

export const selectCancelledAt = (state) =>
  state.appointments.cancelledAppointment?.cancelledAt || null;

// ======================================================
// DOCTOR FILTER HELPERS
// ======================================================

export const selectPendingDoctorRequests = (state) =>
  state.appointments.doctorAppointments.filter(
    (appointment) =>
      appointment?.paymentStatus === "paid" &&
      appointment?.doctorStatus === "pending" &&
      appointment?.status !== "cancelled",
  );

export const selectAcceptedDoctorAppointments = (state) =>
  state.appointments.doctorAppointments.filter(
    (appointment) =>
      appointment?.doctorStatus === "accepted" &&
      appointment?.status !== "cancelled" &&
      appointment?.status !== "completed",
  );

export const selectCompletedDoctorAppointments = (state) =>
  state.appointments.doctorAppointments.filter(
    (appointment) => appointment?.status === "completed",
  );

export const selectCancelledDoctorAppointments = (state) =>
  state.appointments.doctorAppointments.filter(
    (appointment) => appointment?.status === "cancelled",
  );

export const selectRejectedDoctorAppointments = (state) =>
  state.appointments.doctorAppointments.filter(
    (appointment) => appointment?.doctorStatus === "rejected",
  );

// ======================================================
// EXPORT REDUCER
// ======================================================

export default appointmentSlice.reducer;
