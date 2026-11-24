import React from "react";

import { FaPen, FaTrash, FaImage } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ======================================================
// BACKEND BASE URL
// ======================================================

// .env
// VITE_API_URL=http://localhost:5000/api

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

// ======================================================
// IMAGE URL HELPER
// ======================================================

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  // Full URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Backend relative URL
  // /uploads/specialities/image.png

  return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

// ======================================================
// SPECIALITIES TABLE
// ======================================================

export default function SpecialitiesTable({
  specialities = [],

  filteredCount = 0,

  entries = 10,

  startIndex = 0,

  currentPage = 1,

  totalPages = 1,

  setCurrentPage,

  onEdit,

  onDelete,
}) {
  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm">
      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          {/* ============================================= */}
          {/* HEADER */}
          {/* ============================================= */}

          <thead>
            <tr className="bg-slate-50 text-slate-900">
              <th className="w-[18%] px-4 py-4 font-semibold">#</th>

              <th className="w-[38%] px-4 py-4 font-semibold">Specialities</th>

              <th className="w-[18%] px-4 py-4 font-semibold">Status</th>

              <th className="px-4 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          {/* ============================================= */}
          {/* BODY */}
          {/* ============================================= */}

          <tbody>
            {specialities.map((speciality) => (
              <tr
                key={speciality._id}
                className="border-b border-slate-100 transition hover:bg-slate-50/70"
              >
                {/* ===================================== */}
                {/* SPECIALITY CODE */}
                {/* ===================================== */}

                <td className="px-4 py-4 font-medium text-slate-800">
                  #{speciality.specialityId || "---"}
                </td>

                {/* ===================================== */}
                {/* SPECIALITY */}
                {/* ===================================== */}

                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* IMAGE */}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-100 bg-cyan-50">
                      {speciality.image ? (
                        <img
                          src={getImageUrl(speciality.image)}
                          alt={speciality.name || "Speciality"}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <FaImage className="text-lg text-cyan-500" />
                      )}
                    </div>

                    {/* NAME */}

                    <div>
                      <p className="font-medium text-slate-700">
                        {speciality.name || "Unnamed Speciality"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {speciality.specialityId || ""}
                      </p>
                    </div>
                  </div>
                </td>

                {/* ===================================== */}
                {/* STATUS */}
                {/* ===================================== */}

                <td className="px-4 py-4">
                  {speciality.isActive ? (
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                      Inactive
                    </span>
                  )}
                </td>

                {/* ===================================== */}
                {/* ACTIONS */}
                {/* ===================================== */}

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {/* EDIT */}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit?.(speciality)}
                      className="
                          h-8
                          gap-1
                          bg-green-50
                          px-3
                          text-xs
                          text-green-600
                          hover:bg-green-100
                          hover:text-green-700
                        "
                    >
                      <FaPen />
                      Edit
                    </Button>

                    {/* DELETE */}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete?.(speciality)}
                      className="
                          h-8
                          gap-1
                          bg-red-50
                          px-3
                          text-xs
                          text-red-500
                          hover:bg-red-100
                          hover:text-red-600
                        "
                    >
                      <FaTrash />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {/* =========================================== */}
            {/* EMPTY STATE */}
            {/* =========================================== */}

            {specialities.length === 0 && (
              <tr>
                <td colSpan={4} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <FaImage className="text-xl text-slate-400" />
                    </div>

                    <p className="font-medium text-slate-600">
                      No specialities found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Add a speciality to get started.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================================================= */}
      {/* PAGINATION */}
      {/* ================================================= */}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* =============================================== */}
        {/* ENTRY INFORMATION */}
        {/* =============================================== */}

        <p className="text-xs text-slate-500">
          Showing {filteredCount === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + entries, filteredCount)} of {filteredCount}{" "}
          entries
        </p>

        {/* =============================================== */}
        {/* PAGINATION BUTTONS */}
        {/* =============================================== */}

        {filteredCount > 0 && (
          <div className="flex items-center">
            {/* PREVIOUS */}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-r-none"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((previous) => Math.max(1, previous - 1))
              }
            >
              Previous
            </Button>

            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length: totalPages,
              },

              (_, index) => index + 1,
            ).map((page) => (
              <Button
                type="button"
                key={page}
                size="sm"
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={`rounded-none ${
                  currentPage === page
                    ? "border-cyan-500 bg-cyan-500 text-white hover:bg-cyan-600"
                    : ""
                }`}
              >
                {page}
              </Button>
            ))}

            {/* NEXT */}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-l-none"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((previous) => Math.min(totalPages, previous + 1))
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
