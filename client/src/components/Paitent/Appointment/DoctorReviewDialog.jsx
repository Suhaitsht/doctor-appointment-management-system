import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaXmark, FaTrash } from "react-icons/fa6";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function DoctorReviewDialog({
  open,
  appointment,
  existingReview,
  onClose,
  onSaved,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(existingReview?._id);

  useEffect(() => {
    if (!open) return;
    setRating(existingReview?.rating ?? 5);
    setComment(existingReview?.comment ?? "");
    setError("");
  }, [open, existingReview]);

  if (!open || !appointment) return null;

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in again.");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanComment = comment.trim();

    if (cleanComment.length < 10 || cleanComment.length > 1000) {
      setError("Review must contain 10 to 1000 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editing) {
        await axios.put(
          `${API_URL}/reviews/${existingReview._id}`,
          { rating, comment: cleanComment },
          { headers: getHeaders() },
        );
      } else {
        await axios.post(
          `${API_URL}/reviews`,
          {
            appointmentId: appointment.id || appointment._id,
            rating,
            comment: cleanComment,
          },
          { headers: getHeaders() },
        );
      }

      await onSaved?.(
        editing
          ? "Review updated successfully."
          : "Review submitted successfully.",
      );

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unable to save review.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview?._id) return;

    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.delete(`${API_URL}/reviews/${existingReview._id}`, {
        headers: getHeaders(),
      });

      await onSaved?.("Review deleted successfully.");
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete review.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="review-title" className="text-xl font-bold text-slate-900">
              {editing ? "Edit Your Review" : "Rate Your Doctor"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{appointment.doctor}</p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <FaXmark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="rounded-xl bg-slate-50 p-5 text-center">
            <p className="text-sm font-medium text-slate-700">
              How was your consultation?
            </p>

            <div className="mt-4 flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={loading}
                  aria-label={`${value} stars`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                  className="transition hover:scale-110"
                >
                  <FaStar
                    size={32}
                    className={
                      value <= rating ? "text-amber-400" : "text-slate-300"
                    }
                  />
                </button>
              ))}
            </div>

            <p className="mt-3 font-semibold text-amber-600">
              {rating} / 5 Stars
            </p>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Your Review
            </label>

            <textarea
              id="review-comment"
              rows={5}
              maxLength={1000}
              disabled={loading}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your consultation experience..."
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {comment.length}/1000
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {editing && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
              >
                <FaTrash />
                Delete
              </button>
            )}

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || comment.trim().length < 10}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editing
                    ? "Update Review"
                    : "Submit Review"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
