import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchPublicDoctors,
  fetchPublicDoctorRatings,
  selectPublicDoctorRatings,
} from "@/redux/slices/doctorSlice";

import Breadcrumb from "../assets/breadcrumb-bg-01.png";

import {
  LuHospital,
  LuMapPin,
  LuSearch,
  LuSlidersHorizontal,
  LuStethoscope,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuStar,
} from "react-icons/lu";

import { FaLanguage, FaUserDoctor, FaStar } from "react-icons/fa6";
import { MdOutlineUpdate, MdOutlineLocalHospital } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";

// ======================================================
// CONFIGURATION
// ======================================================

const DOCTORS_PER_PAGE = 6;

const DEFAULT_DOCTOR_IMAGE = "https://placehold.co/600x700?text=Doctor";

const API_BASE_URL = (
  import.meta.env.VITE_API_ORIGIN ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

// ======================================================
// HELPERS
// ======================================================

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

function getDoctorName(doctor) {
  const user = doctor?.user;

  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const name =
    doctor?.displayName?.trim() ||
    user?.name ||
    fullName ||
    doctor?.name ||
    "Doctor";

  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function getDoctorImage(doctor) {
  const image = doctor?.user?.image || doctor?.image || doctor?.profileImage;

  const value =
    typeof image === "string" ? image : image?.url || image?.secure_url || "";

  if (!value) return DEFAULT_DOCTOR_IMAGE;

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  const path = value.replace(/\\/g, "/").replace(/^\/+/, "");

  return `${API_BASE_URL}/${path}`;
}

function getDoctorLocation(doctor) {
  return (
    doctor?.user?.location || doctor?.location || "Jayanthi Medical Centre"
  );
}

function getDoctorLanguages(doctor) {
  const languages = doctor?.user?.languages || doctor?.languages;

  if (Array.isArray(languages) && languages.length) {
    return languages.join(", ");
  }

  return "Not specified";
}

function getExperienceYears(doctor) {
  if (doctor?.experience != null) {
    return Number(doctor.experience) || 0;
  }

  if (!Array.isArray(doctor?.experiences)) {
    return 0;
  }

  return doctor.experiences.reduce(
    (total, item) => total + Number(item?.yearsOfExperience || 0),
    0,
  );
}

function getQualification(doctor) {
  if (doctor?.qualification) {
    return doctor.qualification;
  }

  if (Array.isArray(doctor?.education) && doctor.education.length) {
    return (
      doctor.education
        .map((item) => item?.course)
        .filter(Boolean)
        .join(", ") || "Medical Specialist"
    );
  }

  return doctor?.speciality || "Medical Specialist";
}

function isDoctorAvailable(doctor) {
  return doctor?.isAvailable === true;
}

// ======================================================
// FILTER SELECT
// ======================================================

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>

      <IoIosArrowDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ======================================================
// AVAILABILITY BADGE
// ======================================================

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

// ======================================================
// DYNAMIC RATING COMPONENT
// ======================================================

function DoctorRating({ averageRating = 0, totalReviews = 0 }) {
  const rating = Math.max(0, Math.min(5, Number(averageRating) || 0));
  const count = Number(totalReviews) || 0;

  if (count === 0) {
    return (
      <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
        <LuStar className="text-amber-400" />
        <span>Not yet rated</span>
        <span>(0 Reviews)</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="relative inline-block">
            <LuStar className="text-lg text-slate-300" />

            <span
              className="absolute inset-0 overflow-hidden"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (rating - star + 1) * 100),
                )}%`,
              }}
            >
              <FaStar className="text-lg text-amber-400" />
            </span>
          </span>
        ))}
      </div>

      <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>

      <span className="text-sm text-slate-500">
        ({count} {count === 1 ? "Review" : "Reviews"})
      </span>
    </div>
  );
}

// ======================================================
// DOCTOR CARD
// ======================================================

function DoctorCard({ doctor, ratings }) {
  const doctorId = doctor?._id || doctor?.id;

  const name = getDoctorName(doctor);
  const image = getDoctorImage(doctor);
  const qualification = getQualification(doctor);
  const experience = getExperienceYears(doctor);
  const available = isDoctorAvailable(doctor);

  const speciality = doctor?.speciality || "Specialist";
  const hospital = doctor?.hospital || "Jayanthi Medical Centre";

  const location = getDoctorLocation(doctor);
  const languages = getDoctorLanguages(doctor);
  const consultationFee = Number(doctor?.consultationFee) || 0;

  const ratingData = ratings?.[String(doctorId)] || {
    averageRating: 0,
    totalReviews: 0,
  };

  const profileUrl = `/doctors/${doctorId}`;
  const bookingUrl = `/doctors/${doctorId}/booking`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr]">
        {/* DOCTOR IMAGE */}
        <Link
          to={profileUrl}
          className="relative block min-h-[280px] overflow-hidden bg-slate-100 md:min-h-full"
        >
          <img
            src={image}
            alt={name}
            onError={(event) => {
              if (event.currentTarget.src !== DEFAULT_DOCTOR_IMAGE) {
                event.currentTarget.src = DEFAULT_DOCTOR_IMAGE;
              }
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute left-4 top-4 md:hidden">
            <AvailabilityBadge available={available} />
          </div>
        </Link>

        {/* INFORMATION */}
        <div className="flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              <LuStethoscope />
              {speciality}
            </span>

            <div className="hidden md:block">
              <AvailabilityBadge available={available} />
            </div>
          </div>

          {/* NAME */}
          <Link to={profileUrl}>
            <h2 className="text-xl font-bold text-slate-900 transition hover:text-blue-600 sm:text-2xl">
              {name}
            </h2>
          </Link>

          {/* QUALIFICATION */}
          <p className="mt-2 text-sm text-slate-500">{qualification}</p>

          {/* DYNAMIC RATING */}
          <DoctorRating
            averageRating={ratingData.averageRating}
            totalReviews={ratingData.totalReviews}
          />

          {/* DETAILS */}
          <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <MdOutlineLocalHospital className="shrink-0 text-lg text-blue-500" />
              <span>{hospital}</span>
            </p>

            <p className="flex items-center gap-2">
              <LuMapPin className="shrink-0 text-lg text-blue-500" />
              <span>{location}</span>
            </p>

            <p className="flex items-center gap-2">
              <FaLanguage className="shrink-0 text-lg text-blue-500" />
              <span>{languages}</span>
            </p>

            <p className="flex items-center gap-2">
              <MdOutlineUpdate className="shrink-0 text-lg text-blue-500" />
              <span>
                {experience > 0
                  ? `${experience} Years Experience`
                  : "Experience information unavailable"}
              </span>
            </p>
          </div>

          {/* FEE + BUTTONS */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">Consultation Fee</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                LKR {consultationFee.toLocaleString()}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link
                to={profileUrl}
                className="flex h-11 items-center justify-center rounded-xl border border-blue-600 px-5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                View Profile
              </Link>

              {available ? (
                <Link
                  to={bookingUrl}
                  className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Book Appointment
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="This doctor is currently unavailable"
                  className="flex h-11 cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-6 text-sm font-semibold text-slate-500"
                >
                  Currently Unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ======================================================
// LOADING SKELETON
// ======================================================

function LoadingDoctors() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="grid animate-pulse grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[230px_1fr]"
        >
          <div className="min-h-[280px] bg-slate-200" />

          <div className="p-6">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="mt-5 h-7 w-52 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-32 rounded bg-slate-200" />

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((value) => (
                <div key={value} className="h-4 rounded bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ======================================================
// PAGINATION
// ======================================================

function DoctorPagination({
  currentPage,
  totalPages,
  totalDoctors,
  startIndex,
  endIndex,
  onPageChange,
}) {
  if (totalDoctors === 0) return null;

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return (
    <nav
      aria-label="Doctor list pagination"
      className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:flex-row"
    >
      <p className="text-center text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-900">{startIndex + 1}</span>
        {" - "}
        <span className="font-semibold text-slate-900">{endIndex}</span>
        {" of "}
        <span className="font-semibold text-blue-600">{totalDoctors}</span>{" "}
        doctors
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-10 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"
          >
            <LuChevronLeft />
            Previous
          </button>

          {visiblePages.map((page, index) => (
            <React.Fragment key={page}>
              {index > 0 && page - visiblePages[index - 1] > 1 && (
                <span className="px-1 text-slate-400">...</span>
              )}

              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={`flex h-10 min-w-10 items-center justify-center rounded-lg border text-sm font-semibold ${
                  currentPage === page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-500"
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-10 items-center gap-1 rounded-lg border px-3 text-sm disabled:opacity-40"
          >
            Next
            <LuChevronRight />
          </button>
        </div>
      )}
    </nav>
  );
}

