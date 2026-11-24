import React, { useMemo } from "react";

import DoctorAppointmentCard from "./DoctorAppointmentCard";

/**
 * ============================================================
 * DOCTOR APPOINTMENTS LIST
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Receive appointments from parent page
 * 2. Validate appointment data
 * 3. Render DoctorAppointmentCard
 * 4. Forward status-change callback
 * 5. Forward medical-record callback
 * 6. Display empty state
 *
 * Flow:
 *
 * DoctorAppointmentsListPage
 *          ↓
 * DoctorAppointmentsList
 *          ↓
 * DoctorAppointmentCard
 *          ↓
 * Eye Button
 *          ↓
 * onViewMedicalRecord(appointment)
 *          ↓
 * ConsultationRecordModal
 *
 * ============================================================
 */

export default function DoctorAppointmentsList({
  appointments = [],
  onStatusChange,
  onViewMedicalRecord,
}) {
  // ==========================================================
  // SAFE APPOINTMENTS
  // ==========================================================

  const safeAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) {
      console.warn(
        "DoctorAppointmentsList expected appointments to be an array.",
        appointments,
      );

      return [];
    }

    return appointments.filter(Boolean);
  }, [appointments]);

  // ==========================================================
  // DEVELOPMENT DEBUGGING
  // ==========================================================

  if (import.meta.env.DEV) {
    console.log("==========================================");

    console.log("DoctorAppointmentsList appointments:", safeAppointments);

    console.log("DoctorAppointmentsList count:", safeAppointments.length);

    console.log("DoctorAppointmentsList onStatusChange:", onStatusChange);

    console.log(
      "DoctorAppointmentsList onViewMedicalRecord:",
      onViewMedicalRecord,
    );

    console.log("==========================================");
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (safeAppointments.length === 0) {
    return <AppointmentsEmptyState />;
  }

  // ==========================================================
  // LIST
  // ==========================================================

  return (
    <div className="w-full">
      <div className="space-y-3 sm:space-y-4">
        {safeAppointments.map((appointment, index) => {
          const key =
            appointment?._id ||
            appointment?.id ||
            `doctor-appointment-${index}`;

          return (
            <DoctorAppointmentCard
              key={key}
              appointment={appointment}
              onStatusChange={onStatusChange}
              onViewMedicalRecord={onViewMedicalRecord}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function AppointmentsEmptyState() {
  return (
    <div
      className="
        flex
        min-h-[260px]
        w-full
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-slate-300
        bg-white
        px-5
        py-12
        text-center
        shadow-sm
      "
    >
      <div className="mx-auto max-w-sm">
        {/* Icon */}

        <div
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6 text-slate-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 2v3M16 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.5 15 1.6 1.6 3.5-3.6"
            />
          </svg>
        </div>

        {/* Title */}

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          No appointments found
        </h3>

        {/* Description */}

        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          There are no appointments matching the selected tab or search
          criteria.
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Try another tab or change your search.
        </p>
      </div>
    </div>
  );
}
