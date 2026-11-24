import React from "react";

import {
  FaMagnifyingGlass,
  FaRotateLeft,
  FaCalendarDays,
  FaFilter,
} from "react-icons/fa6";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TransactionsToolbar({
  search = "",
  setSearch,
  statusFilter = "all",
  setStatusFilter,
  currencyFilter = "all",
  setCurrencyFilter,
  fromDate = "",
  setFromDate,
  toDate = "",
  setToDate,
  entries = 10,
  setEntries,
  setCurrentPage,
}) {
  const resetPage = () => {
    setCurrentPage?.(1);
  };

  const handleReset = () => {
    setSearch?.("");
    setStatusFilter?.("all");
    setCurrencyFilter?.("all");
    setFromDate?.("");
    setToDate?.("");
    setEntries?.(10);
    resetPage();
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    currencyFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const selectClass =
    "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

  return (
    <Card className="mb-5 rounded-xl border-slate-200 p-4 shadow-sm">
      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FaFilter className="text-sm text-cyan-600" />

          <h3 className="text-sm font-semibold text-slate-800">
            Transaction Filters
          </h3>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!hasFilters && Number(entries) === 10}
          className="gap-2 text-slate-600"
        >
          <FaRotateLeft className="text-xs" />
          Clear Filters
        </Button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* SEARCH */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-search"
            className="text-xs font-medium text-slate-600"
          >
            Search Transaction
          </label>

          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

            <Input
              id="transaction-search"
              value={search}
              onChange={(e) => {
                setSearch?.(e.target.value);
                resetPage();
              }}
              placeholder="Order ID or Payment ID"
              maxLength={100}
              className="h-10 pl-9"
            />
          </div>
        </div>

        {/* STATUS */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-status"
            className="text-xs font-medium text-slate-600"
          >
            Payment Status
          </label>

          <select
            id="transaction-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter?.(e.target.value);
              resetPage();
            }}
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* CURRENCY */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-currency"
            className="text-xs font-medium text-slate-600"
          >
            Currency
          </label>

          <select
            id="transaction-currency"
            value={currencyFilter}
            onChange={(e) => {
              setCurrencyFilter?.(e.target.value);
              resetPage();
            }}
            className={selectClass}
          >
            <option value="all">All Currencies</option>
            <option value="LKR">LKR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        {/* ENTRIES */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-entries"
            className="text-xs font-medium text-slate-600"
          >
            Show Entries
          </label>

          <select
            id="transaction-entries"
            value={entries}
            onChange={(e) => {
              setEntries?.(Number(e.target.value));
              resetPage();
            }}
            className={selectClass}
          >
            <option value={5}>5 Entries</option>
            <option value={10}>10 Entries</option>
            <option value={20}>20 Entries</option>
            <option value={50}>50 Entries</option>
            <option value={100}>100 Entries</option>
          </select>
        </div>

        {/* FROM DATE */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-from-date"
            className="flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            <FaCalendarDays />
            From Date
          </label>

          <Input
            id="transaction-from-date"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate?.(e.target.value);
              resetPage();
            }}
            className="h-10"
          />
        </div>

        {/* TO DATE */}
        <div className="space-y-2">
          <label
            htmlFor="transaction-to-date"
            className="flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            <FaCalendarDays />
            To Date
          </label>

          <Input
            id="transaction-to-date"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate?.(e.target.value);
              resetPage();
            }}
            className="h-10"
          />
        </div>
      </div>

      {/* FILTER SUMMARY */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          {hasFilters
            ? "Filters applied. Results will update automatically."
            : "Showing all available payment transactions."}
        </p>
      </div>
    </Card>
  );
}
