import React from "react";

import { FaMagnifyingGlass } from "react-icons/fa6";

import { Input } from "@/components/ui/input";

export default function ReviewsToolbar({
  search,
  setSearch,
  entries,
  setEntries,
  setCurrentPage,
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Show</span>

        <select
          value={entries}
          onChange={(e) => {
            setEntries(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 outline-none"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

        <span>entries</span>
      </div>

      <div className="relative w-full md:w-[260px]">
        <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search reviews..."
          className="pl-9"
        />
      </div>
    </div>
  );
}
