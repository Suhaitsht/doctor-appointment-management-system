import { FaCalendarDays, FaFilter } from "react-icons/fa6";

import { IoSearchOutline } from "react-icons/io5";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PatientsToolbar({
  search,
  setSearch,
  activeTab,
  changeTab,
  activeCount,
  inactiveCount,
}) {
  return (
    <>
      {/* ===================================
          Header + Search
      =================================== */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">My Patients</h1>

        {/* Search */}
        <div className="relative w-full md:w-[250px]">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <Input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* ===================================
          Filter Controls
      =================================== */}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Active / Inactive */}
        <div className="flex items-center gap-2">
          {/* Active */}
          <button
            type="button"
            onClick={() => changeTab("active")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Active
            <Badge
              className={
                activeTab === "active"
                  ? "bg-white text-blue-600 hover:bg-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-100"
              }
            >
              {activeCount}
            </Badge>
          </button>

          {/* Inactive */}
          <button
            type="button"
            onClick={() => changeTab("inactive")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "inactive"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            InActive
            <Badge
              className={
                activeTab === "inactive"
                  ? "bg-white text-blue-600 hover:bg-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-100"
              }
            >
              {inactiveCount}
            </Badge>
          </button>
        </div>

        {/* Date + Filter */}
        <div className="flex flex-wrap gap-2">
          {/* Date */}
          <Button type="button" variant="outline" className="gap-2 text-xs">
            <FaCalendarDays />
            08/16/2026 - 08/22/2026
          </Button>

          {/* Filter */}
          <Button type="button" variant="outline" className="gap-2 text-xs">
            <FaFilter />
            Filter By
          </Button>
        </div>
      </div>
    </>
  );
}
