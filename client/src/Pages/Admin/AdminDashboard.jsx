import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AppointmentsTable from "@/components/admin/AppointmentsTable";
import DoctorsTable from "@/components/admin/DoctorsTable";
import PatientsTable from "@/components/admin/PatientsTable";
import StatCard from "@/components/admin/StatCard";

import {
  FaCalendarCheck,
  FaDollarSign,
  FaUserDoctor,
  FaUsers,
  FaArrowRotateRight,
} from "react-icons/fa6";

import { fetchAdminDashboard } from "@/redux/slices/adminDashboardSlice";

// ==========================================
// HELPERS
// ==========================================

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
};

const formatCurrency = (amount, currency = "LKR") => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

export default function AdminDashboard() {
  const dispatch = useDispatch();

  const { stats, doctors, patients, appointments, loading, error } =
    useSelector((state) => state.adminDashboard);

  // ========================================
  // FETCH DATA ON PAGE LOAD
  // ========================================

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  // ========================================
  // REFRESH DASHBOARD
  // ========================================

  const handleRefresh = () => {
    dispatch(fetchAdminDashboard());
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="w-full">
      {/* WELCOME */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome Admin!
          </h1>

          <p className="mt-1 text-xs text-slate-400">Dashboard</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <FaArrowRotateRight className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Doctors"
          value={formatNumber(stats.totalDoctors)}
          icon={<FaUserDoctor />}
          progress={50}
          iconClass="text-cyan-500"
          progressClass="bg-cyan-500"
        />

        <StatCard
          title="Patients"
          value={formatNumber(stats.totalPatients)}
          icon={<FaUsers />}
          progress={55}
          iconClass="text-green-500"
          progressClass="bg-green-500"
        />

        <StatCard
          title="Appointments"
          value={formatNumber(stats.totalAppointments)}
          icon={<FaCalendarCheck />}
          progress={50}
          iconClass="text-red-500"
          progressClass="bg-red-500"
        />

        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue, stats.currency || "LKR")}
          icon={<FaDollarSign />}
          progress={55}
          iconClass="text-amber-500"
          progressClass="bg-amber-500"
        />
      </div>

      {/* DOCTORS + PATIENTS */}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <DoctorsTable doctors={doctors} />

        <PatientsTable patients={patients} loading={loading} />
      </div>

      {/* APPOINTMENTS */}
      <div className="mt-5">
        <AppointmentsTable appointments={appointments} loading={loading} />
      </div>
    </div>
  );
}
