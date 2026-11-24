import React from "react";

import { FaMagnifyingGlass } from "react-icons/fa6";

import { Input } from "@/components/ui/input";

export default function InvoiceToolbar({ search, setSearch }) {
  return (
    <div className="mb-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>

        <div className="relative w-full md:w-[250px]">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
