import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

import {
  FaCalendarDays,
  FaArrowRight,
  FaStar,
  FaGraduationCap,
  FaBriefcaseMedical,
  FaUsers,
} from "react-icons/fa6";

import doctorFallback from "../../assets/doctor-grid-01.jpg";

import { Card, CardContent } from "@/components/ui/card";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { fetchFeaturedDoctors } from "@/redux/slices/featuredDoctorsSlice";

// ==========================================
// API CONFIGURATION
// ==========================================

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

// ==========================================
// DOCTOR DATA HELPERS
// ==========================================

const getDoctorImage = (doctor) => {
  const image =
    doctor?.user?.image ||
    doctor?.image ||
    doctor?.profileImage ||
    doctor?.userId?.image;

  if (!image || typeof image !== "string") {
    return doctorFallback;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

const getDoctorName = (doctor) => {
  const user = doctor?.user || doctor?.userId;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    doctor?.displayName || user?.name || doctor?.name || fullName || "Doctor"
  );
};

const getSpeciality = (doctor) => {
  const speciality =
    doctor?.speciality || doctor?.specialization || doctor?.specialty;

  if (typeof speciality === "string") {
    return speciality;
  }

  return speciality?.name || "General Medicine";
};

// ==========================================
// AVAILABILITY HELPER
// ==========================================

const getAvailability = (doctor) => {
  if (typeof doctor?.isAvailable === "boolean") {
    return doctor.isAvailable;
  }

  if (typeof doctor?.available === "boolean") {
    return doctor.available;
  }

  // Missing availability is treated as unavailable.
  return false;
};

// ==========================================
// QUALIFICATION
// ==========================================

const getQualification = (doctor) => {
  const direct = doctor?.qualification || doctor?.qualifications;

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  if (Array.isArray(direct)) {
    const qualifications = direct
      .map((item) =>
        typeof item === "string" ? item : item?.course || item?.name,
      )
      .filter(Boolean);

    if (qualifications.length > 0) {
      return qualifications.join(", ");
    }
  }

  const education = doctor?.education;

  if (!Array.isArray(education) || education.length === 0) {
    return null;
  }

  const courses = education.map((item) => item?.course).filter(Boolean);

  return courses.length > 0 ? [...new Set(courses)].join(", ") : null;
};

// ==========================================
// EXPERIENCE
// ==========================================

const getExperience = (doctor) => {
  const direct =
    doctor?.experienceYears ?? doctor?.yearsOfExperience ?? doctor?.experience;

  if (direct !== undefined && direct !== null && direct !== "") {
    const number = Number(direct);

    if (Number.isFinite(number) && number >= 0) {
      return `${number}+ Years`;
    }

    if (typeof direct === "string") {
      return direct;
    }
  }

  const experiences = doctor?.experiences;

  if (!Array.isArray(experiences) || experiences.length === 0) {
    return null;
  }

  const years = experiences
    .map((item) => Number(item?.yearsOfExperience))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (years.length === 0) {
    return null;
  }

  // Avoid double counting overlapping experiences.
  // This is the largest recorded duration, not
  // necessarily the doctor's total career duration.
  return `${Math.max(...years)}+ Years`;
};

// ==========================================
// RATING / REVIEWS (FUTURE SUPPORT)
// ==========================================

const getRating = (doctor) => {
  const raw = doctor?.averageRating ?? doctor?.rating;

  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const rating = Number(raw);

  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return null;
  }

  return rating.toFixed(1);
};

const getReviewCount = (doctor) => {
  const raw = doctor?.reviewCount ?? doctor?.totalReviews;

  if (raw === undefined || raw === null) {
    return null;
  }

  const count = Number(raw);

  return Number.isFinite(count) && count >= 0 ? count : null;
};

// ==========================================
// PATIENT COUNT
// ==========================================

const getPatientCount = (doctor) => {
  const raw = doctor?.patientCount ?? doctor?.totalPatients;

  if (raw === undefined || raw === null) {
    return null;
  }

  const count = Number(raw);

  return Number.isFinite(count) && count >= 0 ? count : null;
};

// ==========================================
// STAT ITEM
// ==========================================

function StatItem({ icon: Icon, value, label }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-[#f2f5fa] px-2 py-3 text-center">
      <div className="mb-1.5 flex min-w-0 items-center justify-center gap-1.5">
        <Icon className="shrink-0 text-base text-[#316dff]" />

        <span
          title={String(value)}
          className="min-w-0 truncate text-[11px] font-bold text-[#101a32] sm:text-xs"
        >
          {value}
        </span>
      </div>

      <span className="text-[10px] text-[#74839d] sm:text-xs">{label}</span>
    </div>
  );
}

