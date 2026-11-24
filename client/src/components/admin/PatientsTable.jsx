import React, { useState } from "react";
import { Card } from "@/components/ui/card";

import { FaUser, FaUsers } from "react-icons/fa6";

// ==========================================
// API BASE URL
// ==========================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// FORMAT DATE
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
// FORMAT CURRENCY
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
// PATIENT AVATAR
// ==========================================

function PatientAvatar({ image, name }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  if (!imageUrl || imageFailed) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <FaUser className="text-sm" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setImageFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

// ==========================================
// MAIN PATIENTS TABLE
// ==========================================

export default function PatientsTable({ patients = [], loading = false }) {
  const patientList = Array.isArray(patients) ? patients : [];

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Patients List</h3>

        <span className="text-xs text-slate-400">Recent Patients</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* TABLE HEAD */}
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Patient Name</th>

              <th className="px-4 py-3 font-semibold">Phone</th>

              <th className="px-4 py-3 font-semibold">Last Visit</th>

              <th className="px-4 py-3 font-semibold">Paid</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading patients...
                </td>
              </tr>
            ) : patientList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FaUsers className="text-2xl" />
                    <p>No patients found</p>
                  </div>
                </td>
              </tr>
            ) : (
              patientList.map((patient) => {
                const patientName =
                  patient.displayName ||
                  patient.name ||
                  [patient.firstName, patient.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "Unknown Patient";

                const lastVisit =
                  patient.lastVisit ?? patient.lastAppointment ?? null;

                const paidAmount = patient.totalPaid ?? patient.paid ?? null;

                return (
                  <tr
                    key={patient._id || patient.id}
                    className="border-t transition-colors hover:bg-slate-50"
                  >
                    {/* PATIENT NAME */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PatientAvatar
                          image={patient.image}
                          name={patientName}
                        />

                        <span className="min-w-[100px] font-medium text-slate-800">
                          {patientName}
                        </span>
                      </div>
                    </td>

                    {/* PHONE */}
                    <td className="px-4 py-3 text-slate-600">
                      {patient.phone || "—"}
                    </td>

                    {/* LAST VISIT */}
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(lastVisit)}
                    </td>

                    {/* PAID */}
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatCurrency(paidAmount)}
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
