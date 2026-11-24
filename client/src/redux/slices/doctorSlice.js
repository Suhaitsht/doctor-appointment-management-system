import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const extractDoctor = (data) =>
  data?.doctor || data?.data?.doctor || data?.data || data;

const extractDoctors = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.doctors)) return data.doctors;
  if (Array.isArray(data?.data?.doctors)) return data.data.doctors;
  return Array.isArray(data?.data) ? data.data : [];
};

const extractAvailability = (data) => {
  if (Array.isArray(data?.availability)) return data.availability;

  if (Array.isArray(data?.data?.availability)) {
    return data.data.availability;
  }

  if (Array.isArray(data?.data)) return data.data;

  return Array.isArray(data) ? data : [];
};

// ======================================================
// ADMIN DOCTOR FORM DATA
// ======================================================

const buildDoctorFormData = (doctorData = {}) => {
  const formData = new FormData();

  const fields = [
    "name",
    "email",
    "phone",
    "speciality",
    "hospital",
    "consultationFee",
    "memberSince",
    "memberTime",
    "status",
    "displayName",
    "designation",
  ];

  fields.forEach((key) => {
    if (doctorData[key] !== undefined && doctorData[key] !== null) {
      formData.append(key, String(doctorData[key]));
    }
  });

  if (doctorData.password) {
    formData.append("password", doctorData.password);
  }

  ["experiences", "education", "languages", "memberships"].forEach((key) => {
    if (doctorData[key] !== undefined) {
      formData.append(key, JSON.stringify(doctorData[key] || []));
    }
  });

  if (typeof File !== "undefined" && doctorData.image instanceof File) {
    formData.append("image", doctorData.image);
  }

  return formData;
};

// ======================================================
// PROFILE SETTINGS HELPERS
// ======================================================

const extractMyProfile = (data) => {
  const result = data?.data || data;

  if (!result?.profile || !result?.doctor) {
    throw new Error("Invalid doctor profile API response.");
  }

  return {
    profile: result.profile,
    doctor: result.doctor,
  };
};

const buildProfilePayload = (profileData = {}) => {
  if (typeof FormData !== "undefined" && profileData instanceof FormData) {
    return profileData;
  }

  const imageIsFile =
    typeof File !== "undefined" && profileData.image instanceof File;

  if (!imageIsFile) {
    return profileData;
  }

  const formData = new FormData();

  const { image, ...fields } = profileData;

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  formData.append("image", image);

  return formData;
};

// ======================================================
// PUBLIC - FETCH ALL DOCTORS
// ======================================================

export const fetchPublicDoctors = createAsyncThunk(
  "doctors/fetchPublicDoctors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/doctors/public");

      return extractDoctors(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load public doctors."),
      );
    }
  },
);

/* ======================================================
   PUBLIC DOCTOR RATINGS
   GET /api/reviews/ratings/doctors
====================================================== */

export const fetchPublicDoctorRatings = createAsyncThunk(
  "doctors/fetchPublicDoctorRatings",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/reviews/ratings/doctors");

      if (data?.success !== true || !Array.isArray(data?.ratings)) {
        return rejectWithValue("Invalid public doctor ratings response.");
      }

      return data.ratings;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load public doctor ratings."),
      );
    }
  },
);

// ======================================================
// PUBLIC - FETCH SINGLE DOCTOR
// ======================================================

export const fetchPublicDoctorById = createAsyncThunk(
  "doctors/fetchPublicDoctorById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/doctors/public/${id}`);

      return extractDoctor(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load doctor profile."),
      );
    }
  },
);

// ======================================================
// ADMIN - FETCH ALL DOCTORS
// ======================================================

export const fetchDoctors = createAsyncThunk(
  "doctors/fetchDoctors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/doctors");

      return extractDoctors(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to load doctors."));
    }
  },
);

// ======================================================
// ADMIN - CREATE DOCTOR
// ======================================================

export const createDoctor = createAsyncThunk(
  "doctors/createDoctor",
  async (doctorData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/doctors",
        buildDoctorFormData(doctorData),
      );

      return extractDoctor(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to create doctor."),
      );
    }
  },
);

// ======================================================
// ADMIN - UPDATE DOCTOR
// ======================================================

