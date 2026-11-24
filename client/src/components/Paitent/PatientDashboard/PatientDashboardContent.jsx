import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import HealthRecords from "./HealthRecords";
import TotalAppointments from "./TotalAppointments";
import PendingAppointmentCount from "./PendingAppointmentCount";
import CompletedAppointments from "./CompletedAppointments";
import RecentAppointments from "./RecentAppointments";

import {
  fetchPatientDashboardStats,
  selectPatientDashboardStats,
  selectPatientDashboardStatsLoading,
  selectPatientDashboardStatsError,
} from "@/redux/slices/appointmentSlice";

export default function PatientDashboardContent() {
  const dispatch = useDispatch();

  // ======================================================
  // REDUX STATE
  // ======================================================

  const stats = useSelector(selectPatientDashboardStats);

  const loading = useSelector(selectPatientDashboardStatsLoading);

  const error = useSelector(selectPatientDashboardStatsError);

  // ======================================================
  // FETCH DASHBOARD STATS
  // ======================================================

  useEffect(() => {
    dispatch(fetchPatientDashboardStats());
  }, [dispatch]);

  // ======================================================
  // RETRY
  // ======================================================

  const handleRetry = () => {
    dispatch(fetchPatientDashboardStats());
  };

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your health records and appointments
        </p>
      </div>

      {/* =================================================
          HEALTH RECORDS
      ================================================= */}

      <HealthRecords />

      {/* =================================================
          APPOINTMENT STATISTICS
      ================================================= */}

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            Unable to load appointment statistics
          </p>

          <p className="mt-1 text-xs text-red-600">
            {typeof error === "string"
              ? error
              : error?.message || "Unable to load dashboard statistics."}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <TotalAppointments value={stats?.totalAppointments ?? 0} />

          <PendingAppointmentCount value={stats?.pendingAppointments ?? 0} />

          <CompletedAppointments value={stats?.completedAppointments ?? 0} />
        </div>
      )}

      {/* =================================================
          RECENT APPOINTMENTS
      ================================================= */}

      <RecentAppointments />
    </div>
  );
}

// ======================================================
// STAT LOADING SKELETON
// ======================================================

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-100" />

        <div className="flex-1">
          <div className="h-3 w-32 rounded bg-slate-100" />

          <div className="mt-3 h-7 w-12 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
