import React from "react";

import { FaStar, FaRegStar, FaTrash } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReviewsTable({
  reviews,
  filteredCount,
  entries,
  startIndex,
  currentPage,
  totalPages,
  setCurrentPage,
  onDelete,
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4">Patient Name</th>

              <th className="px-5 py-4">Doctor Name</th>

              <th className="px-5 py-4">Ratings</th>

              <th className="px-5 py-4">Description</th>

              <th className="px-5 py-4">Date</th>

              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((review) => (
              <tr
                key={review.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                {/* Patient */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.patientImage}
                      alt={review.patientName}
                      className="h-10 w-10 rounded-full object-cover"
                    />

                    <span className="font-medium text-slate-800">
                      {review.patientName}
                    </span>
                  </div>
                </td>

                {/* Doctor */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.doctorImage}
                      alt={review.doctorName}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://placehold.co/100x100?text=Doctor";
                      }}
                    />

                    <span className="font-medium text-slate-800">
                      {review.doctorName}
                    </span>
                  </div>
                </td>

                {/* Rating */}
                <td className="px-5 py-4">
                  <RatingStars rating={review.rating} />
                </td>

                {/* Description */}
                <td className="max-w-[430px] px-5 py-4 text-slate-600">
                  <p className="line-clamp-2">{review.description}</p>
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-700">{review.date}</p>

                  <p className="mt-1 text-xs text-slate-400">{review.time}</p>
                </td>

                {/* Delete */}
                <td className="px-5 py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(review)}
                    className="gap-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
                  >
                    <FaTrash />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}

            {reviews.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-16 text-center text-sm text-slate-500"
                >
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Showing {filteredCount === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + entries, filteredCount)} of {filteredCount}{" "}
          entries
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <Button
                type="button"
                key={page}
                size="sm"
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page ? "bg-cyan-500 hover:bg-cyan-600" : ""
                }
              >
                {page}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RatingStars({ rating = 0 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) =>
        star <= rating ? (
          <FaStar key={star} className="text-amber-400" />
        ) : (
          <FaRegStar key={star} className="text-slate-300" />
        ),
      )}
    </div>
  );
}
