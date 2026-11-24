import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAdminTransactions,
  exportAdminTransactions,
  clearAdminTransactionsError,
} from "@/redux/slices/adminTransactionsSlice";

import TransactionsTable from "@/components/admin/Transactions/TransactionsTable";
import TransactionsToolbar from "@/components/admin/Transactions/TransactionsToolbar";
import TransactionViewDialog from "@/components/admin/Transactions/TransactionViewDialog";

import { Button } from "@/components/ui/button";
import { Download, RefreshCw, AlertCircle } from "lucide-react";

export default function AdminTransactions() {
  const dispatch = useDispatch();

  // ==========================================
  // REDUX STATE
  // ==========================================

  const { transactions, pagination, loading, error, exporting, exportError } =
    useSelector((state) => state.adminTransactions);

  // ==========================================
  // FILTER STATES
  // ==========================================

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [currencyFilter, setCurrencyFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ==========================================
  // PAGINATION
  // ==========================================

  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // REFRESH
  // ==========================================

  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // VIEW DIALOG
  // ==========================================

  const [viewOpen, setViewOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // ==========================================
  // DEBOUNCE SEARCH
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  useEffect(() => {
    const promise = dispatch(
      fetchAdminTransactions({
        page: currentPage,
        limit: entries,

        ...(debouncedSearch && {
          search: debouncedSearch,
        }),

        ...(statusFilter !== "all" && {
          status: statusFilter,
        }),

        ...(currencyFilter !== "all" && {
          currency: currencyFilter,
        }),

        ...(fromDate && {
          from: fromDate,
        }),

        ...(toDate && {
          to: toDate,
        }),
      }),
    );

    // Cancel obsolete requests when filters change.
    return () => {
      promise.abort();
    };
  }, [
    dispatch,
    currentPage,
    entries,
    debouncedSearch,
    statusFilter,
    currencyFilter,
    fromDate,
    toDate,
    refreshKey,
  ]);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCurrencyChange = (value) => {
    setCurrencyFilter(value);
    setCurrentPage(1);
  };

  const handleFromDateChange = (value) => {
    setFromDate(value);
    setCurrentPage(1);
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    setCurrentPage(1);
  };

  const handleEntriesChange = (value) => {
    setEntries(Number(value));
    setCurrentPage(1);
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // ==========================================
  // VIEW TRANSACTION
  // ==========================================

  const openViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);

    if (!open) {
      setSelectedTransaction(null);
    }
  };

  // ==========================================
  // EXPORT FILTERED TRANSACTIONS
  // ==========================================

  const handleExport = async () => {
    dispatch(clearAdminTransactionsError());

    const filters = {
      ...(search.trim() && {
        search: search.trim(),
      }),

      ...(statusFilter !== "all" && {
        status: statusFilter,
      }),

      ...(currencyFilter !== "all" && {
        currency: currencyFilter,
      }),

      ...(fromDate && {
        from: fromDate,
      }),

      ...(toDate && {
        to: toDate,
      }),
    };

    try {
      const csv = await dispatch(exportAdminTransactions(filters)).unwrap();

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `admin-transactions-${
        new Date().toISOString().split("T")[0]
      }.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("EXPORT TRANSACTIONS ERROR:", err);
    }
  };

  // ==========================================
  // PAGINATION VALUES
  // ==========================================

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  const startIndex = (currentPage - 1) * entries;

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="w-full space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Dashboard / Transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
          >
            <Download className="h-4 w-4" />

            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* TRANSACTION FILTERS */}
      <TransactionsToolbar
        search={search}
        setSearch={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        currencyFilter={currencyFilter}
        setCurrencyFilter={handleCurrencyChange}
        fromDate={fromDate}
        setFromDate={handleFromDateChange}
        toDate={toDate}
        setToDate={handleToDateChange}
        entries={entries}
        setEntries={handleEntriesChange}
        setCurrentPage={setCurrentPage}
      />

      {/* ERROR MESSAGE */}
      {(error || exportError) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p>{error || exportError}</p>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      {loading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-500" />

          <p className="text-sm text-slate-500">Loading transactions...</p>
        </div>
      ) : (
        <TransactionsTable
          transactions={transactions}
          filteredCount={pagination.total}
          entries={entries}
          startIndex={startIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onView={openViewTransaction}
        />
      )}

      {/* TRANSACTION VIEW DIALOG */}
      <TransactionViewDialog
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        transaction={selectedTransaction}
      />
    </div>
  );
}
