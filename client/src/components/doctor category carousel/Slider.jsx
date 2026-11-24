import React, { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { FaArrowUpRightFromSquare, FaUserDoctor } from "react-icons/fa6";

import { fetchHomeSpecialities } from "@/redux/slices/HomeSpecialitySlice";

// ==========================================
// BACKEND BASE URL
// ==========================================

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

// ==========================================
// CARD THEMES
// ==========================================

const cardThemes = [
  {
    iconBackground: "bg-blue-100",
    text: "text-blue-600",
    hover: "hover:border-blue-300",
  },
  {
    iconBackground: "bg-emerald-100",
    text: "text-emerald-600",
    hover: "hover:border-emerald-300",
  },
  {
    iconBackground: "bg-violet-100",
    text: "text-violet-600",
    hover: "hover:border-violet-300",
  },
  {
    iconBackground: "bg-amber-100",
    text: "text-amber-600",
    hover: "hover:border-amber-300",
  },
  {
    iconBackground: "bg-rose-100",
    text: "text-rose-600",
    hover: "hover:border-rose-300",
  },
  {
    iconBackground: "bg-cyan-100",
    text: "text-cyan-600",
    hover: "hover:border-cyan-300",
  },
];

// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (/^(https?:\/\/|data:|blob:)/i.test(image)) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// SPECIALITY ICON COMPONENT
// ==========================================

function SpecialityIcon({ image, name, theme }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${theme.iconBackground}`}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={`${name} icon`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-16 w-16 object-contain"
        />
      ) : (
        <FaUserDoctor className={`text-4xl ${theme.text}`} />
      )}
    </div>
  );
}

// ==========================================
// LOADING SKELETON
// ==========================================

function SliderSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-8 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
        >
          <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-100" />

          <div className="mx-auto mt-5 h-4 w-24 rounded bg-slate-100" />

          <div className="mx-auto mt-3 h-3 w-20 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MAIN SPECIALITY SLIDER
// ==========================================

export default function Slider() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ========================================
  // REDUX STATE
  // ========================================

  const {
    specialities = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.HomeSpecialityReducer);

  // ========================================
  // INITIAL REQUEST STATUS
  // ========================================

  const [hasRequested, setHasRequested] = useState(false);

  // ========================================
  // AUTOPLAY
  // ========================================

  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  // ========================================
  // FETCH PUBLIC SPECIALITIES
  // ========================================

  useEffect(() => {
    setHasRequested(true);

    const promise = dispatch(fetchHomeSpecialities());

    return () => {
      promise.abort();
    };
  }, [dispatch]);

  // ========================================
  // NAVIGATE TO DOCTORS
  // ========================================

  const handleSpecialityClick = (speciality) => {
    navigate(`/doctors?speciality=${encodeURIComponent(speciality.name)}`);
  };

  // ========================================
  // RETRY FETCH
  // ========================================

  const handleRetry = () => {
    dispatch(fetchHomeSpecialities());
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (!hasRequested || (loading && specialities.length === 0)) {
    return <SliderSkeleton />;
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error && specialities.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>

        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================

  if (specialities.length === 0) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-100 bg-slate-50 p-8 text-center">
        <FaUserDoctor className="mx-auto mb-3 text-3xl text-slate-400" />

        <p className="text-sm font-medium text-slate-600">
          No specialities available.
        </p>
      </div>
    );
  }

  // ========================================
  // MAIN CAROUSEL
  // ========================================

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-8">
      <Carousel
        opts={{
          align: "start",
          loop: specialities.length > 4,
          containScroll: "trimSnaps",
        }}
        plugins={specialities.length > 1 ? [autoplay.current] : []}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {specialities.map((item, index) => {
            const theme = cardThemes[index % cardThemes.length];

            return (
              <CarouselItem
                key={item._id || item.specialityId || item.name}
                className="basis-1/2 pl-4 sm:basis-1/3 lg:basis-1/4"
              >
                <button
                  type="button"
                  onClick={() => handleSpecialityClick(item)}
                  className={`group flex h-full w-full flex-col items-center rounded-2xl border border-slate-100 bg-white px-3 py-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${theme.hover}`}
                >
                  {/* SPECIALITY ICON */}
                  <SpecialityIcon
                    image={item.image}
                    name={item.name}
                    theme={theme}
                  />

                  {/* SPECIALITY NAME */}
                  <h3 className="mt-5 min-h-[48px] w-full break-words text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                    {item.name}
                  </h3>

                  {/* EXPLORE DOCTORS */}
                  <div
                    className={`mt-2 flex items-center gap-2 text-xs font-semibold ${theme.text}`}
                  >
                    <span>Explore Doctors</span>

                    <FaArrowUpRightFromSquare className="text-[10px] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* PREVIOUS / NEXT */}
        {specialities.length > 1 && (
          <>
            <CarouselPrevious className="hidden border-slate-200 bg-white shadow-sm hover:bg-blue-50 sm:flex" />

            <CarouselNext className="hidden border-slate-200 bg-white shadow-sm hover:bg-blue-50 sm:flex" />
          </>
        )}
      </Carousel>
    </div>
  );
}
