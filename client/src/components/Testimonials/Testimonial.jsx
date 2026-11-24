import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Star,
  Quote,
  UserRound,
  RefreshCw,
  AlertCircle,
  MessageSquareQuote,
  ArrowRight,
} from "lucide-react";

import { fetchPublicReviews } from "@/redux/slices/reviewSlice";

// ==========================================
// IMAGE URL HELPER
// ==========================================

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (
    /^https?:\/\//i.test(image) ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// STAR RATING
// ==========================================

function StarRating({ rating = 0 }) {
  const safeRating = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < safeRating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

// ==========================================
// PATIENT AVATAR
// ==========================================

function PatientAvatar({ image, name }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  const initial = String(name || "P")
    .trim()
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-cyan-100 shadow-sm">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={name || "Patient"}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : initial ? (
        <span className="text-base font-bold text-blue-600">{initial}</span>
      ) : (
        <UserRound className="h-5 w-5 text-blue-600" />
      )}
    </div>
  );
}

// ==========================================
// REVIEW CARD
// ==========================================

function ReviewCard({ review }) {
  const patient = review.patient || {};

  const patientName =
    patient.name ||
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    "Patient";

  const comment = review.comment || "";

  const reviewDate = review.createdAt ? new Date(review.createdAt) : null;

  const formattedDate =
    reviewDate && !Number.isNaN(reviewDate.getTime())
      ? reviewDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <Card className="group relative flex h-full min-h-[270px] flex-col overflow-hidden rounded-2xl border border-blue-100/80 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60">
      {/* TOP ACCENT */}

      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />

      <CardContent className="flex flex-1 flex-col px-6 pb-4 pt-6">
        {/* RATING + QUOTE */}

        <div className="flex items-start justify-between gap-3">
          <StarRating rating={review.rating} />

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-100">
            <Quote className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        {/* REVIEW TEXT */}

        <div className="mt-5 flex-1">
          <h3 className="mb-2 text-sm font-bold text-slate-900">
            Patient Experience
          </h3>

          <p className="line-clamp-5 text-sm leading-6 text-slate-600">
            “{comment}”
          </p>
        </div>
      </CardContent>

      {/* PATIENT INFO */}

      <CardFooter className="mx-6 flex items-center gap-3 border-t border-slate-100 px-0 py-4">
        <PatientAvatar image={patient.image} name={patientName} />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-900">
            {patientName}
          </h4>

          <p className="mt-0.5 text-xs text-slate-400">Patient Review</p>
        </div>

        {formattedDate && (
          <span className="shrink-0 text-xs text-slate-400">
            {formattedDate}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

// ==========================================
// LOADING SKELETON
// ==========================================

function ReviewSkeleton() {
  return (
    <div className="h-[270px] animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex justify-between">
        <div className="h-4 w-28 rounded bg-slate-100" />
        <div className="h-9 w-9 rounded-xl bg-slate-100" />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="h-11 w-11 rounded-full bg-slate-100" />

        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="h-2 w-20 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN TESTIMONIAL COMPONENT
// ==========================================

export default function Testimonial() {
  const dispatch = useDispatch();

  const { publicReviews, publicLoading, publicError, publicLoaded } =
    useSelector((state) => state.reviews);

  // ========================================
  // FETCH REVIEWS
  // ========================================

  useEffect(() => {
    if (!publicLoaded) {
      dispatch(fetchPublicReviews(9));
    }
  }, [dispatch, publicLoaded]);

  // ========================================
  // AUTO SLIDE
  // ========================================

  const [autoplay] = useState(() =>
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  // ========================================
  // RETRY
  // ========================================

  const handleRetry = () => {
    dispatch(fetchPublicReviews(9));
  };

  // ========================================
  // REVIEWS
  // ========================================

  const reviews = Array.isArray(publicReviews)
    ? publicReviews.filter((review) => review.isVisible !== false)
    : [];

  const showSkeleton = publicLoading && reviews.length === 0;

  return (
    <section className="relative mt-12 overflow-hidden bg-gradient-to-br from-[#eef6ff] via-[#f8fbff] to-[#e8f7f5] py-16 md:mt-16 md:py-20">
      {/* DECORATIVE BACKGROUND */}

      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full border border-white/70" />

      <div className="pointer-events-none absolute -left-12 top-24 h-52 w-52 rounded-full border border-white/60" />

      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full border border-white/70" />

      <div className="pointer-events-none absolute right-12 top-10 h-36 w-36 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="container-custom relative mx-auto px-4">
        {/* ===================================
            SECTION HEADER
        =================================== */}

        <div className="mx-auto mb-10 max-w-[720px] text-center">
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-200/50">
              <MessageSquareQuote className="h-4 w-4" />
              Patient Testimonials
            </span>
          </div>

          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            What Our Patients{" "}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
              Say About Us
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-[560px] text-sm leading-6 text-slate-500 sm:text-base">
            Discover experiences shared by patients about their consultations
            and medical care.
          </p>
        </div>

        {/* ===================================
            API ERROR
        =================================== */}

        {publicError && (
          <div className="mx-auto mb-6 flex max-w-[680px] flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white p-4">
            <div
              role="alert"
              className="flex items-center gap-2 text-sm text-red-600"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{publicError}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={publicLoading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* ===================================
            LOADING SKELETON
        =================================== */}

        {showSkeleton && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ReviewSkeleton key={index} />
            ))}
          </div>
        )}

        {/* ===================================
            REVIEWS CAROUSEL
        =================================== */}

        {!showSkeleton && reviews.length > 0 && (
          <Carousel
            plugins={[autoplay]}
            opts={{
              align: "start",
              loop: reviews.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 py-4">
              {reviews.map((review) => (
                <CarouselItem
                  key={review._id}
                  className="basis-full pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="h-full p-1">
                    <ReviewCard review={review} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* NAVIGATION */}

            {reviews.length > 3 && (
              <div className="mt-7 flex items-center justify-center gap-3">
                <CarouselPrevious
                  variant="outline"
                  className="static h-10 w-10 translate-y-0 rounded-full border-blue-200 bg-white text-blue-600 hover:bg-blue-600 hover:text-white"
                />

                <CarouselNext
                  variant="outline"
                  className="static h-10 w-10 translate-y-0 rounded-full border-blue-200 bg-white text-blue-600 hover:bg-blue-600 hover:text-white"
                />
              </div>
            )}
          </Carousel>
        )}

        {/* ===================================
            EMPTY STATE
        =================================== */}

        {!showSkeleton && !publicError && reviews.length === 0 && (
          <div className="mx-auto max-w-[520px] rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <MessageSquareQuote className="h-7 w-7 text-blue-500" />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              No Patient Reviews Yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Patient experiences will appear here when reviews are available.
            </p>
          </div>
        )}

        {/* ===================================
            BOTTOM DECORATION
        =================================== */}

        {reviews.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Feedback from our patients
            <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
          </div>
        )}
      </div>
    </section>
  );
}
