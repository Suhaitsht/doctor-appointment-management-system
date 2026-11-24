import { configureStore } from "@reduxjs/toolkit";

// ======================================================
// 1. AUTHENTICATION
// Login, Register, Profile, Password Recovery
// ======================================================

import authReducer, { persistAuthMiddleware } from "./slices/authSlice";

// ======================================================
// 2. DOCTORS
// ======================================================

import doctorReducer from "./slices/doctorSlice";

// ======================================================
// 3. SPECIALITIES
// ======================================================

import specialityReducer from "./slices/specialitySlice";

// ======================================================
// 4. FEATURED DOCTORS
// ======================================================

import featuredDoctorsReducer from "./slices/featuredDoctorsSlice";

// ======================================================
// 5. CONSULTATIONS
// ======================================================

import consultationReducer from "./slices/consultationSlice";

// ======================================================
// 6. INVOICES
// ======================================================

import invoiceReducer from "./slices/invoiceSlice";

// ======================================================
// 7. ADMIN APPOINTMENTS
// ======================================================

import adminAppointmentReducer from "./slices/adminAppointmentSlice";

// ======================================================
// 8. PATIENT APPOINTMENTS
// ======================================================

import appointmentReducer from "./slices/appointmentSlice";

// ======================================================
// 9. ADMIN PATIENTS
// ======================================================

import adminPatientReducer from "./slices/adminPatientSlice";

// ======================================================
// 10. ADMIN DASHBOARD
// ======================================================

import adminDashboardReducer from "./slices/adminDashboardSlice";

// ======================================================
// 11. ADMIN TRANSACTIONS
// ======================================================

import adminTransactionsReducer from "./slices/adminTransactionsSlice";

// ======================================================
// 12. HOME SPECIALITIES
// ======================================================

import HomeSpecialityReducer from "./slices/HomeSpecialitySlice";

// ======================================================
// 13. AI CHATBOT + HISTORY PERSISTENCE
// ======================================================

import chatbotReducer, { saveChatHistory } from "./slices/chatbotSlice";

// ======================================================
// 14. PATIENT REVIEWS
// ======================================================

import reviewReducer from "./slices/reviewSlice";

// ======================================================
// 15. ADMIN REVIEWS
// ======================================================

import adminReviewReducer from "./slices/adminReviewSlice";

// ======================================================
// CONFIGURE REDUX STORE
// ======================================================

export const store = configureStore({
  // ----------------------------------------------------
  // REGISTER ALL REDUCERS
  // ----------------------------------------------------

  reducer: {
    // Authentication
    // Includes:
    // Login
    // Register
    // Profile
    // Update Profile
    // Change Password
    // Upload Profile Image
    // Deactivate Account
    // Forgot Password
    // Reset Password

    auth: authReducer,

    // Doctors
    doctors: doctorReducer,

    // Specialities
    specialities: specialityReducer,

    // Featured Doctors
    featuredDoctors: featuredDoctorsReducer,

    // Patient Appointments
    appointments: appointmentReducer,

    // Admin Appointments
    adminAppointments: adminAppointmentReducer,

    // Admin Patients
    adminPatients: adminPatientReducer,

    // Consultations
    consultations: consultationReducer,

    // Invoices
    invoices: invoiceReducer,

    // Admin Dashboard
    adminDashboard: adminDashboardReducer,

    // Home Specialities
    HomeSpecialityReducer: HomeSpecialityReducer,

    // AI Chatbot
    chatbot: chatbotReducer,

    // Patient Reviews
    reviews: reviewReducer,

    // Admin Reviews
    adminReviews: adminReviewReducer,

    // Admin Transactions
    adminTransactions: adminTransactionsReducer,
  },

  // ====================================================
  // MIDDLEWARE
  // ====================================================

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Redux Toolkit async thunks
      thunk: true,

      // Detect non-serializable state/actions
      serializableCheck: true,

      // Detect accidental state mutation
      immutableCheck: true,
    }).concat(
      // Persist authentication to localStorage
      persistAuthMiddleware,
    ),

  // ====================================================
  // REDUX DEVTOOLS
  // ====================================================

  devTools: import.meta.env.DEV,
});

// ======================================================
// CHATBOT HISTORY PERSISTENCE
// ======================================================

// Track previous chatbot state.
let previousChatbotState = store.getState().chatbot;

// Subscribe to Redux state updates.
store.subscribe(() => {
  const currentState = store.getState();

  const currentChatbotState = currentState.chatbot;

  // Do not continue if chatbot state is unavailable.
  if (!currentChatbotState) {
    return;
  }

  // Check whether chatbot messages have changed.
  const messagesChanged =
    currentChatbotState.messages !== previousChatbotState?.messages;

  // Check whether selected language has changed.
  const languageChanged =
    currentChatbotState.language !== previousChatbotState?.language;

  // Persist only when relevant chatbot data changes.
  if (messagesChanged || languageChanged) {
    try {
      saveChatHistory(currentState);
    } catch (error) {
      console.error("Failed to persist chatbot history:", error);
    }
  }

  // Update previous reference.
  previousChatbotState = currentChatbotState;
});

// ======================================================
// DEVELOPMENT DEBUGGING
// ======================================================

if (import.meta.env.DEV) {
  console.log("Redux Store Initialized");

  console.log("Registered Redux Reducers:", Object.keys(store.getState()));

  console.log("Chatbot State:", store.getState().chatbot);
}

// ======================================================
// EXPORT STORE
// ======================================================

export default store;