export const updateDoctor = createAsyncThunk(
  "doctors/updateDoctor",
  async ({ id, doctorData }, { rejectWithValue }) => {
    if (!id) {
      return rejectWithValue("Doctor ID is required.");
    }

    try {
      const { data } = await api.put(
        `/doctors/${id}`,
        buildDoctorFormData(doctorData),
      );

      return extractDoctor(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update doctor."),
      );
    }
  },
);

// ======================================================
// ADMIN - DELETE DOCTOR
// ======================================================

export const deleteDoctor = createAsyncThunk(
  "doctors/deleteDoctor",
  async (id, { rejectWithValue }) => {
    if (!id) {
      return rejectWithValue("Doctor ID is required.");
    }

    try {
      await api.delete(`/doctors/${id}`);

      return id;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to delete doctor."),
      );
    }
  },
);

// ======================================================
// ADMIN - UPDATE DOCTOR ACCOUNT STATUS
// ======================================================

export const updateDoctorStatus = createAsyncThunk(
  "doctors/updateDoctorStatus",
  async ({ id, status }, { rejectWithValue }) => {
    if (!id) {
      return rejectWithValue("Doctor ID is required.");
    }

    try {
      const { data } = await api.patch(`/doctors/${id}/status`, { status });

      const updated = extractDoctor(data);

      if (
        updated &&
        typeof updated === "object" &&
        (updated._id || updated.id)
      ) {
        return updated;
      }

      return { _id: id, status };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update doctor status."),
      );
    }
  },
);

// ======================================================
// DOCTOR - FETCH WEEKLY AVAILABILITY
// ======================================================

export const fetchMyAvailability = createAsyncThunk(
  "doctors/fetchMyAvailability",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/doctors/availability");

      return extractAvailability(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load doctor availability."),
      );
    }
  },
);

// ======================================================
// DOCTOR - UPDATE WEEKLY AVAILABILITY
// ======================================================

export const updateDoctorAvailability = createAsyncThunk(
  "doctors/updateDoctorAvailability",
  async (availability, { rejectWithValue }) => {
    if (!Array.isArray(availability)) {
      return rejectWithValue("Availability must be an array.");
    }

    try {
      const { data } = await api.put("/doctors/availability", { availability });

      return extractAvailability(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update doctor availability."),
      );
    }
  },
);

// ======================================================
// NEW - UPDATE DOCTOR AVAILABLE / UNAVAILABLE STATUS
// PATCH /api/doctors/me/availability-status
// ======================================================

export const updateDoctorAvailabilityStatus = createAsyncThunk(
  "doctors/updateDoctorAvailabilityStatus",
  async (isAvailable, { rejectWithValue }) => {
    if (typeof isAvailable !== "boolean") {
      return rejectWithValue("Availability status must be true or false.");
    }

    try {
      const { data } = await api.patch("/doctors/me/availability-status", {
        isAvailable,
      });

      if (
        data?.success !== true ||
        typeof data?.isAvailable !== "boolean" ||
        !data?.doctor
      ) {
        return rejectWithValue("Invalid availability status API response.");
      }

      return {
        isAvailable: data.isAvailable,
        doctor: data.doctor,
        profile: data.profile ?? null,
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update doctor availability status."),
      );
    }
  },
);

// ======================================================
// DOCTOR DASHBOARD - STATS + RECENT PATIENTS
// ======================================================

export const fetchDoctorDashboardStats = createAsyncThunk(
  "doctors/fetchDoctorDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/appointments/doctor/dashboard-stats");

      if (data?.success !== true || !data?.stats) {
        return rejectWithValue("Invalid dashboard API response.");
      }

      return {
        stats: data.stats,
        recentPatients: Array.isArray(data.recentPatients)
          ? data.recentPatients
          : [],
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load doctor dashboard."),
      );
    }
  },
);

// ======================================================
// DOCTOR - MY PATIENTS
// ======================================================

export const fetchDoctorMyPatients = createAsyncThunk(
  "doctors/fetchDoctorMyPatients",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/appointments/doctor/my-patients");

      if (data?.success !== true || !Array.isArray(data?.patients)) {
        return rejectWithValue("Invalid My Patients API response.");
      }

      return {
        patients: data.patients,
        stats: {
          totalPatients: data.stats?.totalPatients ?? 0,
          activePatients: data.stats?.activePatients ?? 0,
          inactivePatients: data.stats?.inactivePatients ?? 0,
        },
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load doctor patients."),
      );
    }
  },
);

// ======================================================
// DOCTOR PROFILE - FETCH MY PROFILE
// ======================================================

