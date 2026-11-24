import { useState } from "react";
import { FaFilter, FaCheck } from "react-icons/fa6";
import { Button } from "@/components/ui/button";

export default function AppointmentFilter({ selectedFilter, onFilterChange }) {
  const [open, setOpen] = useState(false);

  const filters = [
    { label: "All", value: "all" },
    { label: "General Visit", value: "General Visit" },
    { label: "Video Call", value: "Video Call" },
    { label: "Direct Visit", value: "Direct Visit" },
  ];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 gap-2 text-xs"
      >
        <FaFilter className="text-slate-500" />
        Filter By
      </Button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-48 rounded-lg border bg-white p-2 shadow-lg">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500">
            Appointment Type
          </p>

          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                onFilterChange(filter.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {filter.label}

              {selectedFilter === filter.value && (
                <FaCheck className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