// ==========================================
// DOCTOR CARD
// ==========================================

function DoctorCard({ doctor, onBook }) {
  const name = getDoctorName(doctor);
  const speciality = getSpeciality(doctor);
  const image = getDoctorImage(doctor);

  const available = getAvailability(doctor);

  const qualification = getQualification(doctor);
  const experience = getExperience(doctor);
  const patientCount = getPatientCount(doctor);

  const rating = getRating(doctor);
  const reviewCount = getReviewCount(doctor);

  // Doctor ID must be declared first.
  const doctorId = doctor?._id || doctor?.id;

  // Only explicitly available doctors can be booked.
  const isBookingDisabled = available !== true || !doctorId;

  const handleBookClick = () => {
    if (isBookingDisabled) {
      return;
    }

    onBook(doctor);
  };

  const bookingLabel =
    available === false
      ? "Currently Unavailable"
      : available === null
        ? "Booking Unavailable"
        : !doctorId
          ? "Booking Unavailable"
          : "Book Now";

  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden rounded-[25px] border-[5px] border-white bg-white p-0 shadow-[0_12px_35px_rgba(49,109,255,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(49,109,255,0.15)]">
      {/* ======================================
          DOCTOR IMAGE
      ====================================== */}

      <div className="relative h-[240px] overflow-hidden rounded-t-[19px] bg-slate-100 sm:h-[265px] lg:h-[285px]">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = doctorFallback;
          }}
        />

        {/* AVAILABILITY BADGE */}

        <div
          className={`absolute right-4 top-4 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm ${
            available === true
              ? "bg-green-50/95 text-green-700"
              : available === false
                ? "bg-red-50/95 text-red-600"
                : "bg-slate-100/95 text-slate-600"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              available === true
                ? "bg-green-600"
                : available === false
                  ? "bg-red-500"
                  : "bg-slate-400"
            }`}
          />

          {available === true
            ? "Available"
            : available === false
              ? "Unavailable"
              : "Status Unknown"}
        </div>
      </div>

      {/* ======================================
          DOCTOR DETAILS
      ====================================== */}

      <CardContent className="flex flex-1 flex-col px-4 pb-5 pt-5 sm:px-5">
        {/* NAME AND RATING */}

        <div className="flex min-h-[64px] items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              title={name}
              className="truncate text-lg font-bold text-[#101a32] sm:text-xl"
            >
              {name}
            </h3>

            <p className="mt-1 text-sm font-medium text-[#74839d]">
              {speciality}
            </p>
          </div>

          {/* Rating only if backend provides it */}

          {rating !== null && (
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <FaStar className="text-base text-amber-400" />

                <span className="text-base font-bold text-[#101a32]">
                  {rating}
                </span>
              </div>

              {reviewCount !== null && (
                <p className="mt-1 text-[11px] text-[#74839d]">
                  ({reviewCount} reviews)
                </p>
              )}
            </div>
          )}
        </div>

        {/* ======================================
            DOCTOR STATISTICS
        ====================================== */}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatItem
            icon={FaGraduationCap}
            value={qualification || "Not listed"}
            label="Qualification"
          />

          <StatItem
            icon={FaBriefcaseMedical}
            value={experience || "Not listed"}
            label="Experience"
          />

          <StatItem
            icon={FaUsers}
            value={
              patientCount !== null ? patientCount.toLocaleString() : "N/A"
            }
            label="Patients"
          />
        </div>

        {/* ======================================
            BOOK NOW BUTTON
        ====================================== */}

        <button
          type="button"
          disabled={isBookingDisabled}
          onClick={handleBookClick}
          aria-label={`${bookingLabel} - ${name}`}
          title={
            isBookingDisabled
              ? "Booking is not available for this doctor"
              : `Book an appointment with ${name}`
          }
          className={`mt-5 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
            isBookingDisabled
              ? "cursor-not-allowed bg-gray-300 text-gray-600 opacity-75 shadow-none"
              : "cursor-pointer bg-[#316dff] text-white shadow-[0_5px_15px_rgba(49,109,255,0.2)] hover:bg-[#2458db]"
          }`}
        >
          <FaCalendarDays className="text-base" />

          <span>{bookingLabel}</span>

          {!isBookingDisabled && <FaArrowRight className="text-sm" />}
        </button>
      </CardContent>
    </Card>
  );
}