export const fetchMyDoctorProfile = createAsyncThunk(
  "doctors/fetchMyDoctorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/doctors/me/profile");

      return extractMyProfile(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to load doctor profile."),
      );
    }
  },
);

// ======================================================
// DOCTOR PROFILE - UPDATE MY PROFILE
// ======================================================

export const updateMyDoctorProfile = createAsyncThunk(
  "doctors/updateMyDoctorProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const payload = buildProfilePayload(profileData);

      const { data } = await api.put("/doctors/me/profile", payload);

      return extractMyProfile(data);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update doctor profile."),
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  // ADMIN
  doctors: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  statusUpdating: false,
  error: null,

  // PUBLIC DOCTORS
  publicDoctors: [],
  publicDoctorsLoading: false,
  publicDoctorsError: null,

  /* PUBLIC DOCTOR RATINGS */
  publicDoctorRatings: {},
  publicDoctorRatingsLoading: false,
  publicDoctorRatingsError: null,

  publicDoctor: null,
  publicDoctorLoading: false,
  publicDoctorError: null,

  // WEEKLY AVAILABILITY
  availability: [],
  availabilityLoading: false,
  availabilityUpdating: false,
  availabilityError: null,

  // NEW - AVAILABLE / UNAVAILABLE STATUS
  doctorAvailabilityStatusUpdating: false,
  doctorAvailabilityStatusError: null,
  doctorAvailabilityStatusSuccess: false,

  // DASHBOARD
  dashboardStats: null,
  recentPatients: [],
  dashboardLoading: false,
  dashboardError: null,

  // MY PATIENTS
  myPatients: [],
  myPatientsStats: {
    totalPatients: 0,
    activePatients: 0,
    inactivePatients: 0,
  },
  myPatientsLoading: false,
  myPatientsError: null,

  // DOCTOR PROFILE
  myDoctorProfile: null,
  myDoctorProfileDoctor: null,
  myDoctorProfileLoading: false,
  myDoctorProfileUpdating: false,
  myDoctorProfileError: null,
  myDoctorProfileSuccess: false,
};

// ======================================================
// SLICE
// ======================================================

