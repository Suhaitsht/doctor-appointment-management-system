import React, { useState } from "react";

import {
  FaCalendarDays,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaUser,
  FaUserDoctor,
  FaClock,
  FaHashtag,
  FaEnvelope,
  FaPhone,
  FaCircleInfo,
  FaMoneyBillTransfer,
  FaCopy,
  FaCheck,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ======================================================
// CURRENCY FORMATTER
// ======================================================

const formatAmount = (amount, currency = "LKR") => {
  const value = Number(amount) || 0;

  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

// ======================================================
// DATE FORMATTER
// ======================================================

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatAppointmentDate = (value) => {
  if (!value) return "—";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

// ======================================================
// PAYMENT STATUS BADGE
// ======================================================

function PaymentStatus({ status }) {
  const value = String(status || "pending").toLowerCase();

  const styles = {
    paid: "border-green-200 bg-green-50 text-green-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-700",
    refunded: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-3 py-1 capitalize ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {value}
    </Badge>
  );
}

// ======================================================
// PATIENT AVATAR
// ======================================================

function PatientAvatar({ image, name }) {
  const [failedSrc, setFailedSrc] = useState(null);

  const showImage = Boolean(image) && failedSrc !== image;

  return showImage ? (
    <img
      src={image}
      alt={name || "Patient"}
      className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
      onError={() => setFailedSrc(image)}
    />
  ) : (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
      <FaUser className="text-2xl" />
    </div>
  );
}

// ======================================================
// INFORMATION FIELD
// ======================================================

function Info({ icon, label, value, mono = false }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 shrink-0 text-cyan-600">{icon}</span>}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <div
            className={`mt-1 break-words text-sm font-semibold text-slate-800 ${
              mono ? "font-mono text-xs" : ""
            }`}
          >
            {value === null || value === undefined || value === ""
              ? "—"
              : value}
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SECTION TITLE
// ======================================================

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-cyan-600">{icon}</span>

      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

// ======================================================
// MAIN TRANSACTION VIEW DIALOG
// ======================================================

export default function TransactionViewDialog({
  open,
  onOpenChange,
  transaction,
}) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  // ORIGINAL POPULATED DATA
  const patient = transaction.patient || {};
  const appointment = transaction.appointment || {};
  const doctor = appointment.doctor || {};

  // PAYMENT DETAILS
  const orderId = transaction.orderId || transaction.invoiceNumber || "—";

  const paymentId = transaction.paymentId || "—";

  const currency = transaction.currency || "LKR";

  const amount = formatAmount(transaction.amount, currency);

  // PATIENT DETAILS
  const patientName =
    transaction.patientName ||
    [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
    patient.name ||
    "Unknown Patient";

  const patientId = patient._id || transaction.patientId || "—";

  const patientEmail = patient.email || "—";
  const patientPhone = patient.phone || "—";

  // DOCTOR DETAILS
  const doctorName =
    transaction.doctorName ||
    doctor.displayName ||
    [doctor.user?.firstName, doctor.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    doctor.user?.name ||
    "Unknown Doctor";

  const speciality = doctor.speciality || "—";

  // APPOINTMENT DETAILS
  const appointmentId = appointment._id || "—";

  const appointmentDate = formatAppointmentDate(appointment.appointmentDate);

  const timeSlot = appointment.timeSlot;

  const appointmentTime =
    typeof timeSlot === "string"
      ? timeSlot
      : timeSlot?.startTime || timeSlot?.start || "—";

  const appointmentStatus = appointment.status || "—";

  // COPY ORDER ID
  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-24px)] max-w-[680px] flex-col overflow-hidden p-0 sm:max-w-[680px]">
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <FaFileInvoiceDollar className="text-cyan-600" />
            Transaction Details
          </DialogTitle>

          <DialogDescription>
            View payment, patient and appointment information.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* PATIENT SUMMARY */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <PatientAvatar
                image={transaction.patientImage}
                name={patientName}
              />

              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{patientName}</h3>

                <p className="mt-1 max-w-[260px] break-all text-xs text-slate-500">
                  Patient ID: {patientId}
                </p>
              </div>
            </div>

            <PaymentStatus status={transaction.status} />
          </div>

          {/* AMOUNT SUMMARY */}
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">
              Transaction Amount
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {amount}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Payment status: {transaction.status || "pending"}
            </p>
          </div>

          {/* PAYMENT INFORMATION */}
          <div className="space-y-3">
            <SectionTitle icon={<FaCreditCard />} title="Payment Information" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3.5">
                <p className="text-xs font-medium text-slate-400">
                  PayHere Order ID
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 break-all font-mono text-xs font-semibold text-slate-800">
                    {orderId}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyOrderId}
                    className="h-8 w-8 shrink-0"
                    title="Copy Order ID"
                  >
                    {copied ? (
                      <FaCheck className="text-green-600" />
                    ) : (
                      <FaCopy className="text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Info
                icon={<FaHashtag />}
                label="PayHere Payment ID"
                value={paymentId}
                mono
              />

              <Info
                icon={<FaCreditCard />}
                label="Payment Method"
                value={transaction.paymentMethod || "—"}
              />

              <Info
                icon={<FaMoneyBillTransfer />}
                label="Currency"
                value={currency}
              />

              <Info
                icon={<FaCalendarDays />}
                label="Transaction Created"
                value={formatDateTime(transaction.createdAt)}
              />

              <Info
                icon={<FaCalendarDays />}
                label="Last Updated"
                value={formatDateTime(transaction.updatedAt)}
              />
            </div>
          </div>

          <Separator />

          {/* PATIENT INFORMATION */}
          <div className="space-y-3">
            <SectionTitle icon={<FaUser />} title="Patient Information" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info
                icon={<FaUser />}
                label="Patient Name"
                value={patientName}
              />

              <Info
                icon={<FaHashtag />}
                label="Patient ID"
                value={patientId}
                mono
              />

              <Info
                icon={<FaEnvelope />}
                label="Email Address"
                value={patientEmail}
              />

              <Info
                icon={<FaPhone />}
                label="Phone Number"
                value={patientPhone}
              />
            </div>
          </div>

          <Separator />

          {/* DOCTOR & APPOINTMENT */}
          <div className="space-y-3">
            <SectionTitle
              icon={<FaUserDoctor />}
              title="Doctor & Appointment"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info
                icon={<FaUserDoctor />}
                label="Doctor Name"
                value={doctorName}
              />

              <Info
                icon={<FaCircleInfo />}
                label="Speciality"
                value={speciality}
              />

              <Info
                icon={<FaHashtag />}
                label="Appointment ID"
                value={appointmentId}
                mono
              />

              <Info
                icon={<FaCalendarDays />}
                label="Appointment Date"
                value={appointmentDate}
              />

              <Info
                icon={<FaClock />}
                label="Appointment Time"
                value={appointmentTime}
              />

              <Info
                icon={<FaCircleInfo />}
                label="Appointment Status"
                value={appointmentStatus}
              />
            </div>
          </div>

          <Separator />

          {/* PAYHERE CALLBACK INFORMATION */}
          <div className="space-y-3">
            <SectionTitle
              icon={<FaCircleInfo />}
              title="PayHere Status Information"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info label="Status Code" value={transaction.statusCode || "—"} />

              <Info
                label="Payment Status"
                value={<PaymentStatus status={transaction.status} />}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Status Message
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                {transaction.statusMessage || "No status message available."}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
