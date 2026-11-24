import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import InvoiceDetailsModal from "./InvoiceDetailsModal";

import {
  fetchMyInvoices,
  fetchInvoiceById,
  clearSelectedInvoice,
  selectInvoices,
  selectInvoiceLoading,
  selectInvoiceError,
  selectSelectedInvoice,
  selectInvoiceDetailsLoading,
  selectInvoiceDetailsError,
} from "@/redux/slices/invoiceSlice";

import {
  FaMagnifyingGlass,
  FaEye,
  FaDownload,
  FaFileInvoiceDollar,
  FaCalendarDays,
  FaRotateRight,
  FaUserDoctor,
} from "react-icons/fa6";

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function PatientInvoices() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const invoices = useSelector(selectInvoices);

  const loading = useSelector(selectInvoiceLoading);

  const error = useSelector(selectInvoiceError);

  const selectedInvoice = useSelector(selectSelectedInvoice);

  const detailsLoading = useSelector(selectInvoiceDetailsLoading);

  const detailsError = useSelector(selectInvoiceDetailsError);

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [search, setSearch] = useState("");

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // ====================================================
  // FETCH PATIENT INVOICES
  // ====================================================

  useEffect(() => {
    dispatch(fetchMyInvoices());
  }, [dispatch]);

  // ====================================================
  // SEARCH / FILTER
  // ====================================================

  const filteredInvoices = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      const invoiceNumber = String(invoice?.invoiceNumber || "").toLowerCase();

      const doctorName = String(
        invoice?.doctor?.user?.name || invoice?.doctor?.name || "",
      ).toLowerCase();

      const speciality = String(
        invoice?.doctor?.speciality || "",
      ).toLowerCase();

      const paymentStatus = String(invoice?.paymentStatus || "").toLowerCase();

      return (
        invoiceNumber.includes(searchValue) ||
        doctorName.includes(searchValue) ||
        speciality.includes(searchValue) ||
        paymentStatus.includes(searchValue)
      );
    });
  }, [invoices, search]);

  // ====================================================
  // VIEW INVOICE
  // GET /api/invoices/:invoiceId
  // ====================================================

  const handleView = async (invoice) => {
    if (!invoice?._id) {
      return;
    }

    // Remove previous invoice before
    // opening another invoice.
    dispatch(clearSelectedInvoice());

    setInvoiceModalOpen(true);

    await dispatch(fetchInvoiceById(invoice._id));
  };

  // ====================================================
  // DOWNLOAD
  // Currently opens full invoice.
  // Modal handles Print / Save PDF.
  // ====================================================

  const handleDownload = async (invoice) => {
    if (!invoice?._id) {
      return;
    }

    dispatch(clearSelectedInvoice());

    setInvoiceModalOpen(true);

    await dispatch(fetchInvoiceById(invoice._id));
  };

  // ====================================================
  // CLOSE INVOICE MODAL
  // ====================================================

  const handleCloseInvoice = () => {
    setInvoiceModalOpen(false);

    dispatch(clearSelectedInvoice());
  };

  // ====================================================
  // REFRESH INVOICE LIST
  // ====================================================

  const handleRefresh = () => {
    dispatch(fetchMyInvoices());
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="w-full">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* TITLE */}

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <FaFileInvoiceDollar />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your payment invoices
              </p>
            </div>
          </div>

          {/* SEARCH + REFRESH */}

          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh invoices"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaRotateRight className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* =================================================
            LIST ERROR
        ================================================= */}

        {!loading && error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">
              Unable to load invoices
            </p>

            <p className="mt-1 text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <FaRotateRight />
              Try Again
            </button>
          </div>
        )}

        {/* =================================================
            INVOICE CONTAINER
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* ===============================================
              LOADING
          =============================================== */}

          {loading && <InvoiceLoading />}

          {/* ===============================================
              DATA
          =============================================== */}

          {!loading && !error && (
            <>
              {/* ===========================================
                  DESKTOP TABLE
              =========================================== */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <TableHeading>Invoice ID</TableHeading>

                      <TableHeading>Doctor</TableHeading>

                      <TableHeading>Appointment Date</TableHeading>

                      <TableHeading>Booked On</TableHeading>

                      <TableHeading>Amount</TableHeading>

                      <TableHeading>Status</TableHeading>

                      <TableHeading align="right">Action</TableHeading>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <InvoiceRow
                          key={invoice._id}
                          invoice={invoice}
                          onView={handleView}
                          onDownload={handleDownload}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <EmptyInvoices hasSearch={Boolean(search.trim())} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ===========================================
                  MOBILE CARDS
              =========================================== */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <MobileInvoiceCard
                      key={invoice._id}
                      invoice={invoice}
                      onView={handleView}
                      onDownload={handleDownload}
                    />
                  ))
                ) : (
                  <EmptyInvoices hasSearch={Boolean(search.trim())} />
                )}
              </div>
            </>
          )}
        </div>

        {/* =================================================
            TOTAL INFO
        ================================================= */}

        {!loading && !error && invoices.length > 0 && (
          <p className="mt-3 text-right text-xs text-slate-400">
            {filteredInvoices.length} of {invoices.length} invoice
            {invoices.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* =================================================
          SINGLE INVOICE MODAL
      ================================================= */}

      <InvoiceDetailsModal
        open={invoiceModalOpen}
        invoice={selectedInvoice}
        loading={detailsLoading}
        error={detailsError}
        onClose={handleCloseInvoice}
      />
    </>
  );
}

