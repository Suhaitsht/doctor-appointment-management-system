import React, { useEffect, useMemo, useState } from "react";

import {
  FaEye,
  FaPenToSquare,
  FaCalendarXmark,
  FaUser,
  FaUserDoctor,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDays,
  FaClock,
  FaVideo,
  FaHospital,
  FaWallet,
  FaClipboardList,
  FaCircleCheck,
  FaCircleXmark,
  FaHourglassHalf,
  FaStethoscope,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ======================================================
// STATUS CONFIGURATION
// ======================================================

const STATUS_CONFIG = {
  appointment: {
    pending: {
      label: "Pending",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: FaHourglassHalf,
    },
    confirmed: {
      label: "Confirmed",
      className: "border-blue-200 bg-blue-50 text-blue-700",
      Icon: FaCircleCheck,
    },
    completed: {
      label: "Completed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: FaCircleCheck,
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: FaCircleXmark,
    },
  },

  payment: {
    pending: {
      label: "Pending",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: FaHourglassHalf,
    },
    paid: {
      label: "Paid",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: FaCircleCheck,
    },
    failed: {
      label: "Failed",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: FaCircleXmark,
    },
    refunded: {
      label: "Refunded",
      className: "border-purple-200 bg-purple-50 text-purple-700",
      Icon: FaWallet,
    },
  },

  doctor: {
    pending: {
      label: "Pending",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: FaHourglassHalf,
    },
    accepted: {
      label: "Accepted",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: FaCircleCheck,
    },
    rejected: {
      label: "Rejected",
      className: "border-red-200 bg-red-50 text-red-700",
      Icon: FaCircleXmark,
    },
  },
};

// ======================================================
// STATUS BADGE
// ======================================================

function StatusBadge({ status, type = "appointment" }) {
  const value = String(status || "unknown").toLowerCase();

  const config = STATUS_CONFIG[type]?.[value];

  const Icon = config?.Icon || FaHourglassHalf;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        config?.className || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <Icon className="text-[10px]" />
      {config?.label || value}
    </span>
  );
}

// ======================================================
// AVATAR
// ======================================================

function AvatarImage({ src, alt, type = "patient" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const Icon = type === "doctor" ? FaUserDoctor : FaUser;

  if (!src || failed) {
    return (
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          type === "doctor"
            ? "bg-indigo-50 text-indigo-500"
            : "bg-blue-50 text-blue-500"
        }`}
      >
        <Icon className="text-sm" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Profile"}
      onError={() => setFailed(true)}
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 object-cover"
    />
  );
}

// ======================================================
// DATE FORMAT
// ======================================================

function formatDisplayDate(value) {
  if (!value) return "—";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return String(value);

  const [, year, month, day] = match;

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// ======================================================
// TIME FORMAT
// ======================================================

function formatDisplayTime(value) {
  if (!value) return "—";

  const match = String(value).match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) return String(value);

  const hour = Number(match[1]);
  const minute = match[2];

  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minute} ${period}`;
}

// ======================================================
// APPOINTMENT ID
// ======================================================

function getShortId(id) {
  if (!id) return "N/A";

  return String(id).slice(-8).toUpperCase();
}

// ======================================================
// PAGINATION
// ======================================================

function getVisiblePages(currentPage, totalPages) {
  const pages = [];

  const start = Math.max(1, currentPage - 2);

  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    pages.push(1);

    if (start > 2) {
      pages.push("start-ellipsis");
    }
  }

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push("end-ellipsis");
    }

    pages.push(totalPages);
  }

  return pages;
}

// ======================================================
// PERSON INFO
// ======================================================

