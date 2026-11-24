import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

// ======================================================
// LAYOUTS
// ======================================================

import RootLayout from "@/layout/RootLayout";

// ======================================================
// PROTECTED ROUTES
// ======================================================

import {
  AdminProtectedRoute,
  UserProtectedRoute,
  DoctorProtectedRoute,
} from "./UsersProtectedRoute";

// ======================================================
// LAZY LOADED PUBLIC PAGES
// ======================================================

const Home = lazy(() => import("@/Pages/HomePage"));

const AboutUs = lazy(() => import("@/Pages/AboutUs"));

const LoginPage = lazy(() => import("@/Pages/LoginPage"));

const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));

const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

const RegisterPage = lazy(() => import("@/Pages/RegisterPage"));

const DoctorList = lazy(() => import("@/Pages/DoctorList"));

const DoctorProfile = lazy(() => import("@/Pages/DoctorProfile"));

const BookingForm = lazy(() => import("@/components/Appointment/BookingForm"));

const SpecialitiesPage = lazy(() => import("@/Pages/SpecialitiesPage"));

const PaymentSuccess = lazy(() => import("@/Pages/PaymentSuccess"));

const PaymentCancel = lazy(() => import("@/Pages/PaymentCancel"));

// ======================================================
// LAZY LOADED DOCTOR LAYOUT & PAGES
// ======================================================

const DoctorLayout = lazy(() => import("@/layout/DoctorLayout"));

const DoctorDashboard = lazy(() => import("@/Pages/Doctor/DoctorDashborad"));

const DoctorRequest = lazy(() => import("@/Pages/Doctor/DoctorRequest"));

const AvailableTiming = lazy(
  () => import("@/Pages/Doctor/AvailableTimingPage"),
);

const MyPatientsPage = lazy(() => import("@/Pages/Doctor/MyPatientsPage"));

const AppointmentStartPage = lazy(() => import("@/Pages/AppointmentStartPage"));

const DoctorProfilePage = lazy(
  () => import("@/Pages/Doctor/DoctorProfilePage"),
);

const ChangePasswordPage = lazy(
  () => import("@/Pages/Doctor/ChnagePasswordPage"),
);

const DoctorAppointmentsListPage = lazy(
  () => import("@/Pages/Doctor/AppointmentList"),
);

const DoctorInvoicesPage = lazy(
  () => import("@/Pages/Doctor/DoctorInvoicesPage"),
);

// ======================================================
// LAZY LOADED PATIENT LAYOUT & PAGES
// ======================================================

const PatientRootLayout = lazy(() => import("@/layout/UserLayout"));

const PatientDashboard = lazy(() => import("@/Pages/Patient/PatientDashborad"));

const PatientAppointmentsPage = lazy(
  () => import("@/Pages/Patient/PatientAppointmentsPage"),
);

const PatientMedicalRecordsPage = lazy(
  () => import("@/Pages/Patient/PatientMedicalRecords"),
);

const PatientInvoicesPage = lazy(
  () => import("@/Pages/Patient/PatientInvoicesPage"),
);

const PatientSettingsPage = lazy(
  () => import("@/Pages/Patient/PatientSettingsPage"),
);

// ======================================================
// LAZY LOADED ADMIN LAYOUT & PAGES
// ======================================================

const AdminRootLayout = lazy(() => import("@/layout/AdminLayout"));

const AdminDashboard = lazy(() => import("@/Pages/Admin/AdminDashboard"));

const AdminDoctors = lazy(() => import("@/Pages/Admin/AdminDoctors"));

const AdminSpecialities = lazy(() => import("@/Pages/Admin/AdminSpecialities"));

const AdminAppointments = lazy(() => import("@/Pages/Admin/AdminAppointments"));

const AdminPatients = lazy(() => import("@/Pages/Admin/AdminPatients"));

const AdminReviews = lazy(() => import("@/Pages/Admin/AdminReviews"));

const AdminTransactions = lazy(() => import("@/Pages/Admin/AdminTransactions"));

const AdminProfile = lazy(() => import("@/Pages/Admin/AdminProfile"));

const AdminLoginPage = lazy(() => import("@/Pages/AdminLoginPage"));

// ======================================================
// PAGE LOADER
// ======================================================

function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-white"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="text-sm font-medium text-slate-500">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
}

// ======================================================
// SUSPENSE WRAPPER
// ======================================================

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// ======================================================
// ROUTER CONFIGURATION
// ======================================================

