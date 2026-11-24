import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";

import {
  FaBone,
  FaBrain,
  FaHeartPulse,
  FaLungs,
  FaPerson,
  FaStethoscope,
  FaTooth,
  FaUserDoctor,
  FaVenusMars,
  FaHeart,
  FaChildReaching,
} from "react-icons/fa6";

import { IoSearchOutline } from "react-icons/io5";
import { MdOutlineFamilyRestroom } from "react-icons/md";
import { GiMedicalDrip } from "react-icons/gi";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import SpecialityTabs from "./Specialities/SpecialityTabs";
import SpecialityCard from "./Specialities/SpecialityCard";

import { fetchPublicSpecialities } from "@/redux/slices/specialitySlice";

// ==========================================
// SPECIALITY ICON MAPPING
// ==========================================

const specialityIcons = {
  orthopedics: FaBone,
  orthopaedics: FaBone,
  neurology: FaBrain,
  psychiatry: FaPerson,
  endocrinology: GiMedicalDrip,
  pulmonology: FaLungs,
  cardiology: FaHeartPulse,
  "adult endocrinology": FaStethoscope,
  "general medicine": FaUserDoctor,
  ent: FaStethoscope,
  fertility: FaVenusMars,
  "family medicine": MdOutlineFamilyRestroom,
  dentistry: FaTooth,
  pediatrics: FaChildReaching,
  paediatrics: FaChildReaching,
  "heart care": FaHeart,
};

// ==========================================
// API IMAGE URL
// ==========================================

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
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

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// NORMALIZE BACKEND SPECIALITY
// ==========================================

const normalizeSpeciality = (item, index) => {
  const name =
    item.name || item.specialityName || item.title || "Unnamed Speciality";

  const iconKey = name.toLowerCase().trim();

  const count =
    item.doctorCount ??
    item.doctorsCount ??
    item.totalDoctors ??
    (Array.isArray(item.doctors)
      ? item.doctors.length
      : typeof item.doctors === "number"
        ? item.doctors
        : null);

  return {
    ...item,

    id: item._id || item.id || index,

    name,

    doctors: count === null ? null : Number(count),

    icon: specialityIcons[iconKey] || FaStethoscope,

    image: getImageUrl(item.image || item.iconImage || ""),
  };
};

// ==========================================
// LOADING SKELETON
// ==========================================

function SpecialitySkeleton() {
  return (
    <div className="flex h-[84px] animate-pulse items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-50" />

      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-2.5 w-20 rounded bg-slate-100" />
      </div>

      <div className="h-3 w-3 rounded bg-slate-100" />
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function SpecialitiesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ========================================
  // REDUX STATE
  // ========================================

  const { publicSpecialities, loading, error } = useSelector(
    (state) => state.specialities,
  );

  // ========================================
  // LOCAL STATES
  // ========================================

  const [activeTab, setActiveTab] = useState("specialities");

  const [search, setSearch] = useState("");

  const [visibleCount, setVisibleCount] = useState(12);

  const [hasRequested, setHasRequested] = useState(false);

  // ========================================
  // FETCH PUBLIC SPECIALITIES
  // ========================================

  useEffect(() => {
    const request = dispatch(fetchPublicSpecialities());

    setHasRequested(true);

    return () => {
      request.abort();
    };
  }, [dispatch]);

  // ========================================
  // NORMALIZE API DATA
  // ========================================

  const specialitiesData = useMemo(() => {
    const list = Array.isArray(publicSpecialities) ? publicSpecialities : [];

    return list
      .filter((item) => item.isActive !== false)
      .map(normalizeSpeciality);
  }, [publicSpecialities]);

  // ========================================
  // SEARCH FILTER
  // ========================================

  const filteredSpecialities = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return specialitiesData;
    }

    return specialitiesData.filter((speciality) =>
      speciality.name.toLowerCase().includes(value),
    );
  }, [specialitiesData, search]);

  // ========================================
  // VISIBLE ITEMS
  // ========================================

  const visibleSpecialities = useMemo(() => {
    return filteredSpecialities.slice(0, visibleCount);
  }, [filteredSpecialities, visibleCount]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setVisibleCount(12);
  };

  const handleLoadMore = () => {
    setVisibleCount((previous) => previous + 6);
  };

  const handleRetry = () => {
    dispatch(fetchPublicSpecialities());
  };

  const handleSpecialityClick = (speciality) => {
    navigate(`/doctors?speciality=${encodeURIComponent(speciality.name)}`);
  };

  // ========================================
  // LOADING STATE
  // ========================================

  const showSkeleton =
    !hasRequested || (loading && specialitiesData.length === 0);

  // ========================================
  // UI
  // ========================================

  return (
    <div className="mt-20 min-h-screen bg-white">
      {/* =====================================
          PAGE HERO
      ===================================== */}

      <section className="relative overflow-hidden border-b border-slate-100 bg-[#f8fbff] py-12">
        {/* LEFT DECORATION */}

        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-blue-100/60" />

        {/* RIGHT DECORATION */}

        <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-blue-100/60" />

        <div className="relative mx-auto max-w-[1200px] px-4 text-center">
          {/* BREADCRUMB */}

          <div className="mb-3 flex justify-center gap-2 text-xs text-slate-500">
            <span className="text-blue-600">●</span>

            <span>Specialities</span>
          </div>

          {/* TITLE */}

          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Specialities
          </h1>
        </div>
      </section>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <section className="mx-auto max-w-[1100px] px-4 py-10 md:px-6">
        {/* TABS */}

        <SpecialityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* ===================================
            SPECIALITIES TAB
        =================================== */}

        {activeTab === "specialities" && (
          <>
            {/* SEARCH HEADER */}

            <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Showing{" "}
                <span className="text-blue-600">
                  {filteredSpecialities.length}
                </span>{" "}
                Specialities For You
              </h2>

              <div className="relative w-full sm:w-[260px]">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search Specialities"
                  className="pl-9"
                />
              </div>
            </div>

            {/* API ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />

                  <span>{error}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}

            {/* LOADING SKELETON */}

            {showSkeleton && !error && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SpecialitySkeleton key={index} />
                ))}
              </div>
            )}

            {/* SPECIALITIES GRID */}

            {!showSkeleton && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleSpecialities.length > 0
                  ? visibleSpecialities.map((speciality) => (
                      <SpecialityCard
                        key={speciality.id}
                        speciality={speciality}
                        onClick={() => handleSpecialityClick(speciality)}
                      />
                    ))
                  : !error && (
                      <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-16 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          No specialities found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try another search term.
                        </p>
                      </div>
                    )}
              </div>
            )}

            {/* LOAD MORE */}

            {!showSkeleton && visibleCount < filteredSpecialities.length && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-full bg-blue-600 px-7 text-white hover:bg-blue-700"
                >
                  Load More Specialities
                </Button>
              </div>
            )}
          </>
        )}

        {/* ===================================
            HOSPITALS TAB
        =================================== */}

        {activeTab === "hospitals" && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-sm text-slate-500">
              Hospital section can be added here.
            </p>
          </div>
        )}

        {/* ===================================
            CLINICS TAB
        =================================== */}

        {activeTab === "clinics" && (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-sm text-slate-500">
              Clinic section can be added here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
