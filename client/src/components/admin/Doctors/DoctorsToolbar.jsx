import React from "react";

import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DoctorsToolbar({
  search,
  setSearch,
  entries,
  setEntries,
  setCurrentPage,
  onAddDoctor,
}) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Doctors</h1>
        </div>

        <Button
          onClick={onAddDoctor}
          className="gap-2 bg-cyan-500 hover:bg-cyan-600"
        >
          <FaPlus />
          Add Doctor
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>Show</span>

          <select
            value={entries}
            onChange={(e) => {
              setEntries(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-2"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>

          <span>entries</span>
        </div>

        <div className="relative w-full md:w-[260px]">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search doctors..."
            className="pl-9"
          />
        </div>
      </div>
    </>
  );
}
