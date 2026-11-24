import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminReviews,
  updateAdminReviewVisibility,
  clearAdminReviewError,
} from "@/redux/slices/adminReviewSlice";
import { FaStar, FaRegStar, FaEye, FaEyeSlash } from "react-icons/fa6";
import {
  LuSearch,
  LuRefreshCw,
  LuMessageSquare,
  LuChevronLeft,
  LuChevronRight,
  LuX,
} from "react-icons/lu";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function imageUrl(value) {
  const path =
    typeof value === "string"
      ? value
      : value?.secure_url || value?.url || value?.path || "";

  if (!path || typeof path !== "string") return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;

  if (path.startsWith("//")) {
    return `${window.location.protocol}${path}`;
  }

  return `${API_ORIGIN}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

function displayName(user, fallback) {
  if (!user || typeof user !== "object") return fallback;

  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.displayName ||
    fallback
  );
}

function normalizeReview(review) {
  const patient = review.patient || {};
  const doctor = review.doctor || {};
  const doctorUser = doctor.user || {};

  const date = review.createdAt ? new Date(review.createdAt) : null;

  const validDate = date && !Number.isNaN(date.getTime());

  return {
    ...review,
    id: review._id,
    patientName: displayName(patient, "Patient"),
    patientImage: imageUrl(patient.image || patient.profileImage),
    doctorName: doctor.displayName || displayName(doctorUser, "Doctor"),
    doctorImage: imageUrl(
      doctorUser.image ||
        doctor.image ||
        doctorUser.profileImage ||
        doctor.profileImage,
    ),
    rating: Number(review.rating) || 0,
    description: review.comment || "",
    date: validDate
      ? date.toLocaleDateString("en-LK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Colombo",
        })
      : "-",
    time: validDate
      ? date.toLocaleTimeString("en-LK", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Colombo",
        })
      : "-",
    isVisible: review.isVisible !== false,
  };
}

function Avatar({ src, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{(name || "U").charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= value ? (
          <FaStar key={star} className="text-amber-400" />
        ) : (
          <FaRegStar key={star} className="text-slate-300" />
        ),
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-xl text-blue-600">
        {icon}
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const dispatch = useDispatch();

  const {
    reviews: rawReviews = [],
    loading = false,
    updatingId = null,
    error,
    actionError,
    pagination,
    stats,
  } = useSelector((state) => state.adminReviews || {});

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedReview, setSelectedReview] = useState(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      page,
      limit,
      search,
      rating,
      status,
      sort,
    }),
    [page, limit, search, rating, status, sort],
  );

  // Fetch from backend when query changes
  useEffect(() => {
    dispatch(fetchAdminReviews(query));
  }, [dispatch, query]);

  const reviews = useMemo(
    () => (Array.isArray(rawReviews) ? rawReviews.map(normalizeReview) : []),
    [rawReviews],
  );

  const total = pagination?.total || 0;
  const totalPages = Math.max(1, pagination?.totalPages || 1);
  const start = (page - 1) * limit;

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const refresh = () => dispatch(fetchAdminReviews(query));

  const confirmVisibility = async () => {
    if (!selectedReview?.id || updatingId) return;

    try {
      await dispatch(
        updateAdminReviewVisibility({
          reviewId: selectedReview.id,
          isVisible: !selectedReview.isVisible,
        }),
      ).unwrap();

      setSelectedReview(null);
      dispatch(fetchAdminReviews(query));
    } catch {
      // Error is displayed using Redux actionError.
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">Dashboard / Reviews</p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <LuRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={stats?.total || 0}
          icon={<LuMessageSquare />}
        />
        <StatCard
          title="Average Rating"
          value={`${Number(stats?.average || 0).toFixed(1)} / 5`}
          icon={<FaStar />}
        />
        <StatCard
          title="Visible Reviews"
          value={stats?.visible || 0}
          icon={<FaEye />}
        />
        <StatCard
          title="Hidden Reviews"
          value={stats?.hidden || 0}
          icon={<FaEyeSlash />}
        />
      </div>

      {/* ERRORS */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {actionError}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Show
            <select
              value={limit}
              onChange={(e) => changeFilter(setLimit, Number(e.target.value))}
              className="rounded-lg border bg-white px-3 py-2"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            entries
          </div>

          <div className="relative w-full sm:w-72">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search patient, doctor, review..."
              className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={rating}
            onChange={(e) => changeFilter(setRating, e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Stars
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => changeFilter(setStatus, e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>

          <select
            value={sort}
            onChange={(e) => changeFilter(setSort, e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700">
              <tr>
                {[
                  "Patient",
                  "Doctor",
                  "Rating",
                  "Description",
                  "Date",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    <LuRefreshCw className="mx-auto mb-3 animate-spin text-2xl" />
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={review.patientImage}
                          name={review.patientName}
                        />
                        <span className="text-sm font-medium">
                          {review.patientName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={review.doctorImage}
                          name={review.doctorName}
                        />
                        <span className="text-sm font-medium">
                          {review.doctorName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <Rating value={review.rating} />
                      <span className="mt-1 block text-xs text-slate-400">
                        {review.rating}/5
                      </span>
                    </td>

                    <td className="max-w-[250px] px-5 py-4 text-sm text-slate-600">
                      <p className="line-clamp-2" title={review.description}>
                        {review.description || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div>{review.date}</div>
                      <div className="text-xs text-slate-400">
                        {review.time}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          review.isVisible
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {review.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={Boolean(updatingId)}
                        onClick={() => {
                          dispatch(clearAdminReviewError());
                          setSelectedReview(review);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                          review.isVisible
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {review.isVisible ? (
                          <>
                            <FaEyeSlash /> Hide
                          </>
                        ) : (
                          <>
                            <FaEye /> Show
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SERVER PAGINATION */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4">
          <p className="text-xs text-slate-500">
            {total > 0
              ? `Showing ${start + 1} to ${start + reviews.length} of ${total} reviews`
              : "Showing 0 reviews"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
            >
              <LuChevronLeft /> Previous
            </button>

            <span className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
            >
              Next <LuChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-confirm-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 id="review-confirm-title" className="text-lg font-bold">
                {selectedReview.isVisible ? "Hide Review?" : "Show Review?"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                disabled={Boolean(updatingId)}
                onClick={() => setSelectedReview(null)}
              >
                <LuX />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Review by {selectedReview.patientName} for{" "}
              {selectedReview.doctorName}.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {selectedReview.isVisible
                ? "This review will be hidden from the public doctor profile."
                : "This review will be visible on the public doctor profile."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => setSelectedReview(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={confirmVisibility}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {updatingId
                  ? "Updating..."
                  : selectedReview.isVisible
                    ? "Hide Review"
                    : "Show Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
