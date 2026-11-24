import React from "react";

import { FaPenToSquare, FaTrash, FaUserDoctor } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// ======================================================
// SERVER URL
// ======================================================
//
// Backend:
// http://localhost:5000
//
// API:
// http://localhost:5000/api
//
// Images:
// http://localhost:5000/uploads/...
//
// IMPORTANT:
// Do NOT add /api here.
// ======================================================

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// ======================================================
// GET IMAGE URL
// ======================================================

const getImageUrl = (image) => {
  // No image
  if (!image) {
    return "";
  }

  // Already full URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // MongoDB:
  // /uploads/doctors/doctor-123.png
  //
  // Result:
  // http://localhost:5000/uploads/doctors/doctor-123.png

  if (image.startsWith("/")) {
    return `${SERVER_URL}${image}`;
  }

  return `${SERVER_URL}/${image}`;
};

// ======================================================
// DOCTORS TABLE
// ======================================================

export default function DoctorsTable({
  doctors = [],

  filteredCount = 0,

  entries = 10,

  startIndex = 0,

  currentPage = 1,

  totalPages = 1,

  setCurrentPage,

  onEdit,

  onDelete,

  onStatusChange,
}) {
  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // ====================================================
  // FORMAT CONSULTATION FEE
  // ====================================================

  const formatFee = (fee) => {
    const amount = Number(fee);

    if (Number.isNaN(amount)) {
      return "LKR 0";
    }

    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ====================================================
  // GET INITIAL
  // ====================================================

  const getInitial = (name) => {
    if (!name) {
      return "DR";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // ====================================================
  // PAGE NUMBERS
  // ====================================================

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);

  const pages = Array.from(
    {
      length: safeTotalPages,
    },
    (_, index) => index + 1,
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Card className="border-slate-200 p-4 shadow-sm md:p-5">
      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          {/* ============================================= */}
          {/* TABLE HEADER */}
          {/* ============================================= */}

          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-semibold text-slate-700">Doctor</th>

              <th className="px-4 py-3 font-semibold text-slate-700">
                Speciality
              </th>

              <th className="px-4 py-3 font-semibold text-slate-700">
                Hospital
              </th>

              <th className="px-4 py-3 font-semibold text-slate-700">Phone</th>

              <th className="px-4 py-3 font-semibold text-slate-700">
                Member Since
              </th>

              <th className="px-4 py-3 font-semibold text-slate-700">
                Consultation Fee
              </th>

              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>

              <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
            </tr>
          </thead>

          {/* ============================================= */}
          {/* TABLE BODY */}
          {/* ============================================= */}

          <tbody>
            {doctors.map((doctor) => {
              // ===========================================
              // POPULATED USER DATA
              // ===========================================

              const user = doctor?.user || {};

              const doctorName = user?.name || "Unknown Doctor";

              const email = user?.email || "-";

              const phone = user?.phone || "-";

              const image = user?.image || "";

              const isActive = user?.isActive ?? false;

              // ===========================================
              // COMPLETE IMAGE URL
              // ===========================================

              const imageUrl = getImageUrl(image);

              return (
                <tr
                  key={doctor?._id}
                  className="
                    border-b
                    border-slate-100
                    transition
                    hover:bg-slate-50
                  "
                >
                  {/* ===================================== */}
                  {/* DOCTOR */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* ================================= */}
                      {/* PROFILE IMAGE */}
                      {/* ================================= */}

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={doctorName}
                          className="
                            h-11
                            w-11
                            shrink-0
                            rounded-full
                            border
                            border-slate-200
                            object-cover
                          "
                          loading="lazy"
                          onError={(e) => {
                            // Hide failed image.
                            e.currentTarget.style.display = "none";

                            // Show fallback initials.
                            const fallback = e.currentTarget.nextElementSibling;

                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}

                      {/* ================================= */}
                      {/* FALLBACK AVATAR */}
                      {/* ================================= */}

                      <div
                        style={{
                          display: imageUrl ? "none" : "flex",
                        }}
                        className="
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-50
                          text-xs
                          font-semibold
                          text-blue-600
                        "
                      >
                        {getInitial(doctorName)}
                      </div>

                      {/* ================================= */}
                      {/* USER DETAILS */}
                      {/* ================================= */}

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {doctorName}
                        </p>

                        <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                          {email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ===================================== */}
                  {/* SPECIALITY */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <span
                      className="
                        inline-flex
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-blue-600
                      "
                    >
                      {doctor?.speciality || "-"}
                    </span>
                  </td>

                  {/* ===================================== */}
                  {/* HOSPITAL */}
                  {/* ===================================== */}

                  <td className="px-4 py-4 text-slate-600">
                    {doctor?.hospital || "-"}
                  </td>

                  {/* ===================================== */}
                  {/* PHONE */}
                  {/* ===================================== */}

                  <td className="px-4 py-4 text-slate-600">{phone}</td>

                  {/* ===================================== */}
                  {/* MEMBER SINCE */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <p className="text-slate-700">
                      {formatDate(doctor?.memberSince)}
                    </p>

                    {doctor?.memberTime && (
                      <p className="mt-1 text-xs text-slate-400">
                        {doctor.memberTime}
                      </p>
                    )}
                  </td>

                  {/* ===================================== */}
                  {/* CONSULTATION FEE */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-800">
                      {formatFee(doctor?.consultationFee)}
                    </span>
                  </td>

                  {/* ===================================== */}
                  {/* ACCOUNT STATUS */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) =>
                          onStatusChange?.(doctor._id, checked)
                        }
                      />

                      <span
                        className={`text-xs font-medium ${
                          isActive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>

                  {/* ===================================== */}
                  {/* ACTIONS */}
                  {/* ===================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {/* EDIT */}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(doctor)}
                        className="
                          gap-2
                          border-blue-200
                          text-blue-600
                          hover:bg-blue-50
                          hover:text-blue-700
                        "
                      >
                        <FaPenToSquare />
                        Edit
                      </Button>

                      {/* DELETE */}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete?.(doctor)}
                        className="
                          gap-2
                          border-red-200
                          text-red-500
                          hover:bg-red-50
                          hover:text-red-600
                        "
                      >
                        <FaTrash />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* =========================================== */}
            {/* EMPTY TABLE */}
            {/* =========================================== */}

            {doctors.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className="
                        mb-3
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-full
                        bg-slate-100
                      "
                    >
                      <FaUserDoctor className="text-xl text-slate-400" />
                    </div>

                    <p className="font-medium text-slate-700">
                      No doctors found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or add a new doctor.
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

      <div
        className="
          mt-5
          flex
          flex-col
          gap-4
          border-t
          border-slate-100
          pt-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* =============================================== */}
        {/* RESULT INFORMATION */}
        {/* =============================================== */}

        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {filteredCount === 0 ? 0 : startIndex + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-700">
            {Math.min(startIndex + entries, filteredCount)}
          </span>{" "}
          of <span className="font-medium text-slate-700">{filteredCount}</span>{" "}
          entries
        </p>

        {/* =============================================== */}
        {/* PAGINATION BUTTONS */}
        {/* =============================================== */}

        <div className="flex flex-wrap items-center gap-2">
          {/* PREVIOUS */}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() =>
              setCurrentPage?.((previous) => Math.max(1, previous - 1))
            }
          >
            Previous
          </Button>

          {/* PAGE NUMBERS */}

          {pages.map((page) => (
            <Button
              type="button"
              key={page}
              size="sm"
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage?.(page)}
              className={
                currentPage === page
                  ? "bg-cyan-500 text-white hover:bg-cyan-600"
                  : ""
              }
            >
              {page}
            </Button>
          ))}

          {/* NEXT */}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= safeTotalPages}
            onClick={() =>
              setCurrentPage?.((previous) =>
                Math.min(safeTotalPages, previous + 1),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
