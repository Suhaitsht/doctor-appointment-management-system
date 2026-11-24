import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  FaCalendarCheck,
  FaArrowRotateRight,
  FaTriangleExclamation,
  FaCircleInfo,
  FaCircleCheck,
  FaXmark,
} from "react-icons/fa6";

import {
  fetchAdminAppointments,
  cancelAdminAppointment,
  clearAdminCancelStatus,
  selectAdminAppointments,
  selectAdminAppointmentsLoading,
  selectAdminAppointmentsError,
  selectAdminAppointmentsTotal,
  selectAdminAppointmentsPagination,
  selectAdminCancelLoading,
  selectAdminCancelError,
} from "@/redux/slices/adminAppointmentSlice";

import AppointmentsTable from "@/components/admin/appiontments/AppointmentsTable";
import AppointmentsToolbar from "@/components/admin/appiontments/AppointmentsToolbar";
import AppointmentViewDialog from "@/components/admin/appiontments/AppointmentViewDialog";
import AdminCancelAppointmentDialog from "@/components/admin/appiontments/AdminCancelAppointmentDialog";

// ==========================================
// CONFIGURATION
// ==========================================

const BACKEND_URL = (
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000"
).replace(/\/+$/, "");

// ==========================================
// HELPERS
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  const value = image.trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/")
  ) {
    return value;
  }

  if (value.startsWith("//") || value.includes("://")) {
    return "";
  }

  return `${BACKEND_URL}/${value.replace(/^\/+/, "")}`;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
};

// Backend stores the appointment's selected calendar
// date using createDateOnly(dateString).
//
// Preserve the original YYYY-MM-DD calendar date.
// This avoids converting the date based on the
// browser's timezone.

const formatAppointmentDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);

    if (match) {
      return match[0];
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ==========================================
// MAP BACKEND APPOINTMENT
// ==========================================

const mapAppointment = (item) => {
  const patient = item?.patient || {};
  const doctor = item?.doctor || {};
  const doctorUser = doctor.user || {};
  const patientDetails = item?.patientDetails || {};

  const bookingName = [patientDetails.firstName, patientDetails.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: item._id || item.id || "",

    patientName: bookingName || patient.name || "Unknown Patient",

    patientEmail: patientDetails.email || patient.email || "",

    patientPhone: patientDetails.phone || patient.phone || "",

    doctorName: doctorUser.name || "Unknown Doctor",

    speciality: doctor.speciality || "General",

    date: formatAppointmentDate(item.appointmentDate),

    time: item.timeSlot?.startTime || "",

    type: item.appointmentType || "Clinic",

    amount: formatCurrency(item.totalAmount),

    status: item.status || "pending",

    paymentStatus: item.paymentStatus || "pending",

    doctorStatus: item.doctorStatus || "pending",

    patientImage: getImageUrl(patient.image),

    doctorImage: getImageUrl(doctorUser.image),

    symptoms: patientDetails.symptoms || "",

    hospital: doctor.hospital || "",

    startTime: item.timeSlot?.startTime || "",

    endTime: item.timeSlot?.endTime || "",

    registeredPatientName: patient.name || "",

    totalAmount: item.totalAmount ?? 0,

    consultationFee: item.consultationFee ?? 0,

    bookingFee: item.bookingFee ?? 0,

    tax: item.tax ?? 0,

    discount: item.discount ?? 0,

    cancellationReason: item.cancellationReason || "",

    cancelledAt: item.cancelledAt || null,

    cancelledBy: item.cancelledBy || null,

    raw: item,
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AdminAppointments() {
  const dispatch = useDispatch();

  // ========================================
  // REDUX STATE
  // ========================================

  const appointments = useSelector(selectAdminAppointments);

  const loading = useSelector(selectAdminAppointmentsLoading);

  const error = useSelector(selectAdminAppointmentsError);

  const totalAppointments = useSelector(selectAdminAppointmentsTotal);

  const pagination = useSelector(selectAdminAppointmentsPagination);

  const cancelLoading = useSelector(selectAdminCancelLoading);

  const cancelError = useSelector(selectAdminCancelError);

  // ========================================
  // FILTER STATE
  // ========================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("");

  const [entries, setEntries] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  // ========================================
  // VIEW DIALOG STATE
  // ========================================

  const [viewOpen, setViewOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ========================================
  // CANCEL DIALOG STATE
  // ========================================

  const [cancelOpen, setCancelOpen] = useState(false);

  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // ========================================
  // NOTIFICATION STATE
  // ========================================

  const [notification, setNotification] = useState(null);

  // ========================================
  // DEBOUNCED SEARCH
  // ========================================

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  // ========================================
  // FETCH APPOINTMENTS
  // ========================================

  useEffect(() => {
    const request = dispatch(
      fetchAdminAppointments({
        page: currentPage,
        limit: entries,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        date: dateFilter,
        search: debouncedSearch,
      }),
    );

    return () => {
      request.abort();
    };
  }, [
    dispatch,
    currentPage,
    entries,
    statusFilter,
    paymentStatusFilter,
    dateFilter,
    debouncedSearch,
  ]);

  // ========================================
  // MAP API DATA
  // ========================================

  const visibleAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) {
      return [];
    }

    return appointments.map(mapAppointment);
  }, [appointments]);

  // ========================================
  // PAGINATION
  // ========================================

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);

  const totalRecords = Math.max(0, Number(totalAppointments) || 0);

  const startIndex = (currentPage - 1) * entries;

  // ========================================
  // NOTIFICATION HELPER
  // ========================================

  const showNotification = useCallback((type, message) => {
    setNotification({
      type,
      message,
    });
  }, []);

  // ========================================
  // FILTER CHANGE HANDLERS
  // ========================================

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
    setNotification(null);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setNotification(null);
  };

  const handlePaymentStatusChange = (value) => {
    setPaymentStatusFilter(value);
    setCurrentPage(1);
    setNotification(null);
  };

  const handleDateChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
    setNotification(null);
  };

  const handleEntriesChange = (value) => {
    setEntries(Number(value));
    setCurrentPage(1);
    setNotification(null);
  };

  // ========================================
  // VIEW APPOINTMENT
  // ========================================

  const openView = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setViewOpen(true);
    setNotification(null);
  }, []);

  // ========================================
  // EDIT APPOINTMENT
  // ========================================

  const openEdit = () => {
    showNotification("info", "Admin appointment editing is not available yet.");
  };

  // ========================================
  // OPEN CANCEL DIALOG
  // ========================================

  const openDelete = (appointment) => {
    if (!appointment?.id) {
      showNotification("error", "Unable to identify this appointment.");
      return;
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      showNotification(
        "error",
        "Only pending or confirmed appointments can be cancelled.",
      );
      return;
    }

    dispatch(clearAdminCancelStatus());

    setAppointmentToCancel(appointment);
    setCancelOpen(true);
    setNotification(null);
  };

  // ========================================
  // CLOSE CANCEL DIALOG
  // ========================================

  const handleCancelOpenChange = (open) => {
    if (cancelLoading && !open) {
      return;
    }

    setCancelOpen(open);

    if (!open) {
      setAppointmentToCancel(null);
      dispatch(clearAdminCancelStatus());
    }
  };

  // ========================================
  // CONFIRM CANCELLATION
  // ========================================

  const handleConfirmCancellation = async ({ appointmentId, reason }) => {
    if (cancelLoading) return;

    try {
      const result = await dispatch(
        cancelAdminAppointment({
          appointmentId,
          reason,
        }),
      ).unwrap();

      setCancelOpen(false);
      setAppointmentToCancel(null);

      dispatch(clearAdminCancelStatus());

      showNotification(
        "success",
        result.message || "Appointment cancelled successfully.",
      );

      // Reload from MongoDB using current filters.
      // This keeps counts and pagination in sync.

      const refreshRequest = dispatch(
        fetchAdminAppointments({
          page: currentPage,
          limit: entries,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          date: dateFilter,
          search: debouncedSearch,
        }),
      );

      await refreshRequest;
    } catch (cancelFailure) {
      // Redux stores the error and the dialog
      // displays it. Keep the dialog open.
      console.error("ADMIN CANCELLATION FAILED:", cancelFailure);
    }
  };

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    setNotification(null);

    dispatch(
      fetchAdminAppointments({
        page: currentPage,
        limit: entries,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        date: dateFilter,
        search: debouncedSearch,
      }),
    );
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="w-full space-y-5 pb-6">
      {/* ==================================
          PAGE HEADER
      ================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-600">Appointments</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FaCalendarCheck className="text-lg" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Appointments
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage patient appointment records
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaArrowRotateRight
            className={`text-xs ${loading ? "animate-spin" : ""}`}
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ==================================
          TOOLBAR
      ================================== */}

      <AppointmentsToolbar
        search={search}
        setSearch={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={handlePaymentStatusChange}
        dateFilter={dateFilter}
        setDateFilter={handleDateChange}
        entries={entries}
        setEntries={handleEntriesChange}
        setCurrentPage={setCurrentPage}
      />

      {/* ==================================
          FETCH ERROR
      ================================== */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-600" />

          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              Failed to load appointments
            </p>

            <p className="mt-1 text-sm text-red-600">
              {typeof error === "string"
                ? error
                : error?.message || "Something went wrong."}
            </p>
          </div>
        </div>
      )}

      {/* ==================================
          SUCCESS / INFO / ERROR MESSAGE
      ================================== */}

      {notification && (
        <div
          role={notification.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50"
              : notification.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
          }`}
        >
          {notification.type === "success" ? (
            <FaCircleCheck className="mt-0.5 shrink-0 text-emerald-600" />
          ) : notification.type === "error" ? (
            <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-600" />
          ) : (
            <FaCircleInfo className="mt-0.5 shrink-0 text-blue-600" />
          )}

          <p
            className={`flex-1 text-sm ${
              notification.type === "success"
                ? "text-emerald-800"
                : notification.type === "error"
                  ? "text-red-700"
                  : "text-blue-700"
            }`}
          >
            {notification.message}
          </p>

          <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            className="shrink-0 text-slate-500 hover:text-slate-700"
          >
            <FaXmark />
          </button>
        </div>
      )}

      {/* ==================================
          APPOINTMENTS TABLE
      ================================== */}

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading appointments...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while fetching appointment records.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <FaTriangleExclamation className="mx-auto text-3xl text-red-400" />

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Unable to display appointments
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Check your connection or try refreshing.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <AppointmentsTable
          appointments={visibleAppointments}
          filteredCount={totalRecords}
          entries={entries}
          startIndex={startIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
          canEdit={false}
          canDelete={true}
        />
      )}

      {/* ==================================
          VIEW DIALOG
      ================================== */}

      <AppointmentViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        appointment={selectedAppointment}
      />

      {/* ==================================
          CANCEL CONFIRMATION DIALOG
      ================================== */}

      <AdminCancelAppointmentDialog
        open={cancelOpen}
        onOpenChange={handleCancelOpenChange}
        appointment={appointmentToCancel}
        onConfirm={handleConfirmCancellation}
        loading={cancelLoading}
        error={cancelError}
      />
    </div>
  );
}