function PersonInfo({ name, subtitle, image, type = "patient" }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarImage src={image} alt={name} type={type} />

      <div className="min-w-0">
        <p
          title={name}
          className="max-w-[190px] truncate text-sm font-semibold text-slate-800"
        >
          {name || (type === "doctor" ? "Unknown Doctor" : "Unknown Patient")}
        </p>

        <p
          title={subtitle}
          className="mt-1 max-w-[200px] truncate text-xs text-slate-400"
        >
          {subtitle || "—"}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// ACTION BUTTONS
// ======================================================

function AppointmentActions({
  appointment,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  const isCancellable = ["pending", "confirmed"].includes(
    String(appointment.status || "").toLowerCase(),
  );

  const allowCancel =
    canDelete && isCancellable && typeof onDelete === "function";

  const allowEdit = canEdit && typeof onEdit === "function";

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onView?.(appointment)}
        disabled={!onView}
        title="View appointment details"
        className="h-9 gap-2 rounded-lg border-blue-100 bg-blue-50 px-3 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
      >
        <FaEye className="text-xs" />
        <span>View</span>
      </Button>

      {canEdit && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={!allowEdit}
          onClick={() => onEdit?.(appointment)}
          title="Edit appointment"
          aria-label="Edit appointment"
          className="h-9 w-9 rounded-lg text-slate-600"
        >
          <FaPenToSquare />
        </Button>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!allowCancel}
        onClick={() => onDelete?.(appointment)}
        title={
          !canDelete
            ? "Cancellation is unavailable"
            : !isCancellable
              ? "Only pending or confirmed appointments can be cancelled"
              : "Cancel appointment"
        }
        className="h-9 gap-2 rounded-lg border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-40"
      >
        <FaCalendarXmark className="text-xs" />
        <span>Cancel</span>
      </Button>
    </div>
  );
}

// ======================================================
// MOBILE APPOINTMENT CARD
// ======================================================

