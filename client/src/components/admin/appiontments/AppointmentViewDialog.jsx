import React, { useState } from "react";

import {
  FaCalendarCheck,
  FaCalendarDays,
  FaClock,
  FaCreditCard,
  FaHospital,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaUserDoctor,
  FaFileMedical,
  FaCircleInfo,
  FaLocationDot,
  FaCheck,
  FaXmark,
  FaShieldHeart,
  FaReceipt,
  FaStethoscope,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ==========================================
// HELPERS
// ==========================================

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const dateOnly = String(date).slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) return dateOnly;

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

function StatusPill({ status }) {
  const config = statusConfig[status] || {
    label: status || "Unknown",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="text-sm" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        {Icon && <Icon className="text-[11px]" />}
        {label}
      </div>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value === undefined || value === null || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function ProfileCard({ image, name, subtitle, label, type = "patient" }) {
  const [failed, setFailed] = useState(false);

  const Icon = type === "doctor" ? FaUserDoctor : FaUser;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="flex items-center gap-3">
        {image && !failed ? (
          <img
            key={image}
            src={image}
            alt={name || "Profile"}
            onError={() => setFailed(true)}
            className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Icon className="text-lg" />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {name || "Unknown"}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {subtitle || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, status }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-[11px] font-medium text-slate-400">{label}</p>

      <StatusPill status={status} />
    </div>
  );
}

function BillingRow({ label, value, negative = false }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">
        {negative && Number(value) > 0 ? "− " : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AppointmentViewDialog({
  open,
  onOpenChange,
  appointment,
}) {
  if (!appointment) return null;

  const raw = appointment.raw || {};
  const details = raw.patientDetails || {};

  const startTime =
    appointment.startTime || raw.timeSlot?.startTime || appointment.time || "";

  const endTime = appointment.endTime || raw.timeSlot?.endTime || "";

  const timeDisplay = endTime ? `${startTime} – ${endTime}` : startTime || "—";

  const totalAmount = raw.totalAmount ?? appointment.totalAmount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-[780px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-[780px]">
        {/* HEADER */}

        <div className="shrink-0 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-5 py-5 text-white sm:px-7">
          <DialogHeader>
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaCalendarCheck className="text-xl text-white" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-left text-xl font-bold text-white">
                  Appointment Overview
                </DialogTitle>

                <DialogDescription className="mt-1 text-left text-xs text-blue-100">
                  Patient visit, doctor response and payment details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-blue-100">
                Booking Reference
              </p>
              <p className="mt-1 break-all text-xs font-semibold text-white sm:text-sm">
                #{appointment.id || "N/A"}
              </p>
            </div>

            <StatusPill status={appointment.status} />
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 sm:px-7">
          {/* PROFILES */}

          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileCard
              key={`patient-${appointment.id}`}
              image={appointment.patientImage}
              name={appointment.patientName}
              subtitle={appointment.patientEmail}
              label="Patient"
              type="patient"
            />

            <ProfileCard
              key={`doctor-${appointment.id}`}
              image={appointment.doctorImage}
              name={appointment.doctorName}
              subtitle={appointment.speciality}
              label="Consulting Doctor"
              type="doctor"
            />
          </div>

          {/* APPOINTMENT INFORMATION */}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={FaCalendarDays}
              title="Appointment Information"
              subtitle="Schedule and visit details"
            />

            <div className="grid grid-cols-2 gap-x-5 gap-y-5">
              <DetailItem
                icon={FaCalendarDays}
                label="Appointment Date"
                value={formatDate(appointment.date)}
              />

              <DetailItem
                icon={FaClock}
                label="Time Slot"
                value={timeDisplay}
              />

              <DetailItem
                icon={FaHospital}
                label="Visit Type"
                value={appointment.type}
              />

              <DetailItem
                icon={FaLocationDot}
                label="Hospital"
                value={appointment.hospital || raw.doctor?.hospital}
              />
            </div>
          </section>

          {/* STATUS */}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={FaShieldHeart}
              title="Booking Status"
              subtitle="Latest appointment and payment states"
            />

            <div className="grid grid-cols-3 gap-2">
              <StatusCard label="Appointment" status={appointment.status} />

              <StatusCard
                label="Payment"
                status={appointment.paymentStatus || raw.paymentStatus}
              />

              <StatusCard
                label="Doctor"
                status={appointment.doctorStatus || raw.doctorStatus}
              />
            </div>

            {raw.rejectionReason && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Rejection Reason</p>
                <p className="mt-1">{raw.rejectionReason}</p>
              </div>
            )}

            {raw.cancellationReason && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
                <p className="font-semibold">Cancellation Reason</p>
                <p className="mt-1">{raw.cancellationReason}</p>
              </div>
            )}
          </section>

          {/* PATIENT CONTACT */}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={FaUser}
              title="Patient Information"
              subtitle="Contact and booking details"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                icon={FaPhone}
                label="Phone Number"
                value={appointment.patientPhone}
              />

              <DetailItem
                icon={FaEnvelope}
                label="Email Address"
                value={appointment.patientEmail}
              />

              <DetailItem
                icon={FaUser}
                label="Registered Account"
                value={appointment.registeredPatientName || raw.patient?.name}
              />

              <DetailItem
                icon={FaUserDoctor}
                label="Speciality"
                value={appointment.speciality}
              />
            </div>

            {(appointment.symptoms || details.symptoms) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <FaFileMedical />
                  Patient Symptoms
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                  {appointment.symptoms || details.symptoms}
                </p>
              </div>
            )}
          </section>

          {/* BILLING */}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={FaReceipt}
              title="Payment Summary"
              subtitle="Consultation charges and total"
            />

            <div className="space-y-3">
              <BillingRow
                label="Consultation Fee"
                value={raw.consultationFee}
              />

              <BillingRow label="Booking Fee" value={raw.bookingFee} />

              <BillingRow label="Tax" value={raw.tax} />

              <BillingRow label="Discount" value={raw.discount} negative />

              <Separator />

              <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-4 py-4">
                <div>
                  <p className="text-xs text-blue-600">Total Amount</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sri Lankan Rupees
                  </p>
                </div>

                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER NOTE */}

          <div className="flex items-start gap-2 text-xs text-slate-400">
            <FaCircleInfo className="mt-0.5 shrink-0" />
            <p>
              Appointment and payment information is read-only. Changes must be
              processed through authorized workflows.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FaCreditCard />
            Secure appointment record
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <FaXmark className="text-xs" />
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