export const router = createBrowserRouter([
  // ====================================================
  // 1. PUBLIC ROUTES
  // ====================================================

  {
    path: "/",
    Component: RootLayout,

    children: [
      {
        index: true,
        element: withSuspense(Home),
      },

      {
        path: "about",
        element: withSuspense(AboutUs),
      },

      {
        path: "doctors",
        element: withSuspense(DoctorList),
      },

      {
        path: "doctors/:doctorId",
        element: withSuspense(DoctorProfile),
      },

      {
        path: "doctors/:doctorId/booking",
        element: withSuspense(BookingForm),
      },

      {
        path: "departments",
        element: withSuspense(SpecialitiesPage),
      },

      {
        path: "payment/success",
        element: withSuspense(PaymentSuccess),
      },

      {
        path: "payment/cancel",
        element: withSuspense(PaymentCancel),
      },

      {
        path: "login",
        element: withSuspense(LoginPage),
      },

      {
        path: "forgot-password",
        element: withSuspense(ForgotPassword),
      },

      {
        path: "reset-password/:token",
        element: withSuspense(ResetPassword),
      },

      {
        path: "register",
        element: withSuspense(RegisterPage),
      },
    ],
  },

  // ====================================================
  // 2. DOCTOR PROTECTED ROUTES
  // ====================================================

  {
    Component: DoctorProtectedRoute,

    children: [
      {
        path: "/doctor",
        element: withSuspense(DoctorLayout),

        children: [
          {
            index: true,
            element: withSuspense(DoctorDashboard),
          },

          {
            path: "dashboard",
            element: withSuspense(DoctorDashboard),
          },

          {
            path: "requests",
            element: withSuspense(DoctorRequest),
          },

          {
            path: "available-timings",
            element: withSuspense(AvailableTiming),
          },

          {
            path: "patients",
            element: withSuspense(MyPatientsPage),
          },

          {
            path: "appointments",
            element: withSuspense(DoctorAppointmentsListPage),
          },

          {
            path: "appointments/:appointmentId/start",
            element: withSuspense(AppointmentStartPage),
          },

          {
            path: "invoices",
            element: withSuspense(DoctorInvoicesPage),
          },

          {
            path: "profile-settings",
            element: withSuspense(DoctorProfilePage),
          },

          {
            path: "change-password",
            element: withSuspense(ChangePasswordPage),
          },
        ],
      },
    ],
  },

  // ====================================================
  // 3. PATIENT PROTECTED ROUTES
  // ====================================================

  {
    Component: UserProtectedRoute,

    children: [
      {
        path: "/patient",
        element: withSuspense(PatientRootLayout),

        children: [
          {
            index: true,
            element: withSuspense(PatientDashboard),
          },

          {
            path: "dashboard",
            element: withSuspense(PatientDashboard),
          },

          {
            path: "appointments",
            element: withSuspense(PatientAppointmentsPage),
          },

          {
            path: "medical-records",
            element: withSuspense(PatientMedicalRecordsPage),
          },

          {
            path: "invoices",
            element: withSuspense(PatientInvoicesPage),
          },

          {
            path: "settings",
            element: withSuspense(PatientSettingsPage),
          },
        ],
      },
    ],
  },

  // ====================================================
  // 4. ADMIN LOGIN - PUBLIC
  // ====================================================

  {
    path: "/admin/login",
    element: withSuspense(AdminLoginPage),
  },

  // ====================================================
  // 5. ADMIN PROTECTED ROUTES
  // ====================================================

  {
    Component: AdminProtectedRoute,

    children: [
      {
        path: "/admin",
        element: withSuspense(AdminRootLayout),

        children: [
          {
            index: true,
            element: withSuspense(AdminDashboard),
          },

          {
            path: "dashboard",
            element: withSuspense(AdminDashboard),
          },

          {
            path: "appointments",
            element: withSuspense(AdminAppointments),
          },

          {
            path: "specialities",
            element: withSuspense(AdminSpecialities),
          },

          {
            path: "doctors",
            element: withSuspense(AdminDoctors),
          },

          {
            path: "patients",
            element: withSuspense(AdminPatients),
          },

          {
            path: "reviews",
            element: withSuspense(AdminReviews),
          },

          {
            path: "transactions",
            element: withSuspense(AdminTransactions),
          },

          {
            path: "profile",
            element: withSuspense(AdminProfile),
          },
        ],
      },
    ],
  },
]);

export default router;
