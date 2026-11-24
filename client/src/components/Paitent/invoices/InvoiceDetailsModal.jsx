import React from "react";

import {
  FaXmark,
  FaPrint,
  FaDownload,
  FaUserDoctor,
  FaCalendarDays,
  FaReceipt,
  FaClock,
  FaCreditCard,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStethoscope,
  FaMoneyBillWave,
  FaHashtag,
} from "react-icons/fa6";

// ======================================================
// INVOICE DETAILS MODAL
// ======================================================

export default function InvoiceDetailsModal({
  open,
  invoice,
  loading = false,
  error = null,
  onClose,
}) {
  if (!open) {
    return null;
  }

  // ====================================================
  // PRINT
  // ====================================================

  const handlePrint = () => {
    if (!invoice) return;

    printInvoice(invoice);
  };

  // ====================================================
  // SAVE PDF
  // Browser print dialog -> Save as PDF
  // ====================================================

  const handleSavePdf = () => {
    if (!invoice) return;

    printInvoice(invoice);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* =================================================
            LOADING
        ================================================= */}

        {loading && <LoadingState onClose={onClose} />}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && <ErrorState error={error} onClose={onClose} />}

        {/* =================================================
            INVOICE
        ================================================= */}

        {!loading && !error && invoice && (
          <>
            {/* =============================================
                HEADER
            ============================================= */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  #{invoice?.invoiceNumber || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FaXmark />
              </button>
            </div>

            {/* =============================================
                INVOICE CONTENT
            ============================================= */}

            <div className="bg-white px-5 py-6 sm:px-8 sm:py-8">
              <InvoiceContent invoice={invoice} />
            </div>

            {/* =============================================
                ACTIONS
            ============================================= */}

            <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
              >
                <FaPrint />
                Print
              </button>

              <button
                type="button"
                onClick={handleSavePdf}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                <FaDownload />
                Save PDF
              </button>
            </div>
          </>
        )}

        {/* =================================================
            NO INVOICE
        ================================================= */}

        {!loading && !error && !invoice && (
          <ErrorState
            error="Invoice information is not available."
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ======================================================
// INVOICE CONTENT
// ======================================================

function InvoiceContent({ invoice }) {
  const appointment = invoice?.appointment || {};
  const doctor = invoice?.doctor || {};
  const patient = invoice?.patient || {};
  const payment = invoice?.payment || {};

  // ====================================================
  // DOCTOR
  // ====================================================

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const doctorSpeciality =
    doctor?.speciality || doctor?.specialty || "Specialist";

  // ====================================================
  // PATIENT
  // ====================================================

  const patientName =
    patient?.name || getPatientName(appointment?.patientDetails) || "Patient";

  const patientEmail =
    patient?.email || appointment?.patientDetails?.email || "";

  const patientPhone =
    patient?.phone || appointment?.patientDetails?.phone || "";

  // ====================================================
  // AMOUNTS
  // ====================================================

  const consultationFee = toNumber(invoice?.consultationFee);
  const bookingFee = toNumber(invoice?.bookingFee);
  const tax = toNumber(invoice?.tax);
  const discount = toNumber(invoice?.discount);
  const totalAmount = toNumber(invoice?.totalAmount);

  return (
    <div className="mx-auto w-full">
      {/* =================================================
          MEDICAL CENTRE / INVOICE
      ================================================= */}

      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        {/* MEDICAL CENTRE */}

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-xl text-white">
            <FaReceipt />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Jayanthi Medical Centre
            </h1>

            <p className="mt-1 text-sm text-slate-500">Kekirawa, Sri Lanka</p>
          </div>
        </div>

        {/* INVOICE NUMBER */}

        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Invoice
          </p>

          <h2 className="mt-1 break-all text-xl font-extrabold text-slate-900">
            #{invoice?.invoiceNumber || "N/A"}
          </h2>

          <div className="mt-3">
            <PaymentStatus status={payment?.status || invoice?.paymentStatus} />
          </div>
        </div>
      </div>

      {/* =================================================
          DATE / TIME
      ================================================= */}

      <div className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-3">
        <DetailItem
          label="Invoice Date"
          value={formatDate(invoice?.issuedAt || invoice?.createdAt)}
          icon={<FaCalendarDays />}
        />

        <DetailItem
          label="Appointment Date"
          value={formatDate(appointment?.appointmentDate)}
          icon={<FaCalendarDays />}
        />

        <DetailItem
          label="Appointment Time"
          value={formatTimeSlot(appointment?.timeSlot)}
          icon={<FaClock />}
        />
      </div>

      {/* =================================================
          PATIENT / DOCTOR
      ================================================= */}

      <div className="grid gap-5 border-b border-slate-200 py-6 md:grid-cols-2">
        {/* PATIENT */}

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Billed To
          </p>

          <div className="mt-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <FaUser />
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-slate-900">{patientName}</h3>

              {patientEmail && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <FaEnvelope className="shrink-0 text-xs" />

                  <span className="break-all">{patientEmail}</span>
                </div>
              )}

              {patientPhone && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <FaPhone className="shrink-0 text-xs" />

                  <span>{patientPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DOCTOR */}

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Doctor
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <FaUserDoctor />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-900">
                {doctorName}
              </h3>

              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <FaStethoscope className="shrink-0 text-xs" />

                <span className="truncate">{doctorSpeciality}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          APPOINTMENT INFORMATION
      ================================================= */}

      <div className="border-b border-slate-200 py-6">
        <SectionHeader
          title="Appointment Information"
          description="Details related to this medical appointment"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Appointment Type"
            value={formatTextValue(appointment?.appointmentType)}
            icon={<FaStethoscope />}
          />

          <DetailItem
            label="Appointment Status"
            value={formatTextValue(appointment?.status)}
            icon={<FaCalendarDays />}
          />
        </div>
      </div>

      {/* =================================================
          PAYMENT INFORMATION
      ================================================= */}

      <div className="border-b border-slate-200 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader
            title="Payment Information"
            description="Transaction details for this invoice"
          />

          <PaymentStatus status={payment?.status || invoice?.paymentStatus} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PAYMENT ID */}

          <DetailItem
            label="Payment ID"
            value={payment?.paymentId || "N/A"}
            icon={<FaHashtag />}
          />

          {/* ORDER ID */}

          <DetailItem
            label="Order ID"
            value={payment?.orderId || "N/A"}
            icon={<FaReceipt />}
          />

          {/* METHOD */}

          <DetailItem
            label="Payment Method"
            value={payment?.paymentMethod || "N/A"}
            icon={<FaCreditCard />}
          />

          {/* CURRENCY */}

          <DetailItem
            label="Currency"
            value={payment?.currency || "N/A"}
            icon={<FaMoneyBillWave />}
          />

          {/* AMOUNT */}

          <DetailItem
            label="Payment Amount"
            value={
              payment?.amount !== undefined && payment?.amount !== null
                ? `${payment?.currency || "LKR"} ${formatAmount(
                    payment.amount,
                  )}`
                : "N/A"
            }
            icon={<FaMoneyBillWave />}
          />

          {/* PAYMENT DATE */}

          <DetailItem
            label="Payment Date"
            value={formatDateTime(payment?.createdAt)}
            icon={<FaCalendarDays />}
          />
        </div>
      </div>

      {/* =================================================
          PAYMENT SUMMARY
      ================================================= */}

      <div className="py-6">
        <SectionHeader
          title="Payment Summary"
          description="Invoice charges and final amount"
        />

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="divide-y divide-slate-100">
            <PriceRow label="Consultation Fee" amount={consultationFee} />

            <PriceRow label="Booking Fee" amount={bookingFee} />

            <PriceRow label="Tax" amount={tax} />

            {discount > 0 && (
              <PriceRow label="Discount" amount={discount} negative />
            )}
          </div>

          {/* TOTAL */}

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-900">Total Amount</p>

              <p className="mt-0.5 text-xs text-slate-500">
                {invoice?.paymentStatus === "paid"
                  ? "Payment completed successfully"
                  : "Final invoice amount"}
              </p>
            </div>

            <p className="text-xl font-extrabold text-slate-900">
              Rs. {formatAmount(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="border-t border-slate-200 pt-6 text-center">
        <p className="font-semibold text-slate-700">
          Thank you for choosing Jayanthi Medical Centre
        </p>

        <p className="mt-1 text-xs text-slate-400">
          This invoice was generated electronically.
        </p>
      </div>
    </div>
  );
}

// ======================================================
// SECTION HEADER
// ======================================================

function SectionHeader({ title, description }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

// ======================================================
// DETAIL ITEM
// ======================================================

function DetailItem({ label, value, icon }) {
  const displayValue = formatTextValue(value);

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-sm text-cyan-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">{label}</p>

        <p className="mt-1 break-all text-sm font-bold text-slate-800">
          {displayValue}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// PRICE ROW
// ======================================================

function PriceRow({ label, amount, negative = false }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <p className="text-sm text-slate-600">{label}</p>

      <p
        className={`shrink-0 text-sm font-semibold ${
          negative ? "text-emerald-600" : "text-slate-800"
        }`}
      >
        {negative ? "- " : ""}
        Rs. {formatAmount(amount)}
      </p>
    </div>
  );
}

// ======================================================
// PAYMENT STATUS
// ======================================================

function PaymentStatus({ status }) {
  const normalizedStatus =
    typeof status === "string" ? status.toLowerCase() : "pending";

  const styles = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",

    pending: "border-amber-200 bg-amber-50 text-amber-700",

    failed: "border-red-200 bg-red-50 text-red-700",

    refunded: "border-purple-200 bg-purple-50 text-purple-700",

    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  };

  const currentStyle =
    styles[normalizedStatus] || "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${currentStyle}`}
    >
      {normalizedStatus}
    </span>
  );
}

// ======================================================
// LOADING
// ======================================================

function LoadingState({ onClose }) {
  return (
    <>
      <div className="flex justify-end border-b border-slate-200 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
        >
          <FaXmark />
        </button>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading invoice...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Please wait while we load the invoice details.
        </p>
      </div>
    </>
  );
}

// ======================================================
// ERROR
// ======================================================

function ErrorState({ error, onClose }) {
  return (
    <div className="p-7">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-bold text-red-700">Unable to load invoice</p>

        <p className="mt-2 text-sm text-red-600">
          {error || "Something went wrong."}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ======================================================
// FORMAT TIME SLOT
//
// Backend:
// {
//   startTime: "14:30",
//   endTime: "15:00"
// }
// ======================================================

function formatTimeSlot(timeSlot) {
  if (!timeSlot) {
    return "N/A";
  }

  if (typeof timeSlot === "string") {
    return timeSlot;
  }

  if (typeof timeSlot === "object" && !Array.isArray(timeSlot)) {
    const startTime = timeSlot?.startTime;

    const endTime = timeSlot?.endTime;

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    if (startTime) {
      return String(startTime);
    }

    if (endTime) {
      return String(endTime);
    }

    return "N/A";
  }

  return String(timeSlot);
}

// ======================================================
// SAFE TEXT FORMATTER
// Prevent React object child errors
// ======================================================

function formatTextValue(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatTextValue(item)).join(", ");
  }

  // Do not render objects directly
  if (typeof value === "object") {
    return "N/A";
  }

  return String(value);
}

// ======================================================
// PATIENT NAME
// ======================================================

function getPatientName(patientDetails) {
  if (!patientDetails) {
    return "";
  }

  if (typeof patientDetails?.name === "string" && patientDetails.name.trim()) {
    return patientDetails.name.trim();
  }

  const firstName = patientDetails?.firstName || "";

  const lastName = patientDetails?.lastName || "";

  return `${firstName} ${lastName}`.trim();
}

// ======================================================
// SAFE NUMBER
// ======================================================

function toNumber(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return numericValue;
}

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ======================================================
// FORMAT DATE + TIME
// ======================================================

function formatDateTime(date) {
  if (!date) {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ======================================================
// FORMAT AMOUNT
// ======================================================

function formatAmount(amount) {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return "0.00";
  }

  return numericAmount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ======================================================
// PRINT INVOICE
// ======================================================

function printInvoice(invoice) {
  if (!invoice) {
    return;
  }

  const appointment = invoice?.appointment || {};

  const doctor = invoice?.doctor || {};

  const patient = invoice?.patient || {};

  const payment = invoice?.payment || {};

  // ====================================================
  // DOCTOR
  // ====================================================

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const doctorSpeciality =
    doctor?.speciality || doctor?.specialty || "Specialist";

  // ====================================================
  // PATIENT
  // ====================================================

  const patientName =
    patient?.name || getPatientName(appointment?.patientDetails) || "Patient";

  const patientEmail =
    patient?.email || appointment?.patientDetails?.email || "N/A";

  const patientPhone =
    patient?.phone || appointment?.patientDetails?.phone || "N/A";

  // ====================================================
  // AMOUNTS
  // ====================================================

  const consultationFee = toNumber(invoice?.consultationFee);

  const bookingFee = toNumber(invoice?.bookingFee);

  const tax = toNumber(invoice?.tax);

  const discount = toNumber(invoice?.discount);

  const totalAmount = toNumber(invoice?.totalAmount);

  // ====================================================
  // INVOICE / APPOINTMENT
  // ====================================================

  const invoiceNumber = invoice?.invoiceNumber || "N/A";

  const invoiceDate = formatDate(invoice?.issuedAt || invoice?.createdAt);

  const appointmentDate = formatDate(appointment?.appointmentDate);

  const appointmentTime = formatTimeSlot(appointment?.timeSlot);

  const appointmentType = formatTextValue(appointment?.appointmentType);

  const appointmentStatus = formatTextValue(appointment?.status);

  // ====================================================
  // PAYMENT
  // ====================================================

  const paymentId = payment?.paymentId || "N/A";

  const orderId = payment?.orderId || "N/A";

  const paymentMethod = payment?.paymentMethod || "N/A";

  const currency = payment?.currency || "LKR";

  const paymentAmount =
    payment?.amount !== undefined && payment?.amount !== null
      ? toNumber(payment.amount)
      : totalAmount;

  const paymentDate = formatDateTime(payment?.createdAt);

  const paymentStatus = formatTextValue(
    payment?.status || invoice?.paymentStatus,
  );

  // ====================================================
  // OPEN PRINT WINDOW
  // ====================================================

  const printWindow = window.open("", "_blank", "width=1000,height=900");

  if (!printWindow) {
    window.alert("Please allow pop-ups to print or save the invoice.");

    return;
  }

  // ====================================================
  // HTML
  // ====================================================

  const html = `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>Invoice ${escapeHtml(invoiceNumber)}</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #0f172a;
  font-family: Arial, Helvetica, sans-serif;
}

.invoice {
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
  padding: 40px;
}

/* =====================================
   HEADER
===================================== */

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e2e8f0;
}

.brand h1 {
  margin: 0;
  font-size: 25px;
  color: #0f172a;
}

.brand p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 13px;
}

.invoice-title {
  text-align: right;
}

.invoice-title small {
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 2px;
}

.invoice-title h2 {
  margin: 6px 0 10px;
  font-size: 21px;
  overflow-wrap: anywhere;
}

.status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

/* =====================================
   GENERIC
===================================== */

.label {
  margin-bottom: 7px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.value {
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.section-title {
  margin: 0 0 5px;
  font-size: 15px;
  color: #0f172a;
}

.section-description {
  margin: 0 0 18px;
  color: #64748b;
  font-size: 11px;
}

/* =====================================
   DATE INFO
===================================== */

.date-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid #e2e8f0;
}

/* =====================================
   PATIENT / DOCTOR
===================================== */

.people-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid #e2e8f0;
}

.card {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.card h3 {
  margin: 10px 0 7px;
  font-size: 15px;
}

.card p {
  margin: 5px 0;
  color: #64748b;
  font-size: 12px;
  overflow-wrap: anywhere;
}

/* =====================================
   SECTION
===================================== */

.section {
  padding: 24px 0;
  border-bottom: 1px solid #e2e8f0;
}

/* =====================================
   APPOINTMENT GRID
===================================== */

.appointment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.info-box {
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
}

/* =====================================
   PAYMENT INFORMATION
===================================== */

.payment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.payment-box {
  min-width: 0;
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
}

.payment-box .value {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* =====================================
   SUMMARY
===================================== */

.summary {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.row:last-child {
  border-bottom: none;
}

.row strong {
  white-space: nowrap;
}

.discount {
  color: #059669;
}

.total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 18px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.total-label {
  font-size: 15px;
  font-weight: 700;
}

.total-value {
  font-size: 19px;
  font-weight: 800;
  white-space: nowrap;
}

/* =====================================
   FOOTER
===================================== */

.footer {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.footer strong {
  font-size: 13px;
}

.footer p {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

/* =====================================
   PRINT
===================================== */

@media print {

  @page {
    size: A4;
    margin: 12mm;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .invoice {
    max-width: none;
    padding: 0;
  }

  .card,
  .payment-box,
  .info-box,
  .summary {
    break-inside: avoid;
  }
}

</style>

</head>

<body>

<div class="invoice">

  <!-- =================================
       HEADER
  ================================== -->

  <div class="top">

    <div class="brand">

      <h1>
        Jayanthi Medical Centre
      </h1>

      <p>
        Kekirawa, Sri Lanka
      </p>

    </div>

    <div class="invoice-title">

      <small>
        INVOICE
      </small>

      <h2>
        #${escapeHtml(invoiceNumber)}
      </h2>

      <span class="status">
        ${escapeHtml(paymentStatus)}
      </span>

    </div>

  </div>

  <!-- =================================
       DATE INFORMATION
  ================================== -->

  <div class="date-grid">

    <div>

      <div class="label">
        Invoice Date
      </div>

      <div class="value">
        ${escapeHtml(invoiceDate)}
      </div>

    </div>

    <div>

      <div class="label">
        Appointment Date
      </div>

      <div class="value">
        ${escapeHtml(appointmentDate)}
      </div>

    </div>

    <div>

      <div class="label">
        Appointment Time
      </div>

      <div class="value">
        ${escapeHtml(appointmentTime)}
      </div>

    </div>

  </div>

  <!-- =================================
       PATIENT / DOCTOR
  ================================== -->

  <div class="people-grid">

    <div class="card">

      <div class="label">
        Billed To
      </div>

      <h3>
        ${escapeHtml(patientName)}
      </h3>

      <p>
        ${escapeHtml(patientEmail)}
      </p>

      <p>
        ${escapeHtml(patientPhone)}
      </p>

    </div>

    <div class="card">

      <div class="label">
        Doctor
      </div>

      <h3>
        ${escapeHtml(doctorName)}
      </h3>

      <p>
        ${escapeHtml(doctorSpeciality)}
      </p>

    </div>

  </div>

  <!-- =================================
       APPOINTMENT INFORMATION
  ================================== -->

  <div class="section">

    <h3 class="section-title">
      Appointment Information
    </h3>

    <p class="section-description">
      Details related to this medical appointment
    </p>

    <div class="appointment-grid">

      <div class="info-box">

        <div class="label">
          Appointment Type
        </div>

        <div class="value">
          ${escapeHtml(appointmentType)}
        </div>

      </div>

      <div class="info-box">

        <div class="label">
          Appointment Status
        </div>

        <div class="value">
          ${escapeHtml(appointmentStatus)}
        </div>

      </div>

    </div>

  </div>

  <!-- =================================
       PAYMENT INFORMATION
  ================================== -->

  <div class="section">

    <h3 class="section-title">
      Payment Information
    </h3>

    <p class="section-description">
      Transaction details for this invoice
    </p>

    <div class="payment-grid">

      <!-- PAYMENT ID -->

      <div class="payment-box">

        <div class="label">
          Payment ID
        </div>

        <div class="value">
          ${escapeHtml(paymentId)}
        </div>

      </div>

      <!-- ORDER ID -->

      <div class="payment-box">

        <div class="label">
          Order ID
        </div>

        <div class="value">
          ${escapeHtml(orderId)}
        </div>

      </div>

      <!-- METHOD -->

      <div class="payment-box">

        <div class="label">
          Payment Method
        </div>

        <div class="value">
          ${escapeHtml(paymentMethod)}
        </div>

      </div>

      <!-- CURRENCY -->

      <div class="payment-box">

        <div class="label">
          Currency
        </div>

        <div class="value">
          ${escapeHtml(currency)}
        </div>

      </div>

      <!-- PAYMENT AMOUNT -->

      <div class="payment-box">

        <div class="label">
          Payment Amount
        </div>

        <div class="value">
          ${escapeHtml(`${currency} ${formatAmount(paymentAmount)}`)}
        </div>

      </div>

      <!-- PAYMENT DATE -->

      <div class="payment-box">

        <div class="label">
          Payment Date
        </div>

        <div class="value">
          ${escapeHtml(paymentDate)}
        </div>

      </div>

    </div>

  </div>

  <!-- =================================
       PAYMENT SUMMARY
  ================================== -->

  <div class="section">

    <h3 class="section-title">
      Payment Summary
    </h3>

    <p class="section-description">
      Invoice charges and final amount
    </p>

    <div class="summary">

      <div class="row">

        <span>
          Consultation Fee
        </span>

        <strong>
          Rs. ${formatAmount(consultationFee)}
        </strong>

      </div>

      <div class="row">

        <span>
          Booking Fee
        </span>

        <strong>
          Rs. ${formatAmount(bookingFee)}
        </strong>

      </div>

      <div class="row">

        <span>
          Tax
        </span>

        <strong>
          Rs. ${formatAmount(tax)}
        </strong>

      </div>

      ${
        discount > 0
          ? `
            <div class="row discount">

              <span>
                Discount
              </span>

              <strong>
                - Rs. ${formatAmount(discount)}
              </strong>

            </div>
          `
          : ""
      }

      <div class="total">

        <div class="total-label">
          Total Amount
        </div>

        <div class="total-value">
          Rs. ${formatAmount(totalAmount)}
        </div>

      </div>

    </div>

  </div>

  <!-- =================================
       FOOTER
  ================================== -->

  <div class="footer">

    <strong>
      Thank you for choosing Jayanthi Medical Centre
    </strong>

    <p>
      This invoice was generated electronically.
    </p>

  </div>

</div>

</body>

</html>
`;

  // ====================================================
  // WRITE PRINT DOCUMENT
  // ====================================================

  printWindow.document.open();

  printWindow.document.write(html);

  printWindow.document.close();

  printWindow.focus();

  // Give browser time to render.
  setTimeout(() => {
    printWindow.print();
  }, 300);
}

// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