// ======================================================
// MAIN DOCTOR LIST
// ======================================================

export default function DoctorList() {
  const dispatch = useDispatch();
  const resultsRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const speciality = searchParams.get("speciality") || "";

  // REDUX
  const {
    publicDoctors = [],
    publicDoctorsLoading = false,
    publicDoctorsError = null,
    publicDoctorRatingsLoading = false,
    publicDoctorRatingsError = null,
  } = useSelector((state) => state.doctors || {});

  const doctorRatings = useSelector(selectPublicDoctorRatings);

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH DOCTORS + RATINGS
  useEffect(() => {
    dispatch(fetchPublicDoctors());
    dispatch(fetchPublicDoctorRatings());
  }, [dispatch]);

  // SPECIALITY URL
  const updateSpeciality = (value) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);

        if (value) {
          next.set("speciality", value);
        } else {
          next.delete("speciality");
        }

        return next;
      },
      { replace: true },
    );
  };

  // AVAILABLE SPECIALITIES
  const specialities = useMemo(() => {
    const values = publicDoctors
      .map((doctor) => doctor?.speciality)
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [publicDoctors]);

  // FILTER + SORT
  const filteredDoctors = useMemo(() => {
    let doctors = [...publicDoctors];

    const searchValue = normalizeText(search);
    const selectedSpeciality = normalizeText(speciality);

    if (searchValue) {
      doctors = doctors.filter((doctor) => {
        const name = normalizeText(getDoctorName(doctor));
        const spec = normalizeText(doctor?.speciality);
        const hospital = normalizeText(doctor?.hospital);

        return (
          name.includes(searchValue) ||
          spec.includes(searchValue) ||
          hospital.includes(searchValue)
        );
      });
    }

    if (selectedSpeciality) {
      doctors = doctors.filter(
        (doctor) => normalizeText(doctor?.speciality) === selectedSpeciality,
      );
    }

    if (availability === "available") {
      doctors = doctors.filter(isDoctorAvailable);
    }

    if (availability === "unavailable") {
      doctors = doctors.filter((doctor) => !isDoctorAvailable(doctor));
    }

    if (sort === "fee-low") {
      doctors.sort(
        (a, b) =>
          Number(a?.consultationFee || 0) - Number(b?.consultationFee || 0),
      );
    }

    if (sort === "fee-high") {
      doctors.sort(
        (a, b) =>
          Number(b?.consultationFee || 0) - Number(a?.consultationFee || 0),
      );
    }

    if (sort === "experience") {
      doctors.sort((a, b) => getExperienceYears(b) - getExperienceYears(a));
    }

    if (sort === "rating") {
      doctors.sort((a, b) => {
        const aRating =
          doctorRatings[String(a?._id || a?.id)]?.averageRating || 0;

        const bRating =
          doctorRatings[String(b?._id || b?.id)]?.averageRating || 0;

        return bRating - aRating;
      });
    }

    if (sort === "reviews") {
      doctors.sort((a, b) => {
        const aCount =
          doctorRatings[String(a?._id || a?.id)]?.totalReviews || 0;

        const bCount =
          doctorRatings[String(b?._id || b?.id)]?.totalReviews || 0;

        return bCount - aCount;
      });
    }

    return doctors;
  }, [publicDoctors, doctorRatings, search, speciality, availability, sort]);

  // PAGINATION CALCULATIONS
  const totalDoctors = filteredDoctors.length;

  const totalPages = Math.max(1, Math.ceil(totalDoctors / DOCTORS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * DOCTORS_PER_PAGE;

  const endIndex = Math.min(startIndex + DOCTORS_PER_PAGE, totalDoctors);

  const paginatedDoctors = useMemo(
    () => filteredDoctors.slice(startIndex, startIndex + DOCTORS_PER_PAGE),
    [filteredDoctors, startIndex],
  );

  // RESET PAGE
  useEffect(() => {
    setCurrentPage(1);
  }, [search, speciality, availability, sort]);

  // PAGE CHANGE
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearch("");
    setAvailability("");
    setSort("");
    setCurrentPage(1);
    updateSpeciality("");
  };

  // REFRESH
  const refreshDoctors = () => {
    dispatch(fetchPublicDoctors());
    dispatch(fetchPublicDoctorRatings());
  };

  return (
    <>
      {/* HERO SECTION */}
      <section
        className="relative overflow-hidden bg-cover bg-center py-14 sm:py-16 lg:py-20"
        style={{ backgroundImage: `url(${Breadcrumb})` }}
      >
        <div className="absolute inset-0 bg-white/25" />

        <div className="container-custom relative z-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <Link to="/" className="hover:text-blue-600">
                Home
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-800">Doctors</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Find Your Doctor
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Search and book an appointment with the right specialist for your
              healthcare needs.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 rounded-2xl border border-white/70 bg-white p-3 shadow-lg sm:flex-row">
              <div className="relative flex-1">
                <LuHospital className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search doctor, speciality or hospital"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  resultsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-semibold text-white hover:bg-blue-700"
              >
                <LuSearch />
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="bg-slate-50 py-10 sm:py-12 lg:py-14">
        <div className="container-custom">
          {/* RESULTS HEADER */}
          <div
            ref={resultsRef}
            className="mb-6 scroll-mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-blue-600">
                Our Specialists
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Doctors For You
              </h2>

              {!publicDoctorsLoading && !publicDoctorsError && (
                <p className="mt-2 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-blue-600">
                    {totalDoctors}
                  </span>{" "}
                  doctor{totalDoctors !== 1 ? "s" : ""}
                </p>
              )}

              {speciality && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <LuStethoscope />
                  {speciality}

                  <button
                    type="button"
                    onClick={() => updateSpeciality("")}
                    aria-label="Remove speciality filter"
                    className="ml-1 rounded-full px-1 hover:bg-blue-200"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <LuSlidersHorizontal />
              Filter doctors
            </div>
          </div>

          {/* FILTERS */}
          <div className="mb-8 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect
              value={speciality}
              onChange={(event) => updateSpeciality(event.target.value)}
            >
              <option value="">All Specialities</option>

              {speciality &&
                !specialities.some(
                  (item) => normalizeText(item) === normalizeText(speciality),
                ) && <option value={speciality}>{speciality}</option>}

              {specialities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </FilterSelect>

            <FilterSelect
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="">Sort By</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="fee-low">Fee: Low to High</option>
              <option value="fee-high">Fee: High to Low</option>
              <option value="experience">Most Experienced</option>
            </FilterSelect>
          </div>

          {/* RATINGS ERROR */}
          {!publicDoctorRatingsLoading && publicDoctorRatingsError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              Doctor ratings could not be loaded: {publicDoctorRatingsError}
              <button
                type="button"
                onClick={() => dispatch(fetchPublicDoctorRatings())}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}
          {publicDoctorsLoading && <LoadingDoctors />}

          {/* ERROR */}
          {!publicDoctorsLoading && publicDoctorsError && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Unable to load doctors
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {publicDoctorsError}
              </p>

              <button
                type="button"
                onClick={refreshDoctors}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <LuRefreshCw />
                Try Again
              </button>
            </div>
          )}

          {/* DOCTOR LIST */}
          {!publicDoctorsLoading &&
            !publicDoctorsError &&
            paginatedDoctors.length > 0 && (
              <div className="space-y-5">
                {paginatedDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor?._id || doctor?.id}
                    doctor={doctor}
                    ratings={doctorRatings}
                  />
                ))}
              </div>
            )}

          {/* EMPTY STATE */}
          {!publicDoctorsLoading &&
            !publicDoctorsError &&
            totalDoctors === 0 && (
              <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
                  <FaUserDoctor />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  No doctors found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try changing your search keyword or selected filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Clear Filters
                </button>
              </div>
            )}

          {/* PAGINATION */}
          {!publicDoctorsLoading && !publicDoctorsError && (
            <DoctorPagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalDoctors={totalDoctors}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </main>
    </>
  );
}
