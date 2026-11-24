import React, { useState } from "react";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarDays,
  FaLocationDot,
  FaDroplet,
  FaIdCard,
  FaVenusMars,
  FaClock,
  FaCircleCheck,
  FaCircleXmark,
  FaShieldHeart,
  FaXmark,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

// ==========================================
// HELPERS
// ==========================================

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(date);
};

// Calculate actual age from date of birth
// No age field required in MongoDB
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) =>
    Number(parts.find((part) => part.type === type)?.value);

  const currentYear = getPart("year");
  const currentMonth = getPart("month");
  const currentDay = getPart("day");

  // Date-only DOB values are stored at UTC midnight
  const birthYear = dob.getUTCFullYear();
  const birthMonth = dob.getUTCMonth() + 1;
  const birthDay = dob.getUTCDate();

  let age = currentYear - birthYear;

  const birthdayNotPassed =
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay);

  if (birthdayNotPassed) {
    age--;
  }

  return age >= 0 ? age : null;
};

const getAddress = (address) => {
  if (!address) return "Not provided";

  if (typeof address === "string") {
    return address.trim() || "Not provided";
  }

  return (
    [
      address.addressLine,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ") || "Not provided"
  );
};

// ==========================================
// PATIENT AVATAR
// ==========================================

function PatientAvatar({ patient }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-3xl text-blue-600 shadow-sm">
      {patient?.image && !imageFailed ? (
        <img
          src={patient.image}
          alt={patient.name || "Patient"}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <FaUser />
      )}
    </div>
  );
}

// ==========================================
// INFORMATION FIELD
// ==========================================

function InfoField({ icon: Icon, label, value, className = "" }) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? "Not provided"
      : value;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        <Icon className="text-sm" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {displayValue}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// SECTION HEADER
// ==========================================

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="text-sm" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>

        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  );
}

// ==========================================
// MAIN PATIENT VIEW DIALOG
// ==========================================

export default function PatientViewDialog({ open, onOpenChange, patient }) {
  if (!patient) return null;

  const patientId = patient.id || patient._id || "—";

  // Age calculated from DOB only
  const age = calculateAge(patient.dateOfBirth);

  const active = patient.isActive !== false;

  const lastAppointment = patient.lastAppointment || "No appointments";

  const registeredDate = patient.createdAt
    ? formatDate(patient.createdAt)
    : "Not provided";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-[650px]">
        {/* HEADER */}
        <DialogHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Patient Profile
          </DialogTitle>

          <DialogDescription className="text-sm text-slate-500">
            View registered patient information and medical details
          </DialogDescription>
        </DialogHeader>

        {/* PROFILE BANNER */}
        <div className="border-b border-slate-100 bg-blue-50/50 px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PatientAvatar key={patientId} patient={patient} />

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                {patient.name || "Unnamed Patient"}
              </h2>

              <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                <FaIdCard className="text-blue-500" />
                Patient ID: {patientId}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {active ? <FaCircleCheck /> : <FaCircleXmark />}

                  {active ? "Active Account" : "Inactive Account"}
                </span>

                <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-blue-600">
                  {patient.role || "Patient"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div className="space-y-6 px-5 py-6 sm:px-6">
          {/* PERSONAL INFORMATION */}
          <section>
            <SectionHeader
              icon={FaUser}
              title="Personal Information"
              description="Basic patient identity details"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField icon={FaUser} label="Full Name" value={patient.name} />

              <InfoField
                icon={FaCalendarDays}
                label="Age"
                value={age !== null ? `${age} years` : "Not provided"}
              />

              <InfoField
                icon={FaVenusMars}
                label="Gender"
                value={patient.gender}
              />

              <InfoField
                icon={FaCalendarDays}
                label="Date of Birth"
                value={
                  patient.dateOfBirth ? formatDate(patient.dateOfBirth) : null
                }
              />
            </div>
          </section>

          {/* CONTACT INFORMATION */}
          <section>
            <SectionHeader
              icon={FaEnvelope}
              title="Contact Information"
              description="Registered communication details"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                icon={FaEnvelope}
                label="Email Address"
                value={patient.email}
              />

              <InfoField
                icon={FaPhone}
                label="Phone Number"
                value={patient.phone}
              />

              <InfoField
                icon={FaLocationDot}
                label="Residential Address"
                value={getAddress(patient.address)}
                className="sm:col-span-2"
              />
            </div>
          </section>

          {/* MEDICAL INFORMATION */}
          <section>
            <SectionHeader
              icon={FaShieldHeart}
              title="Medical & Appointment Information"
              description="Available medical profile details"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                icon={FaDroplet}
                label="Blood Group"
                value={patient.bloodGroup}
              />

              <InfoField
                icon={FaCalendarDays}
                label="Last Appointment"
                value={lastAppointment}
              />
            </div>
          </section>

          {/* ACCOUNT INFORMATION */}
          <section>
            <SectionHeader
              icon={FaIdCard}
              title="Account Information"
              description="Registration and account details"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                icon={FaClock}
                label="Registered Date"
                value={registeredDate}
              />

              <InfoField
                icon={FaCircleCheck}
                label="Account Status"
                value={active ? "Active" : "Inactive"}
              />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2 rounded-xl border-slate-200 px-5"
          >
            <FaXmark className="text-xs" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
