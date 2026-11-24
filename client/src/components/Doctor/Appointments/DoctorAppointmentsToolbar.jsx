import React from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiXCircle,
  FiX,
} from "react-icons/fi";

// ======================================================
// TAB BUTTON
// ======================================================

function TabButton({ active, onClick, icon: Icon, label, count, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex h-10 shrink-0
        items-center justify-center gap-2
        whitespace-nowrap rounded-xl
        border px-3 text-xs font-semibold
        transition-all sm:px-4
        ${
          active
            ? activeClass
            : `
              border-slate-200
              bg-white
              text-slate-600
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-600
            `
        }
      `}
    >
      <Icon className="text-sm" />

      <span>{label}</span>

      <span
        className={`
          flex min-w-[20px] items-center
          justify-center rounded-full px-1.5
          py-0.5 text-[10px]
          ${active ? "bg-white/20 text-current" : "bg-slate-100 text-slate-500"}
        `}
      >
        {count}
      </span>
    </button>
  );
}

// ======================================================
// TOOLBAR
// ======================================================

export default function DoctorAppointmentsToolbar({
  activeTab,
  setActiveTab,

  search,
  setSearch,

  visitFilter,
  setVisitFilter,

  upcomingCount = 0,
  cancelledCount = 0,
  completedCount = 0,
}) {
  const hasFilters = search || visitFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setVisitFilter("all");
  };

  return (
    <div className="min-w-0 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5 lg:px-6">
      {/* ======================================= */}
      {/* TOP */}
      {/* ======================================= */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* ===================================== */}
        {/* TABS */}
        {/* ===================================== */}

        <div className="min-w-0">
          <div
            className="
              flex max-w-full gap-2
              overflow-x-auto pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <TabButton
              active={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
              icon={FiClock}
              label="Upcoming"
              count={upcomingCount}
              activeClass="
                border-blue-600
                bg-blue-600
                text-white
                shadow-sm
              "
            />

            <TabButton
              active={activeTab === "completed"}
              onClick={() => setActiveTab("completed")}
              icon={FiCheckCircle}
              label="Completed"
              count={completedCount}
              activeClass="
                border-emerald-600
                bg-emerald-600
                text-white
                shadow-sm
              "
            />

            <TabButton
              active={activeTab === "cancelled"}
              onClick={() => setActiveTab("cancelled")}
              icon={FiXCircle}
              label="Cancelled"
              count={cancelledCount}
              activeClass="
                border-rose-500
                bg-rose-500
                text-white
                shadow-sm
              "
            />
          </div>
        </div>

        {/* ===================================== */}
        {/* SEARCH */}
        {/* ===================================== */}

        <div className="relative w-full xl:w-[280px]">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient..."
            className="
              h-10 w-full rounded-xl
              border border-slate-200
              bg-white pl-10 pr-9
              text-sm text-slate-700
              outline-none transition
              placeholder:text-slate-400
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="
                absolute right-3 top-1/2
                -translate-y-1/2
                text-slate-400
                transition hover:text-slate-700
              "
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* FILTER ROW */}
      {/* ======================================= */}

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <FiFilter />

          <span>Filter appointments</span>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {/* DATE BUTTON */}

          <button
            type="button"
            className="
              inline-flex h-10 w-full
              items-center justify-center
              gap-2 rounded-xl
              border border-slate-200
              bg-white px-4
              text-xs font-medium
              text-slate-600
              transition
              hover:border-blue-200
              hover:text-blue-600
              sm:w-auto
            "
          >
            <FiCalendar />
            From Date - To Date
          </button>

          {/* TYPE FILTER */}

          <div className="relative w-full sm:w-[165px]">
            <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

            <select
              value={visitFilter}
              onChange={(event) => setVisitFilter(event.target.value)}
              className="
                h-10 w-full appearance-none
                rounded-xl
                border border-slate-200
                bg-white pl-9 pr-8
                text-xs font-medium
                text-slate-600
                outline-none
                transition
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">All Types</option>

              <option value="Direct Visit">Clinic</option>

              <option value="Video Call">Online</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
              ▼
            </span>
          </div>

          {/* CLEAR */}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                inline-flex h-10
                items-center justify-center
                gap-1.5 rounded-xl
                bg-slate-100 px-3
                text-xs font-semibold
                text-slate-600
                transition
                hover:bg-slate-200
              "
            >
              <FiX />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
