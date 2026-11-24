import React, { useState } from "react";

import { FaEye } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ChevronLeft, ChevronRight, CreditCard, UserRound } from "lucide-react";

// ==========================================
// CURRENCY FORMATTER
// ==========================================

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

// ==========================================
// PATIENT AVATAR
// ==========================================

function PatientAvatar({ src, name }) {
  const [failedSrc, setFailedSrc] = useState(null);

  const hasValidImage = Boolean(src) && failedSrc !== src;

  if (!hasValidImage) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
        <UserRound className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Patient"}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className="h-10 w-10 shrink-0 rounded-full border border-slate-100 object-cover"
    />
  );
}

// ==========================================
// PAYMENT STATUS
// ==========================================

function TransactionStatus({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const styles = {
    paid: "border-green-200 bg-green-50 text-green-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
    refunded: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <Badge
      variant="outline"
      className={`min-w-[88px] justify-center rounded-full px-3 py-1 font-medium capitalize ${
        styles[normalized] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {normalized}
    </Badge>
  );
}

// ==========================================
// PAGINATION NUMBERS
// ==========================================

function getPageNumbers(currentPage, totalPages) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const valid = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const result = [];

  valid.forEach((page, index) => {
    if (index > 0 && page - valid[index - 1] > 1) {
      result.push("...");
    }

    result.push(page);
  });

  return result;
}

// ==========================================
// TRANSACTIONS TABLE
// ==========================================

export default function TransactionsTable({
  transactions = [],
  filteredCount = 0,
  entries = 10,
  startIndex = 0,
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  onView,
}) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  const safeCurrentPage = Math.max(
    1,
    Math.min(Number(currentPage) || 1, safeTotalPages),
  );

  const total = Number(filteredCount) || 0;

  const showingFrom = total === 0 ? 0 : Number(startIndex) + 1;

  const showingTo = Math.min(
    Number(startIndex) + safeTransactions.length,
    total,
  );

  const pageNumbers = getPageNumbers(safeCurrentPage, safeTotalPages);

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* TABLE */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-4">Order ID</th>
              <th className="px-5 py-4">Patient</th>
              <th className="px-5 py-4">Doctor</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Payment Method</th>
              <th className="px-5 py-4">Date & Time</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {safeTransactions.map((transaction) => (
              <tr
                key={transaction._id || transaction.id}
                className="transition-colors hover:bg-slate-50/80"
              >
                {/* ORDER ID */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="max-w-[175px] break-all font-semibold text-cyan-600">
                      {transaction.invoiceNumber || transaction.orderId || "—"}
                    </span>

                    <span className="text-xs text-slate-400">Payment</span>
                  </div>
                </td>

                {/* PATIENT */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <PatientAvatar
                      src={transaction.patientImage}
                      name={transaction.patientName}
                    />

                    <div className="min-w-0">
                      <p className="max-w-[165px] truncate font-semibold text-slate-800">
                        {transaction.patientName || "Unknown Patient"}
                      </p>

                      <p
                        className="max-w-[165px] truncate text-xs text-slate-400"
                        title={String(transaction.patientId || "")}
                      >
                        ID: {transaction.patientId || "—"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* DOCTOR */}
                <td className="px-5 py-4">
                  <p className="max-w-[170px] truncate font-medium text-slate-700">
                    {transaction.doctorName || "Unknown Doctor"}
                  </p>
                </td>

                {/* AMOUNT */}
                <td className="px-5 py-4">
                  <span className="whitespace-nowrap font-semibold text-slate-900">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </span>
                </td>

                {/* PAYMENT METHOD */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CreditCard className="h-4 w-4 text-slate-400" />

                    <span className="capitalize">
                      {transaction.paymentMethod || "—"}
                    </span>
                  </div>
                </td>

                {/* DATE AND TIME */}
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="whitespace-nowrap font-medium text-slate-700">
                      {transaction.date || "—"}
                    </p>

                    <p className="text-xs text-slate-400">
                      {transaction.time || "—"}
                    </p>
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  <TransactionStatus status={transaction.status} />
                </td>

                {/* ACTION */}
                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(transaction)}
                      className="gap-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <FaEye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {/* EMPTY STATE */}
            {safeTransactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                    </div>

                    <h3 className="font-semibold text-slate-700">
                      No transactions found
                    </h3>

                    <p className="max-w-sm text-sm text-slate-400">
                      No payment transactions match your current filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">{showingFrom}</span> to{" "}
          <span className="font-semibold text-slate-700">{showingTo}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span>{" "}
          transactions
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage?.((prev) => Math.max(1, prev - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1 text-sm text-slate-400"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                type="button"
                size="sm"
                variant={safeCurrentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage?.(page)}
                className={
                  safeCurrentPage === page
                    ? "min-w-9 bg-cyan-500 text-white hover:bg-cyan-600"
                    : "min-w-9"
                }
              >
                {page}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() =>
              setCurrentPage?.((prev) => Math.min(safeTotalPages, prev + 1))
            }
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