// ==========================================
// FEATURED DOCTOR SLIDER
// ==========================================

export default function DoctorSlider() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ========================================
  // AUTOPLAY
  // ========================================

  const autoplay = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const [carouselApi, setCarouselApi] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // ========================================
  // REDUX STATE
  // ========================================

  const {
    doctors = [],
    loading,
    error,
  } = useSelector((state) => state.featuredDoctors);

  // ========================================
  // FETCH FEATURED DOCTORS
  // ========================================

  useEffect(() => {
    dispatch(fetchFeaturedDoctors());
  }, [dispatch]);

  // ========================================
  // CAROUSEL PAGINATION
  // ========================================

  useEffect(() => {
    if (!carouselApi) return;

    const updateCarousel = () => {
      setScrollSnaps(carouselApi.scrollSnapList());
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    updateCarousel();

    carouselApi.on("select", updateCarousel);
    carouselApi.on("reInit", updateCarousel);

    return () => {
      carouselApi.off("select", updateCarousel);
      carouselApi.off("reInit", updateCarousel);
    };
  }, [carouselApi]);

  // ========================================
  // BOOKING NAVIGATION
  // ========================================

  const handleBookNow = (doctor) => {
    const doctorId = doctor?._id || doctor?.id;

    // Extra protection before navigation.
    if (!doctorId || getAvailability(doctor) !== true) {
      return;
    }

    navigate(`/doctors/${doctorId}`);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <section
      className="relative overflow-hidden py-16 lg:py-20"
      style={{
        background:
          "linear-gradient(110deg, #dbe7ff 0%, #e6f5fa 52%, #d8f9e7 100%)",
      }}
    >
      <div className="mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-12">
        {/* ======================================
            SECTION HEADING
        ====================================== */}

        <div className="mb-12 flex flex-col items-center text-center">
          <div className="flex w-fit items-center gap-8 rounded-full bg-gradient-to-r from-[#316dff] via-[#258aff] to-[#16c6ba] px-8 py-2 text-sm font-semibold text-white">
            <span>•</span>
            Featured Doctors
            <span>•</span>
          </div>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#101a32] md:text-4xl lg:text-[42px]">
            Our <span className="text-[#316dff]">Highlighted Doctors</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm text-[#74839d] md:text-base">
            Meet our experienced and trusted specialists dedicated to your good
            health
          </p>
        </div>

        {/* ======================================
            LOADING SKELETON
        ====================================== */}

        {loading && doctors.length === 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[535px] animate-pulse rounded-[25px] bg-white/70"
              />
            ))}
          </div>
        )}

        {/* ======================================
            ERROR MESSAGE
        ====================================== */}

        {error && (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => dispatch(fetchFeaturedDoctors())}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ======================================
            EMPTY STATE
        ====================================== */}

        {!loading && !error && doctors.length === 0 && (
          <p className="py-12 text-center text-slate-600">
            No doctors available at the moment.
          </p>
        )}

        {/* ======================================
            DOCTOR CAROUSEL
        ====================================== */}

        {doctors.length > 0 && (
          <>
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: "start",
                loop: doctors.length > 3,
              }}
              plugins={[autoplay.current]}
              className="mx-auto w-full"
            >
              <CarouselContent className="-ml-5 pb-3">
                {doctors.map((doctor) => (
                  <CarouselItem
                    key={doctor._id || doctor.id}
                    className="basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
                  >
                    <DoctorCard doctor={doctor} onBook={handleBookNow} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* CAROUSEL NAVIGATION */}

              {doctors.length > 1 && (
                <>
                  <CarouselPrevious className="-left-5 hidden h-12 w-12 border-0 bg-white text-blue-600 shadow-md hover:bg-blue-600 hover:text-white md:flex" />

                  <CarouselNext className="-right-5 hidden h-12 w-12 border-0 bg-white text-blue-600 shadow-md hover:bg-blue-600 hover:text-white md:flex" />
                </>
              )}
            </Carousel>

            {/* ======================================
                PAGINATION DOTS
            ====================================== */}

            {scrollSnaps.length > 1 && (
              <div className="mt-7 flex items-center justify-center gap-3">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => carouselApi?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={selectedIndex === index ? "true" : undefined}
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      selectedIndex === index
                        ? "bg-[#316dff]"
                        : "bg-[#bfcee3] hover:bg-blue-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
