import React, { useEffect, useState } from "react";
import {
  Star,
  X,
  Loader2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ratingLabels = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export default function DoctorReviewDialog({
  open,
  onClose,
  appointment,
  existingReview = null,
  token,
  onSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(existingReview?._id);

  useEffect(() => {
    if (!open) return;

    setRating(existingReview?.rating ?? 5);
    setComment(existingReview?.comment ?? "");
    setError("");
  }, [open, existingReview]);

  if (!open) return null;

  const doctorName =
    appointment?.doctor?.user?.name ||
    appointment?.doctor?.displayName ||
    "Doctor";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please select a valid rating.");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Review must contain at least 10 characters.");
      return;
    }

    if (comment.trim().length > 1000) {
      setError("Review cannot exceed 1000 characters.");
      return;
    }

    if (!token) {
      setError("Please log in to submit your review.");
      return;
    }

    if (!isEditing && !appointment?._id) {
      setError("Appointment ID is missing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isEditing
        ? `${API_URL}/reviews/${existingReview._id}`
        : `${API_URL}/reviews`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(isEditing ? {} : { appointmentId: appointment._id }),
          rating,
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save review.");
      }

      await onSuccess?.(result.review);

      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-review-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="doctor-review-title"
              className="text-xl font-bold text-slate-900"
            >
              {isEditing ? "Edit Your Review" : "Rate Your Doctor"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Share your consultation experience with {doctorName}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close review dialog"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <p className="text-sm font-semibold text-slate-700">
              How was your consultation?
            </p>

            <div className="mt-4 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} out of 5`}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={35}
                    className={
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }
                  />
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm font-semibold text-amber-600">
              {ratingLabels[rating]}
            </p>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <MessageSquare size={17} />
              Your Review
            </label>

            <textarea
              id="review-comment"
              rows={5}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us about your consultation experience..."
              className="w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {comment.length}/1000
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600"
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Reviews are available after a completed consultation.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || comment.trim().length < 10}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Star size={17} />
                  {isEditing ? "Update Review" : "Submit Review"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
