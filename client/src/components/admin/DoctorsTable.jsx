import React, { useState } from "react";
import { FaStar, FaUserDoctor } from "react-icons/fa6";
import { Card } from "@/components/ui/card";

// ==========================================
// CONFIGURATION
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_BASE_URL}${image}`;
  }

  return `${API_BASE_URL}/${image}`;
};

// ==========================================
// CURRENCY FORMATTER
// ==========================================

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(numericAmount);
};

// ==========================================
// DOCTOR IMAGE
// ==========================================

function DoctorAvatar({ doctor, name }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getImageUrl(
    doctor.image || doctor.profileImage || doctor.user?.image,
  );

  if (!imageUrl || imageFailed) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <FaUserDoctor className="text-sm" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setImageFailed(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

// ==========================================
// REVIEWS COMPONENT
// ==========================================

function DoctorReviews({ rating }) {
  const numericRating = Number(rating);

  if (
    rating === null ||
    rating === undefined ||
    !Number.isFinite(numericRating)
  ) {
    return <span className="text-xs text-slate-400">No reviews</span>;
  }

  const safeRating = Math.max(0, Math.min(5, numericRating));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rating ${safeRating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={
            star <= Math.round(safeRating) ? "text-amber-400" : "text-slate-200"
          }
        />
      ))}

      <span className="ml-1 text-slate-500">{safeRating.toFixed(1)}</span>
    </div>
  );
}

// ==========================================
// MAIN DOCTORS TABLE
// ==========================================

export default function DoctorsTable({ doctors = [], loading = false }) {
  const doctorList = Array.isArray(doctors) ? doctors : [];

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Doctors List</h3>

        <span className="text-xs text-slate-400">Recent Doctors</span>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Doctor Name</th>

              <th className="px-4 py-3 font-semibold">Speciality</th>

              <th className="px-4 py-3 font-semibold">Earned</th>

              <th className="px-4 py-3 font-semibold">Reviews</th>
            </tr>
          </thead>

          <tbody>
            {/* LOADING */}
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading doctors...
                </td>
              </tr>
            ) : doctorList.length === 0 ? (
              /* EMPTY STATE */
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FaUserDoctor className="text-2xl" />
                    <p>No doctors found</p>
                  </div>
                </td>
              </tr>
            ) : (
              /* DYNAMIC DOCTORS */
              doctorList.map((doctor) => {
                const doctorName =
                  doctor.name ||
                  doctor.user?.name ||
                  [doctor.firstName, doctor.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "Unknown Doctor";

                const speciality =
                  doctor.speciality?.name ||
                  doctor.speciality ||
                  doctor.specialization?.name ||
                  doctor.specialization ||
                  "Not specified";

                // Earnings must be supplied by a
                // backend aggregation, not inferred
                // from consultation fee.
                const earned = doctor.earned ?? doctor.totalEarned ?? null;

                const rating = doctor.averageRating ?? doctor.rating ?? null;

                return (
                  <tr
                    key={doctor._id || doctor.id}
                    className="border-t transition-colors hover:bg-slate-50"
                  >
                    {/* DOCTOR NAME */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DoctorAvatar doctor={doctor} name={doctorName} />

                        <span className="min-w-[110px] font-medium text-slate-800">
                          {doctorName}
                        </span>
                      </div>
                    </td>

                    {/* SPECIALITY */}
                    <td className="px-4 py-3 text-slate-600">
                      {typeof speciality === "string"
                        ? speciality
                        : "Not specified"}
                    </td>

                    {/* EARNED */}
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {formatCurrency(earned)}
                    </td>

                    {/* REVIEWS */}
                    <td className="px-4 py-3">
                      <DoctorReviews rating={rating} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
