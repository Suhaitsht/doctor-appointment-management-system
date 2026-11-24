import React from "react";

import {
  FaMagnifyingGlass,
  FaPlus,
  FaXmark,
  FaSliders,
  FaArrowRotateLeft,
  FaList,
} from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PatientsToolbar({
  search = "",
  setSearch,
  entries = 10,
  setEntries,
  setCurrentPage,
  onAddPatient,
  showAddButton = false,
}) {
  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleEntriesChange = (event) => {
    setEntries(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setEntries(10);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR HEADER */}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT SIDE */}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FaSliders className="text-sm" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Search & Filters
            </h3>

            <p className="text-xs text-slate-400">
              Find and manage patient records
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-10 gap-2 rounded-xl border-slate-200 px-4 text-slate-600 hover:bg-slate-50"
          >
            <FaArrowRotateLeft className="text-xs" />
            Reset
          </Button>

          {showAddButton && (
            <Button
              type="button"
              onClick={onAddPatient}
              disabled={!onAddPatient}
              className="h-10 gap-2 rounded-xl bg-blue-600 px-4 font-medium text-white hover:bg-blue-700"
            >
              <FaPlus />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        {/* SEARCH */}

        <div className="space-y-1.5">
          <label
            htmlFor="patient-search"
            className="text-xs font-semibold text-slate-600"
          >
            Search Patients
          </label>

          <div className="relative">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

            <Input
              id="patient-search"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name, email, phone or ID..."
              className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-10 text-sm shadow-none focus-visible:ring-blue-500/20"
            />

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear patient search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FaXmark className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* ENTRIES */}

        <div className="space-y-1.5">
          <label
            htmlFor="patient-entries"
            className="text-xs font-semibold text-slate-600"
          >
            Records Per Page
          </label>

          <div className="relative">
            <FaList className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

            <select
              id="patient-entries"
              value={entries}
              onChange={handleEntriesChange}
              className="h-11 w-full min-w-[145px] rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 md:w-auto"
            >
              <option value={5}>5 records</option>
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE SEARCH INDICATOR */}

      {search.trim() && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active filter:</span>

          <button
            type="button"
            onClick={handleClearSearch}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <span className="truncate">Search: {search.trim()}</span>

            <FaXmark className="shrink-0 text-[10px]" />
          </button>
        </div>
      )}
    </div>
  );
}
