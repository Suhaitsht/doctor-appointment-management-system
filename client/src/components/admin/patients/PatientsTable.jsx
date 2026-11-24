import React, { useState } from "react";

import {
  FaCalendarDays,
  FaEye,
  FaPenToSquare,
  FaPhone,
  FaTrash,
  FaEnvelope,
  FaLocationDot,
  FaUser,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaDroplet,
  FaCircleCheck,
  FaCircleXmark,
} from "react-icons/fa6";

import { Button } from "@/components/ui/button";

// ============================================
// AVATAR
// ============================================

function PatientAvatar({ patient, size = "md" }) {
  const [imageFailed, setImageFailed] = useState(false);

  const sizeClasses =
    size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";

  const image = patient?.image;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-600 ${sizeClasses}`}
    >
      {image && !imageFailed ? (
        <img
          src={image}
          alt={patient?.name || "Patient"}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <FaUser />
      )}
    </div>
  );
}

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ isActive }) {
  const active = isActive !== false;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {active ? <FaCircleCheck /> : <FaCircleXmark />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ============================================
// ACTION BUTTONS
// ============================================

function PatientActions({ patient, onView, onEdit, onDelete, mobile = false }) {
  return (
    <div
      className={`flex items-center gap-2 ${mobile ? "w-full" : "justify-end"}`}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onView?.(patient)}
        title="View Patient"
        className={`gap-2 rounded-lg border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 ${
          mobile ? "flex-1" : ""
        }`}
      >
        <FaEye />
        {mobile && "View"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onEdit?.(patient)}
        title="Edit Patient"
        className={`gap-2 rounded-lg border-slate-200 text-blue-600 hover:border-blue-200 hover:bg-blue-50 ${
          mobile ? "flex-1" : ""
        }`}
      >
        <FaPenToSquare />
        {mobile && "Edit"}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onDelete?.(patient)}
        title="Delete Patient"
        className={`gap-2 rounded-lg border-red-100 text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${
          mobile ? "flex-1" : ""
        }`}
      >
        <FaTrash />
        {mobile && "Delete"}
      </Button>
    </div>
  );
}

// ============================================
// MOBILE PATIENT CARD
// ============================================

function MobilePatientCard({ patient, onView, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <PatientAvatar patient={patient} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{patient.name}</p>

          <p className="mt-1 text-xs font-medium text-blue-600">
            #{patient.id || patient._id}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {patient.email || "No email"}
          </p>
        </div>

        <StatusBadge isActive={patient.isActive} />
      </div>

      <div className="my-4 border-t border-slate-100" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs text-slate-400">Age</p>
          <p className="text-sm font-medium text-slate-700">
            {patient.age ?? "—"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs text-slate-400">Blood Group</p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <FaDroplet className="text-red-400" />
            {patient.bloodGroup || "—"}
          </p>
        </div>

        <div className="col-span-2">
          <p className="mb-1 text-xs text-slate-400">Phone</p>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaPhone className="text-xs text-blue-500" />
            {patient.phone || "—"}
          </p>
        </div>

        <div className="col-span-2">
          <p className="mb-1 text-xs text-slate-400">Address</p>
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <FaLocationDot className="mt-1 shrink-0 text-xs text-slate-400" />
            <span>{patient.address || "Not provided"}</span>
          </p>
        </div>

        <div className="col-span-2">
          <p className="mb-1 text-xs text-slate-400">Last Appointment</p>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FaCalendarDays className="text-xs text-blue-500" />
            {patient.lastAppointment || "No appointments"}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <PatientActions
          patient={patient}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          mobile
        />
      </div>
    </div>
  );
}

// ============================================
// PAGINATION
// ============================================

function Pagination({
  filteredCount,
  entries,
  startIndex,
  currentPage,
  totalPages,
  setCurrentPage,
}) {
  const safeTotalPages = Math.max(1, totalPages);

  const from = filteredCount === 0 ? 0 : startIndex + 1;

  const to = Math.min(startIndex + entries, filteredCount);

  // Display only nearby page numbers
  const pages = [];

  for (
    let page = Math.max(1, currentPage - 2);
    page <= Math.min(safeTotalPages, currentPage + 2);
    page++
  ) {
    pages.push(page);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-800">{from}</span> to{" "}
        <span className="font-semibold text-slate-800">{to}</span> of{" "}
        <span className="font-semibold text-slate-800">{filteredCount}</span>{" "}
        patients
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className="gap-1 rounded-lg"
        >
          <FaChevronLeft className="text-xs" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            size="sm"
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => setCurrentPage(page)}
            className={`h-9 min-w-9 rounded-lg ${
              currentPage === page
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {page}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= safeTotalPages}
          onClick={() =>
            setCurrentPage((prev) => Math.min(safeTotalPages, prev + 1))
          }
          className="gap-1 rounded-lg"
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight className="text-xs" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PATIENTS TABLE
// ============================================

export default function PatientsTable({
  patients = [],
  filteredCount = 0,
  entries = 10,
  startIndex = 0,
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="w-full overflow-hidden bg-white">
      {/* DESKTOP TABLE */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-4">Patient</th>
              <th className="px-5 py-4">Patient ID</th>
              <th className="px-5 py-4">Age</th>
              <th className="px-5 py-4">Blood Group</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Address</th>
              <th className="px-5 py-4">Last Appointment</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr
                key={patient.id || patient._id}
                className="group transition-colors hover:bg-blue-50/30"
              >
                {/* PATIENT */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <PatientAvatar patient={patient} />

                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate font-semibold text-slate-900">
                        {patient.name}
                      </p>

                      <p className="max-w-[180px] truncate text-xs text-slate-400">
                        {patient.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* PATIENT ID */}

                <td className="px-5 py-4">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600">
                    #{patient.id || patient._id}
                  </span>
                </td>

                {/* AGE */}

                <td className="px-5 py-4 text-slate-600">
                  {patient.age ?? "—"}
                </td>

                {/* BLOOD GROUP */}

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <FaDroplet className="text-red-400" />
                    {patient.bloodGroup || "—"}
                  </span>
                </td>

                {/* CONTACT */}

                <td className="px-5 py-4">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-xs text-slate-600">
                      <FaPhone className="text-slate-400" />
                      {patient.phone || "—"}
                    </p>

                    <p className="flex max-w-[180px] items-center gap-2 truncate text-xs text-slate-500">
                      <FaEnvelope className="shrink-0 text-slate-400" />
                      <span className="truncate">{patient.email || "—"}</span>
                    </p>
                  </div>
                </td>

                {/* ADDRESS */}

                <td className="max-w-[220px] px-5 py-4">
                  <div className="flex items-start gap-2">
                    <FaLocationDot className="mt-1 shrink-0 text-xs text-slate-400" />
                    <p
                      title={patient.address || ""}
                      className="max-w-[180px] truncate text-xs text-slate-600"
                    >
                      {patient.address || "Not provided"}
                    </p>
                  </div>
                </td>

                {/* LAST APPOINTMENT */}

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
                    <FaCalendarDays className="text-blue-500" />
                    {patient.lastAppointment || "No appointments"}
                  </span>
                </td>

                {/* STATUS */}

                <td className="px-5 py-4">
                  <StatusBadge isActive={patient.isActive} />
                </td>

                {/* ACTIONS */}

                <td className="px-5 py-4">
                  <PatientActions
                    patient={patient}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET */}

      <div className="space-y-3 bg-slate-50/70 p-4 lg:hidden">
        {patients.map((patient) => (
          <MobilePatientCard
            key={patient.id || patient._id}
            patient={patient}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* EMPTY STATE */}

      {patients.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <FaUsers className="text-2xl" />
          </div>

          <h3 className="text-base font-semibold text-slate-900">
            No patients found
          </h3>

          <p className="max-w-sm text-sm text-slate-500">
            There are no patient records matching your current search.
          </p>
        </div>
      )}

      {/* PAGINATION */}

      <Pagination
        filteredCount={filteredCount}
        entries={entries}
        startIndex={startIndex}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