// ======================================================
// DESKTOP TABLE ROW
// ======================================================

function InvoiceRow({ invoice, onView, onDownload }) {
  const appointmentDate = invoice?.appointment?.appointmentDate;

  const bookedDate = invoice?.createdAt || invoice?.issuedAt;

  return (
    <tr className="border-b border-slate-100 transition last:border-none hover:bg-slate-50/70">
      {/* INVOICE NUMBER */}

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => onView(invoice)}
          className="text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
        >
          #{invoice?.invoiceNumber || "N/A"}
        </button>
      </td>

      {/* DOCTOR */}

      <td className="px-5 py-4">
        <DoctorInfo doctor={invoice?.doctor} />
      </td>

      {/* APPOINTMENT DATE */}

      <td className="px-5 py-4">
        <DateDisplay date={appointmentDate} />
      </td>

      {/* BOOKED ON */}

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">{formatDate(bookedDate)}</span>
      </td>

      {/* AMOUNT */}

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-900">
          Rs. {formatAmount(invoice?.totalAmount)}
        </p>
      </td>

      {/* PAYMENT STATUS */}

      <td className="px-5 py-4">
        <PaymentStatus status={invoice?.paymentStatus} />
      </td>

      {/* ACTION */}

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <ActionButton title="View Invoice" onClick={() => onView(invoice)}>
            <FaEye />
          </ActionButton>

          <ActionButton
            title="Download Invoice"
            onClick={() => onDownload(invoice)}
          >
            <FaDownload />
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}

// ======================================================
// MOBILE INVOICE CARD
// ======================================================

function MobileInvoiceCard({ invoice, onView, onDownload }) {
  const appointmentDate = invoice?.appointment?.appointmentDate;

  const bookedDate = invoice?.createdAt || invoice?.issuedAt;

  return (
    <div className="p-5">
      {/* TOP */}

      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onView(invoice)}
            className="text-sm font-bold text-cyan-600"
          >
            #{invoice?.invoiceNumber || "N/A"}
          </button>

          <p className="mt-1 text-xs text-slate-400">Invoice</p>
        </div>

        <PaymentStatus status={invoice?.paymentStatus} />
      </div>

      {/* DOCTOR */}

      <div className="mt-4">
        <DoctorInfo doctor={invoice?.doctor} />
      </div>

      {/* DATES */}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoBox label="Appointment" value={formatDate(appointmentDate)} />

        <InfoBox label="Booked On" value={formatDate(bookedDate)} />
      </div>

      {/* BOTTOM */}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">Total Amount</p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            Rs. {formatAmount(invoice?.totalAmount)}
          </p>
        </div>

        <div className="flex gap-2">
          <ActionButton title="View Invoice" onClick={() => onView(invoice)}>
            <FaEye />
          </ActionButton>

          <ActionButton
            title="Download Invoice"
            onClick={() => onDownload(invoice)}
          >
            <FaDownload />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// DOCTOR INFO
// ======================================================

function DoctorInfo({ doctor }) {
  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const speciality = doctor?.speciality || "Specialist";

  const image = doctor?.user?.image || doctor?.image || "";

  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {image && !imageError ? (
        <img
          src={image}
          alt={doctorName}
          className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <FaUserDoctor className="text-slate-400" />
        </div>
      )}

      <div className="min-w-0">
        <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">
          {doctorName}
        </p>

        <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-500">
          {speciality}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// DATE DISPLAY
// ======================================================

function DateDisplay({ date }) {
  return (
    <div className="flex items-center gap-2">
      <FaCalendarDays className="text-xs text-cyan-500" />

      <span className="text-sm text-slate-600">{formatDate(date)}</span>
    </div>
  );
}

// ======================================================
// PAYMENT STATUS
// ======================================================

function PaymentStatus({ status }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const styles = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",

    pending: "border-amber-200 bg-amber-50 text-amber-700",

    failed: "border-red-200 bg-red-50 text-red-700",

    refunded: "border-purple-200 bg-purple-50 text-purple-700",

    cancelled: "border-slate-300 bg-slate-100 text-slate-600",
  };

  const currentStyle =
    styles[normalizedStatus] || "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${currentStyle}`}
    >
      {normalizedStatus}
    </span>
  );
}

// ======================================================
// ACTION BUTTON
// ======================================================

function ActionButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600"
    >
      {children}
    </button>
  );
}

// ======================================================
// MOBILE INFO BOX
// ======================================================

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

// ======================================================
// TABLE HEADING
// ======================================================

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

// ======================================================
// LOADING
// ======================================================

function InvoiceLoading() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-16 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

      <p className="mt-4 text-sm font-semibold text-slate-700">
        Loading invoices...
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Please wait while we load your payment history.
      </p>
    </div>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyInvoices({ hasSearch = false }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        <FaFileInvoiceDollar />
      </div>

      <h3 className="mt-4 font-bold text-slate-800">
        {hasSearch ? "No matching invoices" : "No invoices found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasSearch
          ? "Try searching with another invoice number, doctor, speciality, or status."
          : "Your paid appointment invoices will appear here."}
      </p>
    </div>
  );
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
