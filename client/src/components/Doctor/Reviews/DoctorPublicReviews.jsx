import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaStar, FaRegStar, FaUser } from "react-icons/fa6";
import { LuRefreshCw, LuMessageSquare } from "react-icons/lu";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

function StarRating({ rating = 0, size = 16 }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(rating) ? (
          <FaStar key={star} size={size} className="text-amber-400" />
        ) : (
          <FaRegStar key={star} size={size} className="text-slate-300" />
        ),
      )}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DoctorPublicReviews({ doctorId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!doctorId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchReviews() {
      setLoading(true);
      setError("");
      setReviews([]);

      try {
        const response = await axios.get(
          `${API_URL}/reviews/doctor/${doctorId}`,
        );

        if (!active) return;

        const payload = response.data;

        // Supports common controller response structures.
        const list = Array.isArray(payload?.reviews)
          ? payload.reviews
          : Array.isArray(payload?.data?.reviews)
            ? payload.data.reviews
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload)
                ? payload
                : [];

        // Only display publicly visible reviews.
        setReviews(list.filter((review) => review.isVisible !== false));
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load patient reviews.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchReviews();

    return () => {
      active = false;
    };
  }, [doctorId, refreshKey]);

  const stats = useMemo(() => {
    const total = reviews.length;

    const sum = reviews.reduce(
      (acc, review) => acc + Number(review.rating || 0),
      0,
    );

    const average = total > 0 ? sum / total : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => Number(review.rating) === star,
      ).length;

      return {
        star,
        count,
        percentage: total ? (count / total) * 100 : 0,
      };
    });

    return { total, average, distribution };
  }, [reviews]);

  if (loading) {
    return (
      <div className="space-y-4 p-5 sm:p-8">
        <div className="h-8 w-52 animate-pulse rounded bg-slate-100" />
        <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          <LuRefreshCw />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="p-5 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Patient Reviews & Ratings
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Feedback from patients who visited this doctor
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <LuRefreshCw />
          Refresh
        </button>
      </div>

      {/* RATING SUMMARY */}
      <div className="mt-6 grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center border-slate-200 text-center md:border-r">
          <div className="text-5xl font-bold text-slate-900">
            {stats.average.toFixed(1)}
            <span className="text-lg text-slate-400">/5</span>
          </div>

          <div className="mt-3">
            <StarRating rating={stats.average} size={19} />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {stats.total} Patient Reviews
          </p>
        </div>

        <div className="space-y-3">
          {stats.distribution.map((item) => (
            <div key={item.star} className="flex items-center gap-3">
              <span className="flex w-9 shrink-0 items-center gap-1 text-xs font-semibold text-slate-600">
                {item.star}
                <FaStar className="text-amber-400" />
              </span>

              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <span className="w-8 text-right text-xs text-slate-500">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEW LIST */}
      <div className="mt-8">
        <h4 className="mb-5 text-base font-semibold text-slate-900">
          Patient Feedback ({stats.total})
        </h4>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center">
            <LuMessageSquare className="mx-auto text-4xl text-slate-300" />

            <p className="mt-4 font-medium text-slate-700">No Reviews Yet</p>

            <p className="mt-2 text-sm text-slate-400">
              Patient reviews will appear here after completed consultations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const patientName =
                review.patient?.name ||
                [review.patient?.firstName, review.patient?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                "Verified Patient";

              return (
                <article
                  key={review._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-100 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <FaUser />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-semibold text-slate-900">
                          {patientName}
                        </h5>

                        <span className="text-xs text-slate-400">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <StarRating rating={review.rating} size={14} />

                        <span className="text-xs font-semibold text-amber-600">
                          {review.rating}/5
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
