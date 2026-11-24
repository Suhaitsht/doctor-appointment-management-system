import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

// Components
import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";
import RecentPatients from "@/components/Doctor/RecentPatients/RecentPatients";
import StatCard from "@/components/Doctor/StateCard/StateCard";

// Icons
import {
  FaCalendarDays,
  FaUserDoctor,
  FaUsers,
  FaClock,
  FaCircleCheck,
  FaArrowsRotate,
  FaTriangleExclamation,
} from "react-icons/fa6";

// Redux
import {
  fetchDoctorDashboardStats,
  selectDoctorDashboardStats,
  selectDoctorRecentPatients,
  selectDoctorDashboardLoading,
  selectDoctorDashboardError,
} from "@/redux/slices/doctorSlice";

// ======================================================
// DOCTOR DASHBOARD
// ======================================================

export default function DoctorDashboard() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const stats = useSelector(selectDoctorDashboardStats);

  const recentPatients = useSelector(selectDoctorRecentPatients);

  const loading = useSelector(selectDoctorDashboardLoading);

  const error = useSelector(selectDoctorDashboardError);

  // ====================================================
  // FETCH DASHBOARD DATA
  // ====================================================

  useEffect(() => {
    dispatch(fetchDoctorDashboardStats());
  }, [dispatch]);

  // ====================================================
  // REFRESH DASHBOARD
  // ====================================================

  const handleRefresh = () => {
    if (loading) return;

    dispatch(fetchDoctorDashboardStats());
  };

  // ====================================================
  // NORMALIZE DASHBOARD STATS
  // ====================================================

  const dashboardStats = useMemo(
    () => ({
      totalPatients: stats?.totalPatients ?? 0,
      patientsToday: stats?.patientsToday ?? 0,
      appointmentsToday: stats?.appointmentsToday ?? 0,
      pendingRequests: stats?.pendingRequests ?? 0,
      completedAppointments: stats?.completedAppointments ?? 0,
    }),
    [stats],
  );

  const patientList = Array.isArray(recentPatients) ? recentPatients : [];

  // ====================================================
  // LOADING HELPERS
  // ====================================================

  const initialLoading = loading && !stats;

  const displayValue = (value) => (initialLoading ? "..." : value);

  // ====================================================
  // MAIN STATS CONFIGURATION
  // ====================================================

  const mainStats = [
    {
      id: "totalPatients",
      title: "Total Patients",
      value: dashboardStats.totalPatients,
      icon: <FaUsers />,
    },
    {
      id: "patientsToday",
      title: "Patients Today",
      value: dashboardStats.patientsToday,
      icon: <FaUserDoctor />,
    },
    {
      id: "appointmentsToday",
      title: "Appointments Today",
      value: dashboardStats.appointmentsToday,
      icon: <FaCalendarDays />,
    },
  ];

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="container mx-auto mt-20 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* ==============================================
            DOCTOR SIDEBAR
        ============================================== */}

        <DoctorSidebar />

        {/* ==============================================
            MAIN CONTENT
        ============================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                {/* Breadcrumb */}

                <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>Doctor</span>
                  <span>/</span>

                  <span className="font-medium text-blue-600">Dashboard</span>
                </div>

                {/* Title */}

                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                  Dashboard
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Overview of your patients, appointments, and consultation
                  activities.
                </p>
              </div>

              {/* Refresh Button */}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="
                  inline-flex items-center justify-center
                  gap-2 rounded-lg border border-slate-200
                  bg-white px-4 py-2.5 text-sm font-medium
                  text-slate-700 shadow-sm transition
                  hover:border-blue-200 hover:bg-blue-50
                  hover:text-blue-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <FaArrowsRotate className={loading ? "animate-spin" : ""} />

                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>

            {/* ==========================================
                ERROR MESSAGE
            ========================================== */}

            {error && (
              <div
                role="alert"
                className="
                  mb-6 flex flex-wrap items-center
                  justify-between gap-4 rounded-xl
                  border border-red-200 bg-red-50 p-4
                "
              >
                <div className="flex items-start gap-3">
                  <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-600" />

                  <div>
                    <h3 className="text-sm font-semibold text-red-700">
                      Unable to load dashboard
                    </h3>

                    <p className="mt-1 text-xs text-red-600">{error}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="
                    rounded-lg bg-red-600 px-4 py-2
                    text-xs font-semibold text-white
                    transition hover:bg-red-700
                    disabled:opacity-50
                  "
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ==========================================
                DASHBOARD CONTENT
            ========================================== */}

            <div className="space-y-6">
              {/* ========================================
                  MAIN STAT CARDS
              ======================================== */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {mainStats.map((item) => (
                  <StatCard
                    key={item.id}
                    title={item.title}
                    value={displayValue(item.value)}
                    icon={item.icon}
                  />
                ))}
              </div>

              {/* ========================================
                  ADDITIONAL STATS
              ======================================== */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* PENDING REQUESTS */}

                <div
                  className="
                    rounded-xl border border-slate-200
                    bg-white p-5 shadow-sm
                    transition hover:shadow-md
                  "
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Pending Requests
                      </p>

                      <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {displayValue(dashboardStats.pendingRequests)}
                      </h2>

                      <p className="mt-2 text-xs text-slate-400">
                        Appointments awaiting your approval
                      </p>
                    </div>

                    <div
                      className="
                        flex h-14 w-14 shrink-0
                        items-center justify-center
                        rounded-xl bg-amber-50
                        text-amber-600
                      "
                    >
                      <FaClock className="text-2xl" />
                    </div>
                  </div>
                </div>

                {/* COMPLETED APPOINTMENTS */}

                <div
                  className="
                    rounded-xl border border-slate-200
                    bg-white p-5 shadow-sm
                    transition hover:shadow-md
                  "
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Completed Appointments
                      </p>

                      <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {displayValue(dashboardStats.completedAppointments)}
                      </h2>

                      <p className="mt-2 text-xs text-slate-400">
                        Successfully completed consultations
                      </p>
                    </div>

                    <div
                      className="
                        flex h-14 w-14 shrink-0
                        items-center justify-center
                        rounded-xl bg-emerald-50
                        text-emerald-600
                      "
                    >
                      <FaCircleCheck className="text-2xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================
                  RECENT PATIENTS
              ======================================== */}

              <section className="min-w-0">
                {/* Loading State */}

                {initialLoading ? (
                  <div
                    role="status"
                    className="
                      rounded-xl border border-slate-200
                      bg-white p-8 text-center shadow-sm
                    "
                  >
                    <FaArrowsRotate className="mx-auto mb-3 animate-spin text-2xl text-blue-600" />

                    <p className="text-sm font-medium text-slate-700">
                      Loading recent patients...
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Fetching your latest appointments
                    </p>
                  </div>
                ) : stats || patientList.length > 0 ? (
                  // Actual Recent Patients Component

                  <RecentPatients patients={patientList} />
                ) : !error ? (
                  // Empty State

                  <RecentPatients patients={[]} />
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