const doctorSlice = createSlice({
  name: "doctors",

  initialState,

  reducers: {
    clearDoctorError: (state) => {
      state.error = null;
    },

    clearAvailabilityError: (state) => {
      state.availabilityError = null;
    },

    clearDoctorDashboardError: (state) => {
      state.dashboardError = null;
    },

    clearDoctorMyPatientsError: (state) => {
      state.myPatientsError = null;
    },

    clearMyDoctorProfileError: (state) => {
      state.myDoctorProfileError = null;
    },

    clearMyDoctorProfileSuccess: (state) => {
      state.myDoctorProfileSuccess = false;
    },

    // NEW
    clearDoctorAvailabilityStatusError: (state) => {
      state.doctorAvailabilityStatusError = null;
    },

    // NEW
    clearDoctorAvailabilityStatusSuccess: (state) => {
      state.doctorAvailabilityStatusSuccess = false;
    },

    resetMyDoctorProfile: (state) => {
      state.myDoctorProfile = null;
      state.myDoctorProfileDoctor = null;
      state.myDoctorProfileLoading = false;
      state.myDoctorProfileUpdating = false;
      state.myDoctorProfileError = null;
      state.myDoctorProfileSuccess = false;

      // Reset manual availability status state
      state.doctorAvailabilityStatusUpdating = false;
      state.doctorAvailabilityStatusError = null;
      state.doctorAvailabilityStatusSuccess = false;
    },

    resetDoctors: () => ({
      ...initialState,
    }),
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // ADMIN - FETCH ALL DOCTORS
      // ==================================================

      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })

      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load doctors.";
      })

      // ==================================================
      // PUBLIC - FETCH ALL DOCTORS
      // ==================================================

      .addCase(fetchPublicDoctors.pending, (state) => {
        state.publicDoctorsLoading = true;
        state.publicDoctorsError = null;
      })

      .addCase(fetchPublicDoctors.fulfilled, (state, action) => {
        state.publicDoctorsLoading = false;
        state.publicDoctors = action.payload;
      })

      .addCase(fetchPublicDoctors.rejected, (state, action) => {
        state.publicDoctorsLoading = false;
        state.publicDoctors = [];
        state.publicDoctorsError =
          action.payload || "Failed to load public doctors.";
      })
      /* ==================================================
   PUBLIC DOCTOR RATINGS - FETCH
================================================== */

      .addCase(fetchPublicDoctorRatings.pending, (state) => {
        state.publicDoctorRatingsLoading = true;
        state.publicDoctorRatingsError = null;
      })

      .addCase(fetchPublicDoctorRatings.fulfilled, (state, action) => {
        state.publicDoctorRatingsLoading = false;
        state.publicDoctorRatingsError = null;

        state.publicDoctorRatings = Object.fromEntries(
          action.payload.map((item) => [
            String(item.doctorId),
            {
              averageRating: Number(item.averageRating) || 0,
              totalReviews: Number(item.totalReviews) || 0,
            },
          ]),
        );
      })

      .addCase(fetchPublicDoctorRatings.rejected, (state, action) => {
        state.publicDoctorRatingsLoading = false;

        state.publicDoctorRatingsError =
          action.payload || "Failed to load public doctor ratings.";
      })

      // ==================================================
      // PUBLIC - FETCH SINGLE DOCTOR
      // ==================================================

      .addCase(fetchPublicDoctorById.pending, (state) => {
        state.publicDoctorLoading = true;
        state.publicDoctorError = null;
        state.publicDoctor = null;
      })

      .addCase(fetchPublicDoctorById.fulfilled, (state, action) => {
        state.publicDoctorLoading = false;
        state.publicDoctor = action.payload;
      })

      .addCase(fetchPublicDoctorById.rejected, (state, action) => {
        state.publicDoctorLoading = false;
        state.publicDoctor = null;
        state.publicDoctorError =
          action.payload || "Failed to load doctor profile.";
      })

      // ==================================================
      // ADMIN - CREATE DOCTOR
      // ==================================================

      .addCase(createDoctor.pending, (state) => {
        state.creating = true;
        state.error = null;
      })

      .addCase(createDoctor.fulfilled, (state, action) => {
        state.creating = false;

        if (action.payload && typeof action.payload === "object") {
          state.doctors.unshift(action.payload);
        }
      })

      .addCase(createDoctor.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || "Failed to create doctor.";
      })

      // ==================================================
      // ADMIN - UPDATE DOCTOR
      // ==================================================

      .addCase(updateDoctor.pending, (state) => {
        state.updating = true;
        state.error = null;
      })

      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.updating = false;

        const updatedDoctor = action.payload;
        const updatedId = updatedDoctor?._id || updatedDoctor?.id;

        if (!updatedId) return;

        const index = state.doctors.findIndex(
          (doctor) => String(doctor._id || doctor.id) === String(updatedId),
        );

        if (index === -1) {
          state.doctors.unshift(updatedDoctor);
        } else {
          state.doctors[index] = updatedDoctor;
        }
      })

      .addCase(updateDoctor.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Failed to update doctor.";
      })

      // ==================================================
      // ADMIN - DELETE DOCTOR
      // ==================================================

      .addCase(deleteDoctor.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.deleting = false;

        state.doctors = state.doctors.filter(
          (doctor) =>
            String(doctor._id || doctor.id) !== String(action.payload),
        );
      })

      .addCase(deleteDoctor.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete doctor.";
      })

      // ==================================================
      // ADMIN - UPDATE ACCOUNT STATUS
      // ==================================================

      .addCase(updateDoctorStatus.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
      })

      .addCase(updateDoctorStatus.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const updatedDoctor = action.payload;
        const updatedId = updatedDoctor?._id || updatedDoctor?.id;

        const doctor = state.doctors.find(
          (item) => String(item._id || item.id) === String(updatedId),
        );

        if (doctor) {
          Object.assign(doctor, updatedDoctor);
        }
      })

      .addCase(updateDoctorStatus.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error = action.payload || "Failed to update doctor status.";
      })

      // ==================================================
      // WEEKLY AVAILABILITY - FETCH
      // ==================================================

      .addCase(fetchMyAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.availabilityError = null;
      })

      .addCase(fetchMyAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;
        state.availability = action.payload;
      })

      .addCase(fetchMyAvailability.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.availabilityError =
          action.payload || "Failed to load availability.";
      })

      // ==================================================
      // WEEKLY AVAILABILITY - UPDATE
      // ==================================================

      .addCase(updateDoctorAvailability.pending, (state) => {
        state.availabilityUpdating = true;
        state.availabilityError = null;
      })

      .addCase(updateDoctorAvailability.fulfilled, (state, action) => {
        state.availabilityUpdating = false;
        state.availability = action.payload;
      })

      .addCase(updateDoctorAvailability.rejected, (state, action) => {
        state.availabilityUpdating = false;
        state.availabilityError =
          action.payload || "Failed to update availability.";
      })

      // ==================================================
      // DASHBOARD - FETCH
      // ==================================================

      .addCase(fetchDoctorDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })

      .addCase(fetchDoctorDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload.stats;
        state.recentPatients = action.payload.recentPatients;
      })

      .addCase(fetchDoctorDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError =
          action.payload || "Failed to load doctor dashboard.";
      })

      // ==================================================
      // MY PATIENTS - FETCH
      // ==================================================

      .addCase(fetchDoctorMyPatients.pending, (state) => {
        state.myPatientsLoading = true;
        state.myPatientsError = null;
      })

      .addCase(fetchDoctorMyPatients.fulfilled, (state, action) => {
        state.myPatientsLoading = false;
        state.myPatients = action.payload.patients;
        state.myPatientsStats = action.payload.stats;
        state.myPatientsError = null;
      })

      .addCase(fetchDoctorMyPatients.rejected, (state, action) => {
        state.myPatientsLoading = false;
        state.myPatientsError =
          action.payload || "Failed to load doctor patients.";
      })

      // ==================================================
      // PROFILE - FETCH
      // ==================================================

      .addCase(fetchMyDoctorProfile.pending, (state) => {
        state.myDoctorProfileLoading = true;
        state.myDoctorProfileError = null;
        state.myDoctorProfileSuccess = false;
      })

      .addCase(fetchMyDoctorProfile.fulfilled, (state, action) => {
        state.myDoctorProfileLoading = false;

        state.myDoctorProfile = action.payload.profile;
        state.myDoctorProfileDoctor = action.payload.doctor;

        state.myDoctorProfileError = null;
      })

      .addCase(fetchMyDoctorProfile.rejected, (state, action) => {
        state.myDoctorProfileLoading = false;
        state.myDoctorProfileError =
          action.payload || "Failed to load doctor profile.";
      })

      // ==================================================
      // PROFILE - UPDATE
      // ==================================================

      .addCase(updateMyDoctorProfile.pending, (state) => {
        state.myDoctorProfileUpdating = true;
        state.myDoctorProfileError = null;
        state.myDoctorProfileSuccess = false;
      })

      .addCase(updateMyDoctorProfile.fulfilled, (state, action) => {
        state.myDoctorProfileUpdating = false;

        state.myDoctorProfile = action.payload.profile;
        state.myDoctorProfileDoctor = action.payload.doctor;

        state.myDoctorProfileError = null;
        state.myDoctorProfileSuccess = true;
      })

      .addCase(updateMyDoctorProfile.rejected, (state, action) => {
        state.myDoctorProfileUpdating = false;
        state.myDoctorProfileSuccess = false;

        state.myDoctorProfileError =
          action.payload || "Failed to update doctor profile.";
      })

      // ==================================================
      // NEW - AVAILABLE / UNAVAILABLE STATUS
      // ==================================================

      .addCase(updateDoctorAvailabilityStatus.pending, (state) => {
        state.doctorAvailabilityStatusUpdating = true;
        state.doctorAvailabilityStatusError = null;
        state.doctorAvailabilityStatusSuccess = false;
      })

      .addCase(updateDoctorAvailabilityStatus.fulfilled, (state, action) => {
        state.doctorAvailabilityStatusUpdating = false;
        state.doctorAvailabilityStatusError = null;
        state.doctorAvailabilityStatusSuccess = true;

        const { isAvailable, doctor, profile } = action.payload;

        // Update logged-in doctor
        state.myDoctorProfileDoctor = doctor;

        // Update doctor profile
        if (profile) {
          state.myDoctorProfile = profile;
        } else if (state.myDoctorProfile) {
          state.myDoctorProfile.isAvailable = isAvailable;
        }

        // Synchronize admin doctor list
        const doctorIndex = state.doctors.findIndex(
          (item) =>
            String(item._id || item.id) === String(doctor._id || doctor.id),
        );

        if (doctorIndex !== -1) {
          state.doctors[doctorIndex].isAvailable = isAvailable;
        }

        // Synchronize public doctor list
        const publicDoctorIndex = state.publicDoctors.findIndex(
          (item) =>
            String(item._id || item.id) === String(doctor._id || doctor.id),
        );

        if (publicDoctorIndex !== -1) {
          state.publicDoctors[publicDoctorIndex].isAvailable = isAvailable;
        }

        // Synchronize selected public doctor
        if (
          state.publicDoctor &&
          String(state.publicDoctor._id || state.publicDoctor.id) ===
            String(doctor._id || doctor.id)
        ) {
          state.publicDoctor.isAvailable = isAvailable;
        }
      })

      .addCase(updateDoctorAvailabilityStatus.rejected, (state, action) => {
        state.doctorAvailabilityStatusUpdating = false;
        state.doctorAvailabilityStatusSuccess = false;

        state.doctorAvailabilityStatusError =
          action.payload || "Failed to update doctor availability status.";
      });
  },
});

