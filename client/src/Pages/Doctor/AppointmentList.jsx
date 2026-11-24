import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import DoctorAppointmentsList from "@/components/Doctor/Appointments/DoctorAppointmentsList";
import DoctorAppointmentsToolbar from "@/components/Doctor/Appointments/DoctorAppointmentsToolbar";
import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";
import ConsultationRecordModal from "@/components/Doctor/Consultation/ConsultationRecordModal";

import {
  fetchDoctorAppointments,
  selectDoctorAppointments,
  selectDoctorAppointmentsLoading,
  selectDoctorAppointmentsError,
  selectDoctorAppointmentsTotal,
  selectDoctorAppointmentsPagination,
} from "../../redux/slices/appointmentSlice";

// ======================================================
// SERVER URL
// ======================================================

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// ======================================================
// PATIENT IMAGE
// ======================================================

const getImageUrl = (image, patientName = "Patient") => {
  // ====================================================
  // FALLBACK AVATAR
  // ====================================================

  if (!image) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      patientName,
    )}&background=random`;
  }

  // ====================================================
  // EXTERNAL IMAGE
  // ====================================================

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  // ====================================================
  // BACKEND UPLOADED IMAGE
  // ====================================================

  return `${SERVER_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

// ======================================================
// FORMAT DATE
// ======================================================

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

// ======================================================
// FORMAT TIME
// ======================================================

const formatTime = (time) => {
  if (!time) {
    return "N/A";
  }

  const [hourValue, minuteValue] = time.split(":");

  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";

  const formattedHour = hour % 12 || 12;

  return `${String(formattedHour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0",
  )} ${period}`;
};

// ======================================================
// FRONTEND STATUS
// ======================================================

const getFrontendStatus = (appointment) => {
  // ====================================================
  // COMPLETED
  // ====================================================

  if (appointment?.status === "completed") {
    return "completed";
  }

  // ====================================================
  // PATIENT CANCELLED
  // ====================================================

  if (appointment?.status === "cancelled") {
    return "cancelled";
  }

  // ====================================================
  // DOCTOR REJECTED
  // ====================================================

  if (appointment?.doctorStatus === "rejected") {
    return "cancelled";
  }

  // ====================================================
  // UPCOMING
  // ====================================================

  if (
    appointment?.status === "confirmed" &&
    appointment?.paymentStatus === "paid" &&
    appointment?.doctorStatus === "accepted"
  ) {
    return "upcoming";
  }

  // ====================================================
  // DOCTOR REQUEST PAGE
  // ====================================================

  return null;
};

// ======================================================
// TRANSFORM BACKEND APPOINTMENT
// ======================================================

const transformAppointment = (appointment) => {
  // ====================================================
  // PATIENT NAME
  // ====================================================

  const firstName = appointment?.patientDetails?.firstName || "";

  const lastName = appointment?.patientDetails?.lastName || "";

  const bookingPatientName = `${firstName} ${lastName}`.trim();

  const patientName =
    bookingPatientName || appointment?.patient?.name || "Patient";

  // ====================================================
  // CONTACT
  // ====================================================

  const email =
    appointment?.patientDetails?.email || appointment?.patient?.email || "";

  const phone =
    appointment?.patientDetails?.phone || appointment?.patient?.phone || "";

  // ====================================================
  // STATUS
  // ====================================================

  const status = getFrontendStatus(appointment);

  // ====================================================
  // DISPLAY ID
  // ====================================================

  const displayId = appointment?._id
    ? `Apt${appointment._id.slice(-6).toUpperCase()}`
    : "Appointment";

  // ====================================================
  // CONSULTATION TYPE
  // ====================================================

  const consultationType =
    appointment?.appointmentType === "Online" ? "Video Call" : "Direct Visit";

  // ====================================================
  // RETURN UI OBJECT
  // ====================================================

  return {
    // ==================================================
    // REAL MONGODB APPOINTMENT ID
    //
    // IMPORTANT:
    // This is the ID used when navigating to:
    //
    // /doctor/appointments/:appointmentId/start
    // ==================================================

    _id: appointment?._id,

    // ==================================================
    // DISPLAY ID
    // ==================================================

    id: displayId,

    // ==================================================
    // PATIENT
    // ==================================================

    patientId: appointment?.patient?._id || null,

    patientName,

    patientImage: getImageUrl(appointment?.patient?.image, patientName),

    email,

    phone,

    // ==================================================
    // APPOINTMENT DATE / TIME
    // ==================================================

    date: formatDate(appointment?.appointmentDate),

    time: formatTime(appointment?.timeSlot?.startTime),

    endTime: formatTime(appointment?.timeSlot?.endTime),

    startTime: appointment?.timeSlot?.startTime || "",

    rawEndTime: appointment?.timeSlot?.endTime || "",

    appointmentDate: appointment?.appointmentDate,

    // ==================================================
    // PATIENT COMPLAINT
    // ==================================================

    visitType: appointment?.patientDetails?.symptoms || "No symptoms provided",

    symptoms: appointment?.patientDetails?.symptoms || "",

    attachment: appointment?.patientDetails?.attachment || "",

    // ==================================================
    // APPOINTMENT TYPE
    // ==================================================

    consultationType,

    appointmentType: appointment?.appointmentType || "Clinic",

    // ==================================================
    // FRONTEND STATUS
    // ==================================================

    status,

    // ==================================================
    // BACKEND STATUS
    // ==================================================

    backendStatus: appointment?.status || "pending",

    paymentStatus: appointment?.paymentStatus || "pending",

    doctorStatus: appointment?.doctorStatus || "pending",

    // ==================================================
    // PAYMENT
    // ==================================================

    consultationFee: Number(appointment?.consultationFee) || 0,

    bookingFee: Number(appointment?.bookingFee) || 0,

    tax: Number(appointment?.tax) || 0,

    discount: Number(appointment?.discount) || 0,

    totalAmount: Number(appointment?.totalAmount) || 0,

    // ==================================================
    // DOCTOR DECISION
    // ==================================================

    acceptedAt: appointment?.acceptedAt || null,

    rejectedAt: appointment?.rejectedAt || null,

    rejectionReason: appointment?.rejectionReason || "",

    // ==================================================
    // CANCELLATION
    // ==================================================

    cancelledAt: appointment?.cancelledAt || null,

    cancellationReason: appointment?.cancellationReason || "",

    // ==================================================
    // ORIGINAL BACKEND OBJECT
    // ==================================================

    rawAppointment: appointment,
  };
};

// ======================================================
// DOCTOR APPOINTMENTS PAGE
// ======================================================

export default function DoctorAppointmentsListPage() {
  // ====================================================
  // HOOKS
  // ====================================================

  const dispatch = useDispatch();

  const navigate = useNavigate();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const backendAppointments = useSelector(selectDoctorAppointments) || [];

  const loading = useSelector(selectDoctorAppointmentsLoading);

  const error = useSelector(selectDoctorAppointmentsError);

  const totalAppointments = useSelector(selectDoctorAppointmentsTotal);

  const pagination = useSelector(selectDoctorAppointmentsPagination);

  // ====================================================
  // LOCAL UI STATE
  // ====================================================

  const [activeTab, setActiveTab] = useState("upcoming");

  const [search, setSearch] = useState("");

  const [visitFilter, setVisitFilter] = useState("all");

  const [medicalRecordOpen, setMedicalRecordOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ====================================================
  // FETCH APPOINTMENTS
  // ====================================================

  useEffect(() => {
    dispatch(
      fetchDoctorAppointments({
        page: 1,
        limit: 100,
      }),
    );
  }, [dispatch]);

  // ====================================================
  // TRANSFORM BACKEND DATA
  // ====================================================

  const appointments = useMemo(() => {
    if (!Array.isArray(backendAppointments)) {
      return [];
    }

    return (
      backendAppointments
        .map(transformAppointment)

        // ==============================================
        // Pending doctor requests do not belong here
        // ==============================================

        .filter((appointment) => appointment.status !== null)
    );
  }, [backendAppointments]);

  // ====================================================
  // UPCOMING COUNT
  // ====================================================

  const upcomingCount = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.status === "upcoming",
    ).length;
  }, [appointments]);

  // ====================================================
  // CANCELLED COUNT
  // ====================================================

  const cancelledCount = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.status === "cancelled",
    ).length;
  }, [appointments]);

  // ====================================================
  // COMPLETED COUNT
  // ====================================================

  const completedCount = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.status === "completed",
    ).length;
  }, [appointments]);

  // ====================================================
  // FILTER APPOINTMENTS
  // ====================================================

  const filteredAppointments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return appointments.filter((appointment) => {
      // ============================================
      // STATUS
      // ============================================

      const sameStatus = appointment.status === activeTab;

      // ============================================
      // SEARCH VALUES
      // ============================================

      const patientName = appointment.patientName?.toLowerCase() || "";

      const appointmentId = appointment.id?.toLowerCase() || "";

      const mongoId = appointment._id?.toLowerCase() || "";

      const email = appointment.email?.toLowerCase() || "";

      const phone = appointment.phone?.toLowerCase() || "";

      const symptoms = appointment.symptoms?.toLowerCase() || "";

      // ============================================
      // SEARCH MATCH
      // ============================================

      const sameSearch =
        !searchValue ||
        patientName.includes(searchValue) ||
        appointmentId.includes(searchValue) ||
        mongoId.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        symptoms.includes(searchValue);

      // ============================================
      // APPOINTMENT TYPE
      // ============================================

      const sameVisit =
        visitFilter === "all" ||
        appointment.consultationType === visitFilter ||
        appointment.appointmentType === visitFilter;

      return sameStatus && sameSearch && sameVisit;
    });
  }, [appointments, activeTab, search, visitFilter]);

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = () => {
    dispatch(
      fetchDoctorAppointments({
        page: 1,
        limit: 100,
      }),
    );
  };

  // ====================================================
  // TAB CHANGE
  // ====================================================

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  // ====================================================
  // START APPOINTMENT
  // ====================================================

  const handleStartAppointment = (appointment) => {
    // ================================================
    // GET REAL MONGODB APPOINTMENT ID
    // ================================================

    const appointmentId = appointment?._id;

    console.log("======================================");

    console.log("START APPOINTMENT");

    console.log("Selected Appointment:", appointment);

    console.log("MongoDB Appointment ID:", appointmentId);

    console.log("Display Appointment ID:", appointment?.id);

    console.log("======================================");

    // ================================================
    // VALIDATE APPOINTMENT
    // ================================================

    if (!appointment) {
      console.error("Appointment object not found.");

      return;
    }

    // ================================================
    // VALIDATE MONGODB ID
    // ================================================

    if (!appointmentId) {
      console.error("MongoDB appointment _id not found.");

      alert("Unable to start consultation. Appointment ID was not found.");

      return;
    }

    // ================================================
    // ONLY UPCOMING APPOINTMENTS
    // ================================================

    if (appointment.status !== "upcoming") {
      console.warn("This appointment is not an upcoming appointment.");

      return;
    }

    // ================================================
    // BUILD ROUTE
    // ================================================

    const consultationRoute = `/doctor/appointments/${appointmentId}/start`;

    console.log("Navigating to:", consultationRoute);

    // ================================================
    // NAVIGATE
    // ================================================

    navigate(consultationRoute, {
      // Optional state.
      //
      // We still use appointmentId in URL as the
      // source of truth.
      //
      // State is useful for instant UI display.

      state: {
        appointment,
        appointmentId,
      },
    });
  };

  //

  const handleViewMedicalRecord = (appointment) => {
    console.log("======================================");
    console.log("OPEN CONSULTATION RECORD");
    console.log("Appointment:", appointment);
    console.log("MongoDB ID:", appointment?._id);
    console.log("======================================");

    if (!appointment?._id) {
      alert("Appointment ID was not found.");
      return;
    }

    if (appointment.status !== "completed") {
      alert(
        "Consultation record is available only for completed appointments.",
      );
      return;
    }

    setSelectedAppointment(appointment);
    setMedicalRecordOpen(true);
  };

  const handleCloseMedicalRecord = () => {
    setMedicalRecordOpen(false);
    setSelectedAppointment(null);
  };
  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="container mx-auto mt-20 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* =========================================== */}
        {/* SIDEBAR */}
        {/* =========================================== */}

        <aside className="w-full shrink-0 lg:w-[260px]">
          <DoctorSidebar />
        </aside>

        {/* =========================================== */}
        {/* MAIN CONTENT */}
        {/* =========================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            {/* ======================================= */}
            {/* PAGE HEADER */}
            {/* ======================================= */}

            <div className="mb-6">
              {/* Breadcrumb */}

              <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-400">
                <span>Doctor</span>

                <span>/</span>

                <span className="text-blue-600">Appointments</span>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Appointments
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your accepted, cancelled and completed appointments.
                  </p>
                </div>

                {/* REFRESH */}

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* ======================================= */}
            {/* ERROR */}
            {/* ======================================= */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-red-600">
                    {typeof error === "string"
                      ? error
                      : error?.message || "Failed to load appointments."}
                  </p>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* TOOLBAR */}
            {/* ======================================= */}

            <DoctorAppointmentsToolbar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              search={search}
              setSearch={setSearch}
              visitFilter={visitFilter}
              setVisitFilter={setVisitFilter}
              upcomingCount={upcomingCount}
              cancelledCount={cancelledCount}
              completedCount={completedCount}
            />

            {/* ======================================= */}
            {/* INITIAL LOADING */}
            {/* ======================================= */}

            {loading && appointments.length === 0 ? (
              <div className="flex min-h-[350px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Loading appointments...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =================================== */}
                {/* APPOINTMENTS */}
                {/* =================================== */}

                {filteredAppointments.length > 0 ? (
                  <div className="mt-5">
                    <DoctorAppointmentsList
                      appointments={filteredAppointments}
                      onRefresh={handleRefresh}
                      onStartAppointment={handleStartAppointment}
                      onViewMedicalRecord={handleViewMedicalRecord}
                    />
                  </div>
                ) : (
                  /* ================================= */
                  /* EMPTY STATE */
                  /* ================================= */

                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                      📅
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-800">
                      No appointments found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      There are no {activeTab} appointments available.
                    </p>

                    {(search || visitFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");

                          setVisitFilter("all");
                        }}
                        className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {/* ========================================= */}
            {/* CONSULTATION RECORD MODAL */}
            {/* ========================================= */}

            <ConsultationRecordModal
              open={medicalRecordOpen}
              appointmentId={selectedAppointment?._id}
              appointment={selectedAppointment}
              onClose={handleCloseMedicalRecord}
            />

            {/* ======================================= */}
            {/* FOOTER INFORMATION */}
            {/* ======================================= */}

            {!loading && appointments.length > 0 && (
              <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                {/* SHOWING */}

                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredAppointments.length}
                  </span>{" "}
                  appointment
                  {filteredAppointments.length !== 1 ? "s" : ""}
                </p>

                {/* BACKEND TOTAL */}

                {totalAppointments > 0 && (
                  <p>
                    Backend total:{" "}
                    <span className="font-semibold text-slate-700">
                      {totalAppointments}
                    </span>
                  </p>
                )}

                {/* PAGINATION */}

                {pagination && (
                  <p>
                    Page{" "}
                    <span className="font-semibold text-slate-700">
                      {pagination.currentPage || 1}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {pagination.totalPages || 1}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
