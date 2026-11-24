import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Breadcrumb from "../assets/breadcrumb-bg-01.png";
import api from "../api/axios";
import { fetchPublicDoctorById } from "../redux/slices/doctorSlice";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  FaMoneyCheckDollar,
  FaGraduationCap,
  FaUserDoctor,
  FaLanguage,
  FaStar,
  FaRegStar,
  FaUser,
} from "react-icons/fa6";

import {
  LuHospital,
  LuClock,
  LuCalendarDays,
  LuStethoscope,
  LuRefreshCw,
  LuMessageSquare,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";

import { MdOutlineUpdate } from "react-icons/md";

// ======================================================
// CONFIGURATION
// ======================================================

const REVIEWS_PER_PAGE = 5;

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN || API_URL.replace(/\/api\/?$/, "")
).replace(/\/$/, "");

const DEFAULT_DOCTOR_IMAGE = "https://placehold.co/600x700?text=Doctor";

// ======================================================
// HELPERS
// ======================================================

function resolveImage(image) {
  const value =
    typeof image === "string" ? image : image?.url || image?.secure_url || "";

  if (!value) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  return `${API_ORIGIN}/${value.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

function getDoctorImage(doctor) {
  return (
    resolveImage(
      doctor?.user?.image || doctor?.image || doctor?.profileImage,
    ) || DEFAULT_DOCTOR_IMAGE
  );
}

function getDoctorName(doctor) {
  const fullName = [doctor?.user?.firstName, doctor?.user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const name =
    doctor?.displayName ||
    doctor?.user?.name ||
    fullName ||
    doctor?.name ||
    "Doctor";

  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function getPatientName(patient) {
  return (
    [patient?.firstName, patient?.lastName].filter(Boolean).join(" ").trim() ||
    patient?.name ||
    "Patient"
  );
}

function getDoctorLanguages(doctor) {
  const languages = doctor?.user?.languages || doctor?.languages;

  if (!Array.isArray(languages) || !languages.length) {
    return "Not specified";
  }

  return (
    languages
      .map((item) => (typeof item === "string" ? item : item?.name))
      .filter(Boolean)
      .join(", ") || "Not specified"
  );
}

function getExperience(doctor) {
  if (Array.isArray(doctor?.experiences)) {
    return doctor.experiences.reduce(
      (total, item) => total + Number(item?.yearsOfExperience || 0),
      0,
    );
  }

  return Number(doctor?.experience) || 0;
}

function getQualification(doctor) {
  const courses = Array.isArray(doctor?.education)
    ? doctor.education.map((item) => item?.course).filter(Boolean)
    : [];

  return (
    courses.join(", ") ||
    doctor?.qualification ||
    doctor?.speciality ||
    "Medical Specialist"
  );
}

function formatDate(value, monthOnly = false) {
  if (!value) return monthOnly ? "Present" : "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-LK", {
    ...(monthOnly
      ? { month: "short", year: "numeric" }
      : {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
  });
}

// ======================================================
// STAR RATING
// ======================================================

function StarRating({ rating = 0, size = 16 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(value) ? (
          <FaStar key={star} size={size} className="text-amber-400" />
        ) : (
          <FaRegStar key={star} size={size} className="text-slate-300" />
        ),
      )}
    </div>
  );
}

// ======================================================
// COMMON UI
// ======================================================

function SectionHeading({
  icon,
  title,
  description,
  iconClassName = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          available ? "bg-green-500" : "bg-red-500"
        }`}
      />

      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function DoctorProfileLoading() {
  return (
    <div className="min-h-[600px] bg-slate-50 py-10">
      <div className="container-custom">
        <div className="grid animate-pulse overflow-hidden rounded-2xl border bg-white md:grid-cols-[300px_1fr]">
          <div className="h-[360px] bg-slate-200" />

          <div className="space-y-5 p-7">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-8 w-64 max-w-full rounded bg-slate-200" />
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-16 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// EDUCATION
// ======================================================

function DoctorEducation({ education }) {
  return (
    <section>
      <SectionHeading
        icon={<FaGraduationCap />}
        title="Education"
        description="Academic qualifications"
        iconClassName="bg-indigo-50 text-indigo-600"
      />

      {!education.length ? (
        <div className="mt-5 rounded-xl border border-dashed bg-slate-50 p-8 text-center">
          <FaGraduationCap className="mx-auto text-3xl text-slate-300" />

          <p className="mt-3 text-sm text-slate-400">
            No education information available.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {education.map((item, index) => (
            <div
              key={item?._id || index}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-blue-200"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
                  <FaGraduationCap />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {item?.institutionName || "Institution"}
                  </h4>

                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {item?.course || "Medical Course"}
                  </p>

                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <LuCalendarDays />

                    {formatDate(item?.startDate, true)}
                    {" - "}
                    {formatDate(item?.endDate, true)}
                  </p>

                  {Number(item?.numberOfYears) > 0 && (
                    <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                      {item.numberOfYears} Years
                    </span>
                  )}

                  {item?.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ======================================================
// EXPERIENCE
// ======================================================

function DoctorExperience({ experiences }) {
  return (
    <section>
      <SectionHeading
        icon={<LuHospital />}
        title="Work & Experience"
        description="Professional experience"
        iconClassName="bg-cyan-50 text-cyan-600"
      />

      {!experiences.length ? (
        <div className="mt-5 rounded-xl border border-dashed bg-slate-50 p-8 text-center">
          <LuHospital className="mx-auto text-3xl text-slate-300" />

          <p className="mt-3 text-sm text-slate-400">
            No work experience information available.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {experiences.map((item, index) => (
            <div
              key={item?._id || index}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-cyan-200"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-cyan-600">
                  <LuHospital />
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {item?.hospital || "Hospital"}
                  </h4>

                  {Number(item?.yearsOfExperience) > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs text-cyan-700">
                      {item.yearsOfExperience} Years Experience
                    </span>
                  )}

                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <LuCalendarDays />

                    {formatDate(item?.startDate, true)}
                    {" - "}
                    {formatDate(item?.endDate, true)}
                  </p>

                  {item?.jobDescription && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.jobDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ======================================================
// WORKING HOURS
// ======================================================

function DoctorWorkingHours({ availability, isAvailable, hasWorkingHours }) {
  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <SectionHeading
          icon={<LuClock />}
          title="Working Hours"
          description="Doctor's weekly appointment schedule"
          iconClassName="bg-blue-600 text-white"
        />

        {hasWorkingHours && (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            Weekly Timings Configured
          </span>
        )}
      </div>

      {!isAvailable && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This doctor is currently unavailable for new bookings. Weekly hours
          are shown for reference only.
        </div>
      )}

      {!availability.length ? (
        <div className="py-16 text-center">
          <LuClock className="mx-auto text-4xl text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-800">
            No Working Hours Available
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            This doctor has not added appointment availability yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availability.map((day, index) => {
            const slots = Array.isArray(day?.slots) ? day.slots : [];

            const hasSlots = slots.length > 0;

            return (
              <div
                key={day?._id || day?.day || index}
                className={`rounded-xl border p-4 ${
                  hasSlots
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <LuCalendarDays />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {day?.day || "-"}
                      </h4>

                      <p className="mt-1 text-xs text-slate-400">
                        {hasSlots ? `${slots.length} slots` : "Unavailable"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      hasSlots ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                </div>

                {hasSlots ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {slots.map((slot, slotIndex) => (
                      <div
                        key={slot?._id || slotIndex}
                        className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        <LuClock className="text-blue-500" />

                        {slot.startTime}
                        {" - "}
                        {slot.endTime}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed py-3 text-center text-xs text-slate-400">
                    Closed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ======================================================
// PATIENT AVATAR
// ======================================================

function PatientAvatar({ patient }) {
  const [failed, setFailed] = useState(false);

  const name = getPatientName(patient);
  const image = resolveImage(patient?.image);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
      <FaUser />
    </div>
  );
}

// ======================================================
// RATING DISTRIBUTION
// ======================================================

function RatingDistribution({ averageRating, totalReviews, distribution }) {
  return (
    <div className="mt-6 grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[210px_1fr] md:p-6">
      <div className="flex flex-col items-center justify-center text-center md:border-r md:pr-6">
        <div className="text-5xl font-bold text-slate-900">
          {Number(averageRating || 0).toFixed(1)}

          <span className="ml-1 text-lg font-medium text-slate-400">/5</span>
        </div>

        <div className="mt-3">
          <StarRating rating={averageRating} size={19} />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Based on {totalReviews} patient{" "}
          {totalReviews === 1 ? "review" : "reviews"}
        </p>
      </div>

      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count =
            distribution.find((item) => Number(item.star) === star)?.count || 0;

          const percentage =
            totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="flex w-9 items-center gap-1 text-xs font-semibold text-slate-600">
                {star}
                <FaStar className="text-amber-400" />
              </span>

              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-8 text-right text-xs text-slate-500">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// REVIEW CARD
// ======================================================

function ReviewCard({ review }) {
  const patientName = getPatientName(review.patient);

  const edited =
    review.updatedAt &&
    review.createdAt &&
    new Date(review.updatedAt).getTime() -
      new Date(review.createdAt).getTime() >
      1000;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-100 hover:shadow-sm">
      <div className="flex items-start gap-3 sm:gap-4">
        <PatientAvatar patient={review.patient} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h5 className="text-sm font-semibold text-slate-900">
                {patientName}
              </h5>

              <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                Patient Review
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {formatDate(review.createdAt)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <StarRating rating={review.rating} size={14} />

            <span className="text-xs font-semibold text-amber-600">
              {review.rating}/5
            </span>
          </div>

          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
            {review.comment}
          </p>

          {edited && <p className="mt-3 text-xs text-slate-400">Edited</p>}
        </div>
      </div>
    </article>
  );
}

// ======================================================
// DYNAMIC DOCTOR REVIEWS
// ======================================================

function DoctorReviews({ doctorId }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [distribution, setDistribution] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset pagination when doctor changes
  useEffect(() => {
    setPage(1);
    setRatingFilter("all");
    setSortBy("newest");
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadReviews() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/reviews/doctor/${doctorId}`, {
          params: {
            page,
            limit: REVIEWS_PER_PAGE,
          },
          signal: controller.signal,
        });

        if (data?.success !== true) {
          throw new Error("Unable to load doctor reviews.");
        }

        if (controller.signal.aborted) return;

        setReviews(Array.isArray(data.reviews) ? data.reviews : []);

        setAverageRating(Number(data.averageRating) || 0);

        setTotalReviews(Number(data.totalReviews) || 0);

        setDistribution(
          Array.isArray(data.ratingDistribution) ? data.ratingDistribution : [],
        );

        setTotalPages(Number(data.pagination?.totalPages) || 0);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load reviews.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [doctorId, page, refreshKey]);

  // Sorting and filtering apply to the loaded page only.
  // Average and distribution always come from all visible reviews.
  const filteredReviews = [...reviews]
    .filter((review) =>
      ratingFilter === "all"
        ? true
        : Number(review.rating) === Number(ratingFilter),
    )
    .sort((a, b) => {
      if (sortBy === "highest") {
        return Number(b.rating) - Number(a.rating);
      }

      if (sortBy === "lowest") {
        return Number(a.rating) - Number(b.rating);
      }

      const aTime = new Date(a.createdAt).getTime() || 0;

      const bTime = new Date(b.createdAt).getTime() || 0;

      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading
          icon={<FaStar />}
          title="Patient Reviews & Ratings"
          description="Feedback from patients who visited this doctor"
          iconClassName="bg-amber-50 text-amber-500"
        />

        <button
          type="button"
          onClick={() => setRefreshKey((v) => v + 1)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <LuRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-44 rounded-2xl bg-slate-100" />

          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <LuMessageSquare className="mx-auto text-4xl text-red-300" />

          <p className="mt-4 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => setRefreshKey((v) => v + 1)}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <LuRefreshCw />
            Try Again
          </button>
        </div>
      ) : (
        <>
          <RatingDistribution
            averageRating={averageRating}
            totalReviews={totalReviews}
            distribution={distribution}
          />

          <div className="mt-8 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">Patient Feedback</h4>

              <p className="mt-1 text-xs text-slate-400">
                {totalReviews} total reviews · {filteredReviews.length} shown on
                this page
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                aria-label="Filter reviews by rating"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="all">All Ratings</option>

                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Stars
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort reviews"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            {totalReviews === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                <LuMessageSquare className="mx-auto text-4xl text-slate-300" />

                <h4 className="mt-4 font-semibold text-slate-700">
                  No Reviews Yet
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Patient reviews will appear here after completed
                  consultations.
                </p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <p className="text-sm text-slate-500">
                  No reviews match the selected rating on this page.
                </p>

                <button
                  type="button"
                  onClick={() => setRatingFilter("all")}
                  className="mt-3 text-sm font-medium text-blue-600"
                >
                  Show All Ratings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                >
                  <LuChevronLeft />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                  <LuChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ======================================================
// MAIN DOCTOR PROFILE
// ======================================================

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const dispatch = useDispatch();

  const { publicDoctor, publicDoctorLoading, publicDoctorError } = useSelector(
    (state) => state.doctors || {},
  );

  useEffect(() => {
    if (doctorId) {
      dispatch(fetchPublicDoctorById(doctorId));
    }
  }, [dispatch, doctorId]);

  const doctor =
    String(publicDoctor?._id || publicDoctor?.id || "") ===
    String(doctorId || "")
      ? publicDoctor
      : null;

  if (publicDoctorLoading) {
    return <DoctorProfileLoading />;
  }

  if (publicDoctorError) {
    return (
      <div className="flex min-h-[600px] items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md p-7 text-center">
          <h2 className="text-xl font-bold">Unable to Load Doctor</h2>

          <p className="mt-3 text-sm text-red-600">
            {typeof publicDoctorError === "string"
              ? publicDoctorError
              : publicDoctorError?.message || "Unable to load doctor profile."}
          </p>

          <button
            type="button"
            onClick={() => dispatch(fetchPublicDoctorById(doctorId))}
            className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <LuRefreshCw />
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  if (!doctor) {
    return <DoctorProfileLoading />;
  }

  const doctorName = getDoctorName(doctor);
  const doctorImage = getDoctorImage(doctor);

  const speciality = doctor.speciality || "Medical Specialist";

  const qualification = getQualification(doctor);

  const hospital = doctor.hospital || "Jayanthi Medical Centre";

  const consultationFee = Number(doctor.consultationFee) || 0;

  const languages = getDoctorLanguages(doctor);
  const experience = getExperience(doctor);

  const education = Array.isArray(doctor.education) ? doctor.education : [];

  const experiences = Array.isArray(doctor.experiences)
    ? doctor.experiences
    : [];

  const availability = Array.isArray(doctor.availability)
    ? doctor.availability
    : [];

  const hasWorkingHours = availability.some(
    (item) => Array.isArray(item?.slots) && item.slots.length > 0,
  );

  const isAvailable = doctor.isAvailable === true;
  const canBook = isAvailable && hasWorkingHours;

  const bookingUrl = `/doctors/${doctorId}/booking`;

  return (
    <>
      {/* BREADCRUMB */}
      <section
        className="relative bg-cover bg-center py-14 sm:py-16"
        style={{
          backgroundImage: `url(${Breadcrumb})`,
        }}
      >
        <div className="absolute inset-0 bg-white/20" />

        <div className="container-custom relative z-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>

            <span>/</span>

            <Link to="/doctors" className="hover:text-blue-600">
              Doctors
            </Link>

            <span>/</span>

            <span className="font-medium text-slate-800">Profile</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            Doctor Profile
          </h1>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <div className="container-custom">
          {/* PROFILE CARD */}
          <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
              <div className="relative min-h-[320px] overflow-hidden bg-slate-100 sm:min-h-[350px]">
                <img
                  src={doctorImage}
                  alt={doctorName}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_DOCTOR_IMAGE;
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                    <LuStethoscope />
                    {speciality}
                  </span>

                  <AvailabilityBadge available={isAvailable} />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {doctorName}
                </h2>

                <p className="mt-2 text-sm text-slate-500">{qualification}</p>

                <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                  <LuHospital className="text-lg text-blue-500" />
                  {hospital}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <div className="rounded-lg bg-white p-3 text-blue-600">
                      <MdOutlineUpdate />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Experience</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {experience > 0
                          ? `${experience} Years`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <div className="rounded-lg bg-white p-3 text-blue-600">
                      <FaLanguage />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Languages</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {languages}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-orange-50/60 p-4 sm:max-w-xs">
                  <div className="rounded-lg bg-white p-3 text-orange-500">
                    <FaMoneyCheckDollar />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Consultation Fee</p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      LKR {consultationFee.toLocaleString("en-LK")}
                    </p>
                  </div>
                </div>

                {canBook ? (
                  <Link
                    to={bookingUrl}
                    className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Book Appointment
                  </Link>
                ) : (
                  <div className="mt-6">
                    <button
                      type="button"
                      disabled
                      className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-300 text-sm font-semibold text-slate-600"
                    >
                      {isAvailable
                        ? "No Working Hours Available"
                        : "Currently Unavailable"}
                    </button>

                    <p className="mt-2 text-center text-xs text-slate-500">
                      {isAvailable
                        ? "This doctor has not configured appointment timings."
                        : "This doctor is currently not accepting new appointments."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* PROFILE TABS */}
          <div className="mt-6 sm:mt-8">
            <Tabs key={doctorId} defaultValue="overview" className="w-full">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <TabsList className="flex h-auto w-full items-center justify-start gap-1 overflow-x-auto rounded-none border-b border-slate-200 bg-white p-2">
                  <TabsTrigger
                    value="overview"
                    className="flex-none rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                  >
                    <FaUserDoctor className="mr-2" />
                    Overview
                  </TabsTrigger>

                  <TabsTrigger
                    value="working-hours"
                    className="flex-none rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                  >
                    <LuClock className="mr-2" />
                    Working Hours
                  </TabsTrigger>

                  <TabsTrigger
                    value="reviews"
                    className="flex-none rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
                  >
                    <FaStar className="mr-2" />
                    Reviews
                  </TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent
                  value="overview"
                  className="m-0 focus-visible:outline-none"
                >
                  <div className="p-5 sm:p-6 lg:p-8">
                    <section>
                      <SectionHeading
                        icon={<FaUserDoctor />}
                        title="About Doctor"
                        description="Professional information"
                      />

                      <p className="mt-5 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {doctor.about ||
                          doctor.description ||
                          `${doctorName} is a ${speciality} specialist at ${hospital}.`}
                      </p>
                    </section>

                    <div className="my-8 border-t border-slate-100" />

                    <div className="grid gap-8 lg:grid-cols-2">
                      <DoctorEducation education={education} />

                      <DoctorExperience experiences={experiences} />
                    </div>
                  </div>
                </TabsContent>

                {/* WORKING HOURS */}
                <TabsContent
                  value="working-hours"
                  className="m-0 focus-visible:outline-none"
                >
                  <DoctorWorkingHours
                    availability={availability}
                    isAvailable={isAvailable}
                    hasWorkingHours={hasWorkingHours}
                  />
                </TabsContent>

                {/* DYNAMIC REVIEWS */}
                <TabsContent
                  value="reviews"
                  className="m-0 focus-visible:outline-none"
                >
                  <DoctorReviews key={doctorId} doctorId={doctorId} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </>
  );
}