// ======================================================
// ACTION EXPORTS
// ======================================================

export const {
  clearDoctorError,
  clearAvailabilityError,
  clearDoctorDashboardError,
  clearDoctorMyPatientsError,
  clearMyDoctorProfileError,
  clearMyDoctorProfileSuccess,
  resetMyDoctorProfile,
  resetDoctors,

  // NEW
  clearDoctorAvailabilityStatusError,
  clearDoctorAvailabilityStatusSuccess,
} = doctorSlice.actions;

// ======================================================
// DASHBOARD SELECTORS
// ======================================================

export const selectDoctorDashboardStats = (state) =>
  state.doctors.dashboardStats;

export const selectDoctorRecentPatients = (state) =>
  state.doctors.recentPatients;

export const selectDoctorDashboardLoading = (state) =>
  state.doctors.dashboardLoading;

export const selectDoctorDashboardError = (state) =>
  state.doctors.dashboardError;

// ======================================================
// MY PATIENTS SELECTORS
// ======================================================

export const selectDoctorMyPatients = (state) => state.doctors.myPatients;

export const selectDoctorMyPatientsStats = (state) =>
  state.doctors.myPatientsStats;

export const selectDoctorMyPatientsLoading = (state) =>
  state.doctors.myPatientsLoading;

export const selectDoctorMyPatientsError = (state) =>
  state.doctors.myPatientsError;

