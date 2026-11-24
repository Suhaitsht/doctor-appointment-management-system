import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  FaCalendarDays,
  FaClock,
  FaEye,
  FaArrowRight,
  FaUserDoctor,
} from "react-icons/fa6";

import {
  fetchMyAppointments,
  selectMyAppointments,
  selectMyAppointmentsLoading,
  selectMyAppointmentsError,
} from "@/redux/slices/appointmentSlice";

export default function RecentAppointments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ======================================================
  // REDUX
  // ======================================================

  const appointments = useSelector(selectMyAppointments);

  const loading = useSelector(selectMyAppointmentsLoading);

  const error = useSelector(selectMyAppointmentsError);

  // ======================================================
  // FETCH RECENT APPOINTMENTS
  // ======================================================

  useEffect(() => {
    dispatch(
      fetchMyAppointments({
        page: 1,
        limit: 5,
      }),
    );
  }, [dispatch]);

  // ======================================================
  // SAFE APPOINTMENT LIST
  // ======================================================

  const recentAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) {
      return [];
    }

    return appointments.slice(0, 5);
  }, [appointments]);

  // ======================================================
  // VIEW ALL
  // ======================================================

  const handleViewAll = () => {
    navigate("/patient/appointments");
  };

  // ======================================================
  // VIEW APPOINTMENT
  // ======================================================

  const handleViewAppointment = (appointment) => {
    if (!appointment?._id) {
      console.error("Appointment MongoDB ID missing:", appointment);

      return;
    }

    // For now open patient appointments page.
    // Later we can create a single appointment details modal.
    navigate("/patient/appointments");
  };

  // ======================================================
  // RETRY
  // ======================================================

  const handleRetry = () => {
    dispatch(
      fetchMyAppointments({
        page: 1,
        limit: 5,
      }),
    );
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Appointments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest doctor appointments
          </p>
        </div>

        <button
          type="button"
          onClick={handleViewAll}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
        >
          View All
          <FaArrowRight className="text-xs" />
        </button>
      </div>

      {/* ================================================
          LOADING
      ================================================= */}

      {loading ? (
        <RecentAppointmentsSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRetry} />
      ) : recentAppointments.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ============================================
              DESKTOP TABLE
          ============================================= */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <TableHeading>Doctor</TableHeading>

                  <TableHeading>Appointment</TableHeading>

                  <TableHeading>Type</TableHeading>

                  <TableHeading>Status</TableHeading>

                  <TableHeading align="right">Action</TableHeading>
                </tr>
              </thead>

              <tbody>
                {recentAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    onView={handleViewAppointment}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================
              MOBILE CARDS
          ============================================= */}

          <div className="divide-y divide-slate-100 md:hidden">
            {recentAppointments.map((appointment) => (
              <MobileAppointmentCard
                key={appointment._id}
                appointment={appointment}
                onView={handleViewAppointment}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ======================================================
// DESKTOP ROW
// ======================================================

function AppointmentRow({ appointment, onView }) {
  const doctor = appointment?.doctor;

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const doctorImage = doctor?.user?.image || doctor?.image || "";

  const speciality = doctor?.speciality || "General Medicine";

  const appointmentDate = formatAppointmentDate(appointment?.appointmentDate);

  const appointmentTime = formatTimeSlot(appointment?.timeSlot);

  const appointmentType = appointment?.appointmentType || "Clinic";

  return (
    <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70">
      {/* DOCTOR */}

      <td className="px-6 py-4">
        <DoctorInfo
          name={doctorName}
          image={doctorImage}
          speciality={speciality}
        />
      </td>

      {/* DATE / TIME */}

      <td className="px-6 py-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaCalendarDays className="text-cyan-500" />

            {appointmentDate}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FaClock className="text-slate-400" />

            {appointmentTime}
          </div>
        </div>
      </td>

      {/* TYPE */}

      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-700">
          {appointmentType}
        </span>
      </td>

      {/* STATUS */}

      <td className="px-6 py-4">
        <AppointmentStatus status={appointment?.status} />
      </td>

      {/* ACTION */}

      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={() => onView(appointment)}
          title="View appointment"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
        >
          <FaEye />
        </button>
      </td>
    </tr>
  );
}

// ======================================================
// MOBILE CARD
// ======================================================

function MobileAppointmentCard({ appointment, onView }) {
  const doctor = appointment?.doctor;

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const doctorImage = doctor?.user?.image || doctor?.image || "";

  const speciality = doctor?.speciality || "General Medicine";

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <DoctorInfo
          name={doctorName}
          image={doctorImage}
          speciality={speciality}
        />

        <AppointmentStatus status={appointment?.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Date
          </p>

          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaCalendarDays className="text-cyan-500" />

            {formatAppointmentDate(appointment?.appointmentDate)}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Time
          </p>

          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaClock className="text-cyan-500" />

            {formatTimeSlot(appointment?.timeSlot)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Appointment Type</p>

          <p className="mt-0.5 text-sm font-semibold text-slate-700">
            {appointment?.appointmentType || "Clinic"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onView(appointment)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
        >
          <FaEye />
          View
        </button>
      </div>
    </div>
  );
}

// ======================================================
// DOCTOR INFO
// ======================================================

function DoctorInfo({ name, image, speciality }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
          <FaUserDoctor />
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{name}</p>

        <p className="mt-0.5 truncate text-xs text-slate-500">{speciality}</p>
      </div>
    </div>
  );
}

// ======================================================
// STATUS BADGE
// ======================================================

function AppointmentStatus({ status }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const statusStyles = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",

    confirmed: "border-blue-200 bg-blue-50 text-blue-700",

    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  const style =
    statusStyles[normalizedStatus] ||
    "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {normalizedStatus}
    </span>
  );
}

// ======================================================
// TABLE HEADING
// ======================================================

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// ======================================================
// LOADING
// ======================================================

function RecentAppointmentsSkeleton() {
  return (
    <div className="space-y-3 p-5 md:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-4"
        >
          <div className="h-11 w-11 rounded-full bg-slate-100" />

          <div className="flex-1">
            <div className="h-3 w-32 rounded bg-slate-100" />

            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>

          <div className="hidden h-7 w-20 rounded-full bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

// ======================================================
// ERROR
// ======================================================

function ErrorState({ error, onRetry }) {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-700">
          Unable to load recent appointments
        </p>

        <p className="mt-1 text-sm text-red-600">
          {typeof error === "string"
            ? error
            : error?.message || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ======================================================
// EMPTY
// ======================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        <FaCalendarDays />
      </div>

      <h3 className="mt-4 font-bold text-slate-800">No appointments yet</h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Your recent doctor appointments will appear here.
      </p>
    </div>
  );
}

// ======================================================
// DATE FORMATTER
// ======================================================

function formatAppointmentDate(date) {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ======================================================
// TIME FORMATTER
// ======================================================

function formatTimeSlot(timeSlot) {
  if (!timeSlot) return "N/A";

  if (typeof timeSlot === "string") {
    return timeSlot;
  }

  if (typeof timeSlot === "object") {
    return timeSlot.label || timeSlot.time || timeSlot.startTime || "N/A";
  }

  return "N/A";
}
