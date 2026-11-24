import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  FiCalendar,
  FiCheck,
  FiX,
  FiVideo,
  FiMapPin,
  FiUser,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

// ======================================================
// API CONFIG
// ======================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// ======================================================
// GET TOKEN
// ======================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("accessToken")
  );
};

// ======================================================
// FORMAT APPOINTMENT DATE
// ======================================================

const formatAppointmentDate = (dateValue) => {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
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
    return "";
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
// GET PATIENT NAME
// ======================================================

const getPatientName = (appointment) => {
  const firstName = appointment?.patientDetails?.firstName?.trim();

  const lastName = appointment?.patientDetails?.lastName?.trim();

  const bookingName = [firstName, lastName].filter(Boolean).join(" ");

  if (bookingName) {
    return bookingName;
  }

  return appointment?.patient?.name || "Patient";
};

// ======================================================
// GET PATIENT IMAGE
// ======================================================

const getPatientImage = (appointment) => {
  const image = appointment?.patient?.image;

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${SERVER_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

// ======================================================
// GET APPOINTMENT REASON
// ======================================================

const getAppointmentReason = (appointment) => {
  const symptoms = appointment?.patientDetails?.symptoms?.trim();

  return symptoms || "General Visit";
};

// ======================================================
// GET APPOINTMENT TYPE
// ======================================================

const getAppointmentType = (appointment) => {
  if (appointment?.appointmentType === "Online") {
    return "Video Call";
  }

  return "Direct Visit";
};

// ======================================================
// APPOINTMENT TYPE ICON
// ======================================================

const getAppointmentIcon = (type) => {
  if (type === "Video Call") {
    return <FiVideo className="text-[15px]" />;
  }

  return <FiMapPin className="text-[15px]" />;
};

// ======================================================
// DATE FILTER
// ======================================================

const matchesDateFilter = (dateValue, filter) => {
  if (filter === "all") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const appointmentDate = new Date(dateValue);

  if (Number.isNaN(appointmentDate.getTime())) {
    return false;
  }

  const now = new Date();

  if (filter === "today") {
    return (
      appointmentDate.getFullYear() === now.getFullYear() &&
      appointmentDate.getMonth() === now.getMonth() &&
      appointmentDate.getDate() === now.getDate()
    );
  }

  if (filter === "this-month") {
    return (
      appointmentDate.getFullYear() === now.getFullYear() &&
      appointmentDate.getMonth() === now.getMonth()
    );
  }

  return true;
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Request() {
  // ====================================================
  // STATE
  // ====================================================

  const [filter, setFilter] = useState("all");

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ====================================================
  // LOAD MORE
  // ====================================================

  const [visibleCount, setVisibleCount] = useState(5);

  // ====================================================
  // REJECT POPUP
  // ====================================================

  const [rejectOpen, setRejectOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [rejectError, setRejectError] = useState("");

  // ====================================================
  // FETCH DOCTOR REQUESTS
  // ====================================================

  const fetchDoctorRequests = async () => {
    try {
      setLoading(true);

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Doctor authentication token not found. Please login again.",
        );
      }

      // Only fetch appointments that:
      //
      // 1. Patient has successfully paid
      // 2. Doctor has not accepted/rejected yet

      const query = new URLSearchParams({
        paymentStatus: "paid",
        doctorStatus: "pending",
        page: "1",
        limit: "100",
      });

      const response = await fetch(
        `${API_URL}/appointments/doctor/my-appointments?${query.toString()}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load appointment requests.",
        );
      }

      // ==================================================
      // EXTRA FRONTEND PROTECTION
      // ==================================================
      //
      // Even though backend is filtering,
      // frontend also checks the important statuses.
      //
      // Doctor Request page should show:
      //
      // paymentStatus = paid
      // doctorStatus = pending
      // status != cancelled
      //
      // ==================================================

      const requests = Array.isArray(data?.appointments)
        ? data.appointments.filter((appointment) => {
            return (
              appointment.paymentStatus === "paid" &&
              appointment.doctorStatus === "pending" &&
              appointment.status !== "cancelled"
            );
          })
        : [];

      setAppointments(requests);
    } catch (err) {
      console.error("Fetch doctor requests error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading appointment requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchDoctorRequests();
  }, []);

  // ====================================================
  // RESET LOAD MORE AFTER FILTER CHANGE
  // ====================================================

  useEffect(() => {
    setVisibleCount(5);
  }, [filter]);

  // ====================================================
  // AUTO REMOVE SUCCESS MESSAGE
  // ====================================================

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, [successMessage]);

  // ====================================================
  // FILTERED APPOINTMENTS
  // ====================================================

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) =>
      matchesDateFilter(appointment.appointmentDate, filter),
    );
  }, [appointments, filter]);

  // ====================================================
  // VISIBLE APPOINTMENTS
  // ====================================================

  const visibleAppointments = filteredAppointments.slice(0, visibleCount);

  const hasMore = visibleCount < filteredAppointments.length;

  // ====================================================
  // ACCEPT APPOINTMENT
  // ====================================================

  const handleAccept = async (appointmentId) => {
    try {
      setActionLoadingId(appointmentId);

      setError("");

      setSuccessMessage("");

      const token = getToken();

      if (!token) {
        throw new Error("Doctor authentication token not found.");
      }

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/accept`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to accept this appointment.");
      }

      console.log("Appointment accepted successfully:", data);

      // ==================================================
      // REMOVE ACCEPTED CARD
      // ==================================================
      //
      // This page only displays doctorStatus=pending.
      //
      // Once accepted:
      //
      // doctorStatus = accepted
      //
      // Therefore remove it immediately from Requests.
      //
      // ==================================================

      setAppointments((currentAppointments) =>
        currentAppointments.filter(
          (appointment) => appointment._id !== appointmentId,
        ),
      );

      setSuccessMessage("Appointment accepted successfully.");
    } catch (err) {
      console.error("Accept appointment error:", err);

      setError(err?.message || "Unable to accept this appointment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ====================================================
  // OPEN REJECT POPUP
  // ====================================================

  const openRejectDialog = (appointment) => {
    setSelectedAppointment(appointment);

    setRejectionReason("");

    setRejectError("");

    setRejectOpen(true);
  };

  // ====================================================
  // CLOSE REJECT POPUP
  // ====================================================

  const closeRejectDialog = () => {
    if (actionLoadingId) {
      return;
    }

    setRejectOpen(false);

    setSelectedAppointment(null);

    setRejectionReason("");

    setRejectError("");
  };

  // ====================================================
  // REJECT APPOINTMENT
  // ====================================================

  const handleReject = async () => {
    try {
      if (!selectedAppointment?._id) {
        return;
      }

      const reason = rejectionReason.trim();

      if (!reason) {
        setRejectError("Please enter a reason for rejecting this appointment.");

        return;
      }

      setRejectError("");

      setError("");

      setSuccessMessage("");

      setActionLoadingId(selectedAppointment._id);

      const token = getToken();

      if (!token) {
        throw new Error("Doctor authentication token not found.");
      }

      const response = await fetch(
        `${API_URL}/appointments/${selectedAppointment._id}/reject`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            reason,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to reject this appointment.");
      }

      console.log("Appointment rejected successfully:", data);

      // ==================================================
      // REMOVE REJECTED CARD
      // ==================================================

      setAppointments((currentAppointments) =>
        currentAppointments.filter(
          (appointment) => appointment._id !== selectedAppointment._id,
        ),
      );

      setSuccessMessage("Appointment rejected successfully.");

      // Close dialog

      setRejectOpen(false);

      setSelectedAppointment(null);

      setRejectionReason("");

      setRejectError("");
    } catch (err) {
      console.error("Reject appointment error:", err);

      setRejectError(err?.message || "Unable to reject this appointment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ====================================================
  // LOAD MORE
  // ====================================================

  const handleLoadMore = () => {
    setVisibleCount((current) => current + 5);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full">
      {/* ================================================= */}
      {/* PAGE HEADING */}
      {/* ================================================= */}

      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Requests</h1>

          {!loading && (
            <p className="mt-1 text-xs text-slate-500">
              {filteredAppointments.length} pending{" "}
              {filteredAppointments.length === 1 ? "request" : "requests"}
            </p>
          )}
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          {/* ============================================= */}
          {/* REFRESH */}
          {/* ============================================= */}

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={fetchDoctorRequests}
            className="h-11 w-11 shrink-0 rounded-lg border-slate-200"
            title="Refresh requests"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </Button>

          {/* ============================================= */}
          {/* FILTER */}
          {/* ============================================= */}

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-[180px]">
              <SelectValue placeholder="All Requests" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>

              <SelectItem value="today">Today</SelectItem>

              <SelectItem value="this-month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ================================================= */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================= */}

      {successMessage && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <FiCheck className="shrink-0 text-lg" />

          <p className="flex-1">{successMessage}</p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* ERROR MESSAGE */}
      {/* ================================================= */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />

          <p className="flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      {loading ? (
        <LoadingState />
      ) : visibleAppointments.length > 0 ? (
        <>
          {/* ============================================= */}
          {/* APPOINTMENT REQUESTS */}
          {/* ============================================= */}

          <div className="space-y-4">
            {visibleAppointments.map((appointment) => (
              <AppointmentRequestCard
                key={appointment._id}
                appointment={appointment}
                actionLoading={actionLoadingId === appointment._id}
                onAccept={handleAccept}
                onReject={openRejectDialog}
              />
            ))}
          </div>

          {/* ============================================= */}
          {/* LOAD MORE */}
          {/* ============================================= */}

          {hasMore && (
            <div className="mt-7 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                className="h-11 rounded-lg border-slate-300 px-7 font-medium"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState filter={filter} />
      )}

      {/* ================================================= */}
      {/* REJECT POPUP */}
      {/* ================================================= */}

      {rejectOpen && selectedAppointment && (
        <RejectAppointmentDialog
          appointment={selectedAppointment}
          reason={rejectionReason}
          setReason={setRejectionReason}
          error={rejectError}
          loading={actionLoadingId === selectedAppointment._id}
          onClose={closeRejectDialog}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// ======================================================
// APPOINTMENT REQUEST CARD
// ======================================================

const AppointmentRequestCard = ({
  appointment,
  onAccept,
  onReject,
  actionLoading,
}) => {
  // ====================================================
  // PATIENT
  // ====================================================

  const patientName = getPatientName(appointment);

  const patientImage = getPatientImage(appointment);

  // ====================================================
  // APPOINTMENT
  // ====================================================

  const appointmentType = getAppointmentType(appointment);

  const reason = getAppointmentReason(appointment);

  const date = formatAppointmentDate(appointment.appointmentDate);

  const startTime = formatTime(appointment?.timeSlot?.startTime);

  const endTime = formatTime(appointment?.timeSlot?.endTime);

  // ====================================================
  // SHORT APPOINTMENT ID
  // ====================================================

  const shortAppointmentId = appointment?._id
    ? appointment._id.slice(-8).toUpperCase()
    : "N/A";

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-none transition hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          {/* ============================================= */}
          {/* PATIENT INFORMATION */}
          {/* ============================================= */}

          <div className="flex min-w-[260px] items-start gap-4">
            <PatientAvatar image={patientImage} name={patientName} />

            <div>
              {/* ID + STATUS */}

              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-slate-500">
                  #Apt{shortAppointmentId}
                </span>

                <Badge className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500 hover:bg-rose-50">
                  New
                </Badge>

                <Badge className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50">
                  Paid
                </Badge>
              </div>

              {/* PATIENT NAME */}

              <h3 className="text-base font-semibold capitalize text-slate-900">
                {patientName}
              </h3>

              {/* DATE */}

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <FiCalendar className="shrink-0 text-slate-400" />

                <span>
                  {date}
                  {startTime ? ` ${startTime}` : ""}
                </span>
              </div>

              {/* TIME SLOT */}

              {startTime && endTime && (
                <p className="mt-1 pl-6 text-xs text-slate-400">
                  {startTime} - {endTime}
                </p>
              )}
            </div>
          </div>

          {/* ============================================= */}
          {/* APPOINTMENT REASON */}
          {/* ============================================= */}

          <div className="xl:min-w-[190px] xl:max-w-[230px]">
            <p className="mb-1 text-xs font-medium text-slate-400">
              Appointment
            </p>

            <p className="line-clamp-2 text-sm font-medium text-slate-800">
              {reason}
            </p>
          </div>

          {/* ============================================= */}
          {/* APPOINTMENT TYPE */}
          {/* ============================================= */}

          <div className="xl:min-w-[165px]">
            <p className="mb-1 text-xs font-medium text-slate-400">
              Type of Appointment
            </p>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              {getAppointmentIcon(appointmentType)}

              {appointmentType}
            </div>
          </div>

          {/* ============================================= */}
          {/* ACTIONS */}
          {/* ============================================= */}

          <div className="flex min-w-[210px] items-center gap-3">
            {/* ACCEPT */}

            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => onAccept(appointment._id)}
              className="h-10 flex-1 rounded-lg bg-[#0e82fd] px-5 text-white hover:bg-[#0875e8]"
            >
              {actionLoading ? (
                <FiLoader className="mr-1.5 animate-spin text-base" />
              ) : (
                <FiCheck className="mr-1.5 text-base" />
              )}
              Accept
            </Button>

            {/* REJECT */}

            <Button
              type="button"
              variant="outline"
              disabled={actionLoading}
              onClick={() => onReject(appointment)}
              className="h-10 flex-1 rounded-lg border-red-200 bg-white px-5 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <FiX className="mr-1.5 text-base" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ======================================================
// PATIENT AVATAR
// ======================================================

const PatientAvatar = ({ image, name }) => {
  const [imageError, setImageError] = useState(false);

  // ====================================================
  // FALLBACK AVATAR
  // ====================================================

  if (!image || imageError) {
    return (
      <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FiUser className="text-2xl" />
      </div>
    );
  }

  // ====================================================
  // PATIENT IMAGE
  // ====================================================

  return (
    <img
      src={image}
      alt={name}
      onError={() => setImageError(true)}
      className="h-[62px] w-[62px] shrink-0 rounded-full object-cover"
    />
  );
};

// ======================================================
// REJECT APPOINTMENT POPUP
// ======================================================

const RejectAppointmentDialog = ({
  appointment,
  reason,
  setReason,
  error,
  loading,
  onClose,
  onReject,
}) => {
  const patientName = getPatientName(appointment);

  const appointmentDate = formatAppointmentDate(appointment?.appointmentDate);

  const startTime = formatTime(appointment?.timeSlot?.startTime);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Reject Appointment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Please provide a reason for rejecting this request.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* ============================================= */}
        {/* PATIENT INFORMATION */}
        {/* ============================================= */}

        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <p className="font-semibold capitalize text-slate-900">
            {patientName}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>{appointmentDate}</span>

            {startTime && (
              <>
                <span>•</span>

                <span>{startTime}</span>
              </>
            )}

            <span>•</span>

            <span>{appointment?.appointmentType || "Clinic"}</span>
          </div>
        </div>

        {/* ============================================= */}
        {/* FORM */}
        {/* ============================================= */}

        <div className="px-6 py-5">
          <label
            htmlFor="rejectionReason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Reason for rejection
            <span className="ml-1 text-red-500">*</span>
          </label>

          <Textarea
            id="rejectionReason"
            value={reason}
            disabled={loading}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: I am unavailable at the selected appointment time."
            rows={5}
            maxLength={500}
            className="resize-none"
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <p className="shrink-0 text-xs text-slate-400">
              {reason.length}/500
            </p>
          </div>
        </div>

        {/* ============================================= */}
        {/* ACTION BUTTONS */}
        {/* ============================================= */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="sm:min-w-[100px]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={onReject}
            className="bg-red-500 text-white hover:bg-red-600 sm:min-w-[160px]"
          >
            {loading ? (
              <>
                <FiLoader className="mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <FiX className="mr-2" />
                Reject Appointment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// LOADING STATE
// ======================================================

const LoadingState = () => {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
      <FiLoader className="mb-3 animate-spin text-3xl text-[#0e82fd]" />

      <p className="text-sm font-medium text-slate-700">
        Loading appointment requests...
      </p>

      <p className="mt-1 text-xs text-slate-400">Please wait a moment.</p>
    </div>
  );
};

// ======================================================
// EMPTY STATE
// ======================================================

const EmptyState = ({ filter }) => {
  let message = "There are currently no pending appointment requests.";

  if (filter === "today") {
    message = "There are no pending appointment requests for today.";
  }

  if (filter === "this-month") {
    message = "There are no pending appointment requests for this month.";
  }

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <FiCalendar className="text-2xl text-[#0e82fd]" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">
        No Pending Requests
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
};