// ======================================================
// DOCTOR PROFILE SELECTORS
// ======================================================

export const selectMyDoctorProfile = (state) => state.doctors.myDoctorProfile;

export const selectMyDoctorProfileDoctor = (state) =>
  state.doctors.myDoctorProfileDoctor;

export const selectMyDoctorProfileLoading = (state) =>
  state.doctors.myDoctorProfileLoading;

export const selectMyDoctorProfileUpdating = (state) =>
  state.doctors.myDoctorProfileUpdating;

export const selectMyDoctorProfileError = (state) =>
  state.doctors.myDoctorProfileError;

export const selectMyDoctorProfileSuccess = (state) =>
  state.doctors.myDoctorProfileSuccess;

// ======================================================
// NEW - AVAILABILITY STATUS SELECTORS
// ======================================================

export const selectDoctorIsAvailable = (state) =>
  state.doctors.myDoctorProfileDoctor?.isAvailable ??
  state.doctors.myDoctorProfile?.isAvailable ??
  false;

export const selectDoctorAvailabilityStatusUpdating = (state) =>
  state.doctors.doctorAvailabilityStatusUpdating;

export const selectDoctorAvailabilityStatusError = (state) =>
  state.doctors.doctorAvailabilityStatusError;

export const selectDoctorAvailabilityStatusSuccess = (state) =>
  state.doctors.doctorAvailabilityStatusSuccess;

// ======================================================
// REDUCER EXPORT
// ======================================================

/* ======================================================
   PUBLIC DOCTOR RATINGS SELECTORS
====================================================== */

export const selectPublicDoctorRatings = (state) =>
  state.doctors.publicDoctorRatings;

export const selectPublicDoctorRatingsLoading = (state) =>
  state.doctors.publicDoctorRatingsLoading;

export const selectPublicDoctorRatingsError = (state) =>
  state.doctors.publicDoctorRatingsError;

export const selectDoctorRatingById = (state, doctorId) =>
  state.doctors.publicDoctorRatings[String(doctorId)] || {
    averageRating: 0,
    totalReviews: 0,
  };

export default doctorSlice.reducer;
