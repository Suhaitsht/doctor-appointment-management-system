import React from "react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { FaCalendarCheck } from "react-icons/fa6";

// ==========================================
// DATE FORMAT
// ==========================================

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(parsedDate);
};

// ==========================================
// TIME FORMAT
// ==========================================

const formatTime = (time) => {
  if (!time || typeof time !== "string") {
    return "—";
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) return "—";

  const hours = Number(match[1]);
  const minutes = match[2];

  const period = hours >= 12 ? "PM" : "AM";

  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${minutes} ${period}`;
};

// ==========================================
// CURRENCY FORMAT
// ==========================================

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// ==========================================
// DOCTOR NAME
// ==========================================

const getDoctorName = (doctor) => {
  if (!doctor) return "Unknown Doctor";

  if (typeof doctor === "string") {
    return "Unknown Doctor";
  }

  const fullName = [doctor.firstName, doctor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return doctor.name || doctor.user?.name || fullName || "Unknown Doctor";
};

// ==========================================
// DOCTOR SPECIALITY
// ==========================================

const getDoctorSpeciality = (doctor) => {
  if (!doctor || typeof doctor !== "object") {
    return "—";
  }

  const speciality =
    doctor.speciality ||
    doctor.specialization ||
    doctor.specialty ||
    doctor.user?.speciality;

  if (typeof speciality === "string") {
    return speciality;
  }

  if (speciality && typeof speciality === "object") {
    return speciality.name || "—";
  }

  return "—";
};

// ==========================================
// PATIENT NAME
// ==========================================

const getPatientName = (appointment) => {
  if (appointment.patientName) {
    return appointment.patientName;
  }

  const patient = appointment.patient;

  if (!patient || typeof patient !== "object") {
    return "Unknown Patient";
  }

  const fullName = [patient.firstName, patient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || patient.name || "Unknown Patient";
};

// ==========================================
// APPOINTMENT STATUS
// ==========================================

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",

  confirmed: "bg-blue-100 text-blue-700 hover:bg-blue-100",

  completed: "bg-green-100 text-green-700 hover:bg-green-100",

  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || "Unknown";
};

// ==========================================
// MAIN APPOINTMENTS TABLE
// ==========================================

export default function AppointmentsTable({
  appointments = [],
  loading = false,
}) {
  const appointmentList = Array.isArray(appointments) ? appointments : [];

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Appointment List
        </h3>

        <span className="text-xs text-slate-400">Recent Appointments</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* TABLE HEADER */}
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Doctor Name</th>

              <th className="px-4 py-3 font-semibold">Speciality</th>

              <th className="px-4 py-3 font-semibold">Patient Name</th>

              <th className="px-4 py-3 font-semibold">Appointment Time</th>

              <th className="px-4 py-3 font-semibold">Status</th>

              <th className="px-4 py-3 font-semibold">Amount</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {/* LOADING */}
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading appointments...
                </td>
              </tr>
            ) : appointmentList.length === 0 ? (
              /* EMPTY STATE */
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FaCalendarCheck className="text-2xl" />

                    <p>No appointments found</p>
                  </div>
                </td>
              </tr>
            ) : (
              /* DYNAMIC APPOINTMENTS */
              appointmentList.map((appointment) => {
                const doctorName = getDoctorName(appointment.doctor);

                const speciality = getDoctorSpeciality(appointment.doctor);

                const patientName = getPatientName(appointment);

                const appointmentDate = formatDate(appointment.appointmentDate);

                const appointmentTime = formatTime(
                  appointment.timeSlot?.startTime,
                );

                const status = appointment.status || "pending";

                const amount =
                  appointment.totalAmount ??
                  appointment.consultationFee ??
                  null;

                return (
                  <tr
                    key={appointment._id || appointment.id}
                    className="border-t transition-colors hover:bg-slate-50"
                  >
                    {/* DOCTOR NAME */}
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {doctorName}
                    </td>

                    {/* SPECIALITY */}
                    <td className="px-4 py-3 text-slate-600">{speciality}</td>

                    {/* PATIENT NAME */}
                    <td className="px-4 py-3 text-slate-600">{patientName}</td>

                    {/* APPOINTMENT DATE + TIME */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">
                        {appointmentDate}
                      </p>

                      <p className="mt-1 text-blue-500">{appointmentTime}</p>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          STATUS_STYLES[status] || "bg-slate-100 text-slate-600"
                        }
                      >
                        {getStatusLabel(status)}
                      </Badge>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
