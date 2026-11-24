import React from "react";

import { Card } from "@/components/ui/card";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { FaCalendarDays, FaClock, FaUsers } from "react-icons/fa6";

// ======================================================
// BACKEND BASE URL
// ======================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ======================================================
// PROFILE IMAGE HELPER
// ======================================================

const getPatientImage = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${BACKEND_URL}/${image.replace(/^\/+/, "")}`;
};

// ======================================================
// FORMAT APPOINTMENT DATE
// ======================================================

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
};

// ======================================================
// FORMAT TIME
// ======================================================

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return time;
  }

  const period = hours >= 12 ? "PM" : "AM";

  const formattedHour = hours % 12 || 12;

  return `${formattedHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

// ======================================================
// GET APPOINTMENT STATUS
// ======================================================

const getPatientStatus = (patient) => {
  if (patient.status === "completed") {
    return {
      label: "Completed",
      className: "bg-green-100 text-green-700",
    };
  }

  if (patient.status === "cancelled") {
    return {
      label: "Cancelled",
      className: "bg-red-100 text-red-700",
    };
  }

  if (patient.doctorStatus === "rejected") {
    return {
      label: "Rejected",
      className: "bg-red-100 text-red-700",
    };
  }

  if (patient.doctorStatus === "pending") {
    return {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  if (patient.doctorStatus === "accepted") {
    return {
      label: "Accepted",
      className: "bg-blue-100 text-blue-700",
    };
  }

  return {
    label: patient.status || "Pending",
    className: "bg-gray-100 text-gray-700",
  };
};

// ======================================================
// RECENT PATIENTS COMPONENT
// ======================================================

export default function RecentPatients({ patients = [] }) {
  const patientList = Array.isArray(patients) ? patients : [];

  return (
    <Card className="w-full border-slate-200 bg-white p-4 shadow-sm">
      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recent Patients
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Latest patient appointments
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          {patientList.length} Records
        </span>
      </div>

      {/* EMPTY STATE */}

      {patientList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-10 text-center">
          <FaUsers className="mb-3 text-3xl text-slate-300" />

          <h3 className="text-sm font-semibold text-slate-700">
            No Recent Patients
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Your recent patient appointments will appear here.
          </p>
        </div>
      ) : (
        /* REAL PATIENT DATA */

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {patientList.map((patient, index) => {
            const name = patient.name?.trim() || "Unknown Patient";

            const image = getPatientImage(patient.image);

            const status = getPatientStatus(patient);

            const patientId = patient.patientId
              ? String(patient.patientId).slice(-8).toUpperCase()
              : "N/A";

            const startTime = formatTime(patient.timeSlot?.startTime);

            const endTime = formatTime(patient.timeSlot?.endTime);

            return (
              <div
                key={patient.appointmentId || `${patient.patientId}-${index}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:shadow-sm"
              >
                {/* PATIENT IMAGE */}

                <div className="mb-3 flex items-start justify-between gap-2">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage
                      src={image}
                      alt={name}
                      className="object-cover"
                    />

                    <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-700">
                      {name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((word) => word.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* PATIENT NAME */}

                <h4 className="truncate text-sm font-semibold text-slate-800">
                  {name}
                </h4>

                {/* PATIENT ID */}

                <p className="mt-1 text-[10px] text-blue-600">
                  ID: {patientId}
                </p>

                {/* APPOINTMENT DETAILS */}

                <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                  {/* DATE */}

                  <div className="flex items-center gap-2">
                    <FaCalendarDays className="shrink-0 text-xs text-blue-500" />

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Appointment Date
                      </p>

                      <p className="text-xs font-medium text-slate-700">
                        {formatDate(patient.appointmentDate)}
                      </p>
                    </div>
                  </div>

                  {/* TIME */}

                  {(startTime || endTime) && (
                    <div className="flex items-center gap-2">
                      <FaClock className="shrink-0 text-xs text-blue-500" />

                      <div>
                        <p className="text-[10px] text-slate-400">
                          Appointment Time
                        </p>

                        <p className="text-xs font-medium text-slate-700">
                          {startTime}
                          {endTime ? ` - ${endTime}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
