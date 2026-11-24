import React from "react";

import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SpecialitiesToolbar({
  search,
  setSearch,
  entries,
  setEntries,
  setCurrentPage,
  onAdd,
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Entries */}

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Show</span>

        <select
          value={entries}
          onChange={(e) => {
            setEntries(Number(e.target.value));

            setCurrentPage(1);
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 outline-none focus:border-cyan-500"
        >
          <option value={5}>5</option>

          <option value={10}>10</option>

          <option value={20}>20</option>
        </select>

        <span>entries</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}

        <div className="relative w-full sm:w-[230px]">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);

              setCurrentPage(1);
            }}
            placeholder="Search..."
            className="pl-9"
          />
        </div>

        {/* Add */}

        <Button
          type="button"
          onClick={onAdd}
          className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
        >
          <FaPlus />
          Add
        </Button>
      </div>
    </div>
  );
}
