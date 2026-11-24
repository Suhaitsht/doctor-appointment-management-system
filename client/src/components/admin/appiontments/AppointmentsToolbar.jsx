import React from "react";

import {
  FaCalendarDays,
  FaMagnifyingGlass,
  FaFilter,
  FaRotateLeft,
  FaCreditCard,
  FaListCheck,
  FaChevronDown,
} from "react-icons/fa6";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ======================================
// FILTER SELECT
// ======================================

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
      </div>
    </div>
  );
}

// ======================================
// MAIN TOOLBAR
// ======================================

export default function AppointmentsToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  paymentStatusFilter = "all",
  setPaymentStatusFilter,
  dateFilter,
  setDateFilter,
  entries,
  setEntries,
  setCurrentPage,
}) {
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentStatusFilter?.("all");
    setDateFilter("");
    setEntries(10);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    dateFilter !== "";

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FaFilter />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Filter Appointments
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              Search and manage appointment records
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetFilters}
          disabled={!hasActiveFilters && entries === 10}
          className="gap-2 rounded-lg text-slate-600"
        >
          <FaRotateLeft className="text-xs" />
          Reset Filters
        </Button>
      </div>

      {/* FILTER CONTROLS */}

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-12">
        {/* SEARCH */}

        <div className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-4">
          <label
            htmlFor="admin-appointment-search"
            className="text-xs font-semibold text-slate-600"
          >
            Search Appointments
          </label>

          <div className="relative">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

            <Input
              id="admin-appointment-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Patient, doctor or booking ID..."
              className="h-10 rounded-lg border-slate-200 pl-9 focus-visible:ring-blue-200"
            />
          </div>
        </div>

        {/* APPOINTMENT STATUS */}

        <div className="xl:col-span-2">
          <FilterSelect
            label="Appointment Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            icon={FaListCheck}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        {/* PAYMENT STATUS */}

        <div className="xl:col-span-2">
          <FilterSelect
            label="Payment Status"
            value={paymentStatusFilter}
            onChange={(value) => {
              setPaymentStatusFilter?.(value);
              setCurrentPage(1);
            }}
            icon={FaCreditCard}
            options={[
              { value: "all", label: "All Payments" },
              { value: "pending", label: "Pending" },
              { value: "paid", label: "Paid" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
        </div>

        {/* DATE */}

        <div className="flex flex-col gap-1.5 xl:col-span-2">
          <label
            htmlFor="admin-appointment-date"
            className="text-xs font-semibold text-slate-600"
          >
            Appointment Date
          </label>

          <div className="relative">
            <FaCalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

            <Input
              id="admin-appointment-date"
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border-slate-200 pl-9"
            />
          </div>
        </div>

        {/* ENTRIES */}

        <div className="flex flex-col gap-1.5 xl:col-span-2">
          <label
            htmlFor="admin-appointment-entries"
            className="text-xs font-semibold text-slate-600"
          >
            Show Entries
          </label>

          <select
            id="admin-appointment-entries"
            value={entries}
            onChange={(e) => {
              setEntries(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value={5}>5 Entries</option>
            <option value={10}>10 Entries</option>
            <option value={20}>20 Entries</option>
            <option value={50}>50 Entries</option>
          </select>
        </div>
      </div>

      {/* ACTIVE FILTER INDICATOR */}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 border-t border-blue-100 bg-blue-50/50 px-5 py-3 text-xs text-blue-700">
          <FaFilter />
          Filters are active. Showing matching appointment records.
        </div>
      )}
    </div>
  );
}