function MobileAppointmentCard({
  appointment,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onView?.(appointment)}
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            #{getShortId(appointment.id)}
          </button>

          <p className="mt-1 text-xs text-slate-400">
            {formatDisplayDate(appointment.date)}
            {" • "}
            {formatDisplayTime(appointment.time)}
          </p>
        </div>

        <StatusBadge status={appointment.status} />
      </div>

      <div className="space-y-3">
        <PersonInfo
          name={appointment.patientName}
          subtitle={appointment.patientEmail}
          image={appointment.patientImage}
        />

        <div className="border-t border-dashed border-slate-100 pt-3">
          <PersonInfo
            name={appointment.doctorName}
            subtitle={appointment.speciality}
            image={appointment.doctorImage}
            type="doctor"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="mb-1 text-[11px] text-slate-400">Consultation</p>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            {appointment.type === "Online" ? (
              <FaVideo className="text-indigo-500" />
            ) : (
              <FaHospital className="text-blue-500" />
            )}

            {appointment.type || "Clinic"}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[11px] text-slate-400">Total Amount</p>

          <p className="text-sm font-bold text-slate-800">
            {appointment.amount || "Rs. 0.00"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[11px] text-slate-400">Payment</p>

          <StatusBadge status={appointment.paymentStatus} type="payment" />
        </div>

        <div>
          <p className="mb-1 text-[11px] text-slate-400">Doctor Decision</p>

          <StatusBadge status={appointment.doctorStatus} type="doctor" />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <AppointmentActions
          appointment={appointment}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}

// ======================================================
// MAIN APPOINTMENTS TABLE
// ======================================================

export default function AppointmentsTable({
  appointments = [],
  filteredCount = 0,
  entries = 10,
  startIndex = 0,
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  const pages = useMemo(
    () => getVisiblePages(currentPage, safeTotalPages),
    [currentPage, safeTotalPages],
  );

  const totalRecords = Math.max(0, Number(filteredCount) || 0);

  const showingFrom = totalRecords === 0 ? 0 : startIndex + 1;

  const showingTo = Math.min(
    startIndex + safeAppointments.length,
    totalRecords,
  );

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* TABLE HEADER */}

      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FaClipboardList className="text-lg" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Appointment Records
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Patient bookings and consultation management
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
          <FaStethoscope className="text-blue-500" />
          {totalRecords} Records
        </span>
      </div>

      {/* DESKTOP TABLE */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1390px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4">Appointment</th>

              <th className="px-5 py-4">Patient</th>

              <th className="px-5 py-4">Doctor</th>

              <th className="px-5 py-4">Date & Time</th>

              <th className="px-5 py-4">Type</th>

              <th className="px-5 py-4">Amount</th>

              <th className="px-5 py-4">Payment</th>

              <th className="px-5 py-4">Status</th>

              <th className="px-5 py-4">Doctor Status</th>

              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {safeAppointments.map((appointment) => (
              <tr
                key={appointment.id}
                className="group transition-colors hover:bg-blue-50/30"
              >
                {/* APPOINTMENT ID */}

                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onView?.(appointment)}
                    title={appointment.id}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    #{getShortId(appointment.id)}
                  </button>
                </td>

                {/* PATIENT */}

                <td className="px-5 py-4">
                  <PersonInfo
                    name={appointment.patientName}
                    subtitle={appointment.patientEmail}
                    image={appointment.patientImage}
                  />
                </td>

                {/* DOCTOR */}

                <td className="px-5 py-4">
                  <PersonInfo
                    name={appointment.doctorName}
                    subtitle={appointment.speciality}
                    image={appointment.doctorImage}
                    type="doctor"
                  />
                </td>

                {/* DATE & TIME */}

                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <FaCalendarDays className="text-slate-400" />
                      {formatDisplayDate(appointment.date)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FaClock className="text-blue-400" />
                      {formatDisplayTime(appointment.time)}
                    </div>
                  </div>
                </td>

                {/* TYPE */}

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                    {appointment.type === "Online" ? (
                      <FaVideo className="text-indigo-500" />
                    ) : (
                      <FaHospital className="text-blue-500" />
                    )}

                    {appointment.type || "Clinic"}
                  </span>
                </td>

                {/* AMOUNT */}

                <td className="px-5 py-4">
                  <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                    {appointment.amount || "Rs. 0.00"}
                  </p>
                </td>

                {/* PAYMENT */}

                <td className="px-5 py-4">
                  <StatusBadge
                    status={appointment.paymentStatus}
                    type="payment"
                  />
                </td>

                {/* APPOINTMENT STATUS */}

                <td className="px-5 py-4">
                  <StatusBadge status={appointment.status} />
                </td>

                {/* DOCTOR STATUS */}

                <td className="px-5 py-4">
                  <StatusBadge
                    status={appointment.doctorStatus}
                    type="doctor"
                  />
                </td>

                {/* ACTIONS */}

                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <AppointmentActions
                      appointment={appointment}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE & TABLET CARDS */}

      <div className="space-y-3 bg-slate-50/50 p-4 lg:hidden">
        {safeAppointments.map((appointment) => (
          <MobileAppointmentCard
            key={appointment.id}
            appointment={appointment}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* EMPTY STATE */}

      {safeAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center border-t border-slate-100 px-5 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FaCalendarDays className="text-2xl" />
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            No appointments found
          </h3>

          <p className="mt-2 max-w-sm text-sm text-slate-500">
            There are no appointments matching the current search and filters.
          </p>
        </div>
      )}

      {/* PAGINATION */}

      <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600">
            Showing{" "}
            <span className="font-bold text-slate-900">{showingFrom}</span> to{" "}
            <span className="font-bold text-slate-900">{showingTo}</span> of{" "}
            <span className="font-bold text-slate-900">{totalRecords}</span>{" "}
            appointments
          </p>

          <p className="text-[11px] text-slate-400">
            {entries} records per page
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage?.((prev) => Math.max(1, prev - 1))}
            className="h-9 gap-1.5 rounded-lg"
          >
            <FaChevronLeft className="text-[10px]" />
            Previous
          </Button>

          {pages.map((page) =>
            typeof page === "number" ? (
              <Button
                key={page}
                type="button"
                size="sm"
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage?.(page)}
                className={`h-9 min-w-9 rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }`}
              >
                {page}
              </Button>
            ) : (
              <span key={page} className="px-1 text-sm text-slate-400">
                ...
              </span>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= safeTotalPages}
            onClick={() =>
              setCurrentPage?.((prev) => Math.min(safeTotalPages, prev + 1))
            }
            className="h-9 gap-1.5 rounded-lg"
          >
            Next
            <FaChevronRight className="text-[10px]" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
