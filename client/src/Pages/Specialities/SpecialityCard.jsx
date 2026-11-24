import React, { useState } from "react";

import { FaChevronRight, FaStethoscope } from "react-icons/fa6";

import { Card } from "@/components/ui/card";

export default function SpecialityCard({ speciality, onClick }) {
  const [imageError, setImageError] = useState(false);

  const Icon = speciality.icon || FaStethoscope;

  const showImage = Boolean(speciality.image) && !imageError;

  const doctorCount = speciality.doctors;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className="group cursor-pointer border-slate-200 p-4 shadow-none transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-center gap-4">
        {/* IMAGE / ICON */}

        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
          {showImage ? (
            <img
              src={speciality.image}
              alt={speciality.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-9 w-9 object-contain"
            />
          ) : (
            <Icon className="text-2xl text-blue-600" />
          )}
        </div>

        {/* DETAILS */}

        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-semibold text-slate-900"
            title={speciality.name}
          >
            {speciality.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {doctorCount === null ||
            doctorCount === undefined ||
            Number.isNaN(doctorCount)
              ? "View Doctors"
              : `${doctorCount} Doctors`}
          </p>
        </div>

        {/* ARROW */}

        <FaChevronRight className="shrink-0 text-xs text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>
    </Card>
  );
}
