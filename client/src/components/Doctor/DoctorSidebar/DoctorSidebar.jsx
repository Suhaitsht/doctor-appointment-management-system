import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  FaCalendarCheck,
  FaChevronDown,
  FaClipboardList,
  FaClock,
  FaHouse,
  FaKey,
  FaStar,
  FaUserGear,
  FaUsers,
} from "react-icons/fa6";

import { MdLogout } from "react-icons/md";

import { logout, selectAuthUser } from "@/redux/slices/authSlice";

import {
  fetchMyDoctorProfile,
  updateDoctorAvailabilityStatus,
  selectMyDoctorProfile,
  selectMyDoctorProfileDoctor,
  selectMyDoctorProfileLoading,
  selectMyDoctorProfileError,
  selectDoctorIsAvailable,
  selectDoctorAvailabilityStatusUpdating,
  selectDoctorAvailabilityStatusError,
  resetMyDoctorProfile,
} from "@/redux/slices/doctorSlice";

// ======================================================
// SIDEBAR MENU ITEMS
// ======================================================

const menuItems = [
  {
    title: "Dashboard",
    path: "/doctor/dashboard",
    icon: <FaHouse />,
  },
  {
    title: "Requests",
    path: "/doctor/requests",
    icon: <FaClipboardList />,
  },
  {
    title: "Appointments",
    path: "/doctor/appointments",
    icon: <FaCalendarCheck />,
  },
  {
    title: "Available Timings",
    path: "/doctor/available-timings",
    icon: <FaClock />,
  },
  {
    title: "My Patients",
    path: "/doctor/patients",
    icon: <FaUsers />,
  },
  {
    title: "Reviews",
    path: "/doctor/reviews",
    icon: <FaStar />,
  },
  {
    title: "Profile Settings",
    path: "/doctor/profile-settings",
    icon: <FaUserGear />,
  },
  {
    title: "Change Password",
    path: "/doctor/change-password",
    icon: <FaKey />,
  },
];

// ======================================================
// HELPERS
// ======================================================

const getInitials = (name = "") => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "DR";
};

const getImageUrl = (image) => {
  if (!image) return "";

  const value =
    typeof image === "string" ? image : image?.url || image?.secure_url || "";

  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const backendUrl = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  return `${backendUrl.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
};

// ======================================================
// MAIN DOCTOR SIDEBAR
// ======================================================

export default function DoctorSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ====================================================
  // AUTHENTICATED USER
  // ====================================================

  const authUser = useSelector(selectAuthUser);

  // ====================================================
  // DOCTOR PROFILE FROM REDUX
  // ====================================================

  const doctor = useSelector(selectMyDoctorProfileDoctor);
  const profile = useSelector(selectMyDoctorProfile);

  const profileLoading = useSelector(selectMyDoctorProfileLoading);

  const profileError = useSelector(selectMyDoctorProfileError);

  // ====================================================
  // AVAILABLE / UNAVAILABLE STATUS
  // ====================================================

  const isAvailable = useSelector(selectDoctorIsAvailable);

  const statusUpdating = useSelector(selectDoctorAvailabilityStatusUpdating);

  const statusError = useSelector(selectDoctorAvailabilityStatusError);

  // ====================================================
  // FETCH DOCTOR PROFILE
  // ====================================================

  useEffect(() => {
    if (authUser?.role === "doctor") {
      dispatch(fetchMyDoctorProfile());
    }
  }, [dispatch, authUser?._id, authUser?.role]);

  // ====================================================
  // PROFILE DISPLAY DATA
  // ====================================================

  const userData =
    doctor?.user && typeof doctor.user === "object" ? doctor.user : authUser;

  const fullName =
    profile?.displayName?.trim() ||
    doctor?.displayName?.trim() ||
    [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") ||
    userData?.name ||
    "Doctor";

  const displayName = /^dr\.?\s/i.test(fullName) ? fullName : `Dr. ${fullName}`;

  const designation = profile?.designation || doctor?.designation || "";

  const speciality = profile?.speciality || doctor?.speciality || "";

  const subtitle =
    [designation, speciality].filter(Boolean).join(" · ") ||
    "Medical Professional";

  const profileImage = getImageUrl(
    userData?.image || profile?.image || doctor?.image,
  );

  // ====================================================
  // AVAILABILITY STATUS DISPLAY
  // ====================================================

  // Do not display "Unavailable" before the first
  // profile request finishes successfully.
  const statusReady = Boolean(
    doctor && typeof doctor.isAvailable === "boolean",
  );

  const statusLabel = !statusReady
    ? profileLoading
      ? "Loading..."
      : "Not loaded"
    : isAvailable
      ? "Available"
      : "Unavailable";

  // ====================================================
  // UPDATE DOCTOR AVAILABILITY
  // ====================================================

  const handleAvailabilityChange = async (event) => {
    if (!statusReady || statusUpdating) return;

    const nextStatus = event.target.value === "available";

    if (nextStatus === isAvailable) return;

    try {
      await dispatch(updateDoctorAvailabilityStatus(nextStatus)).unwrap();
    } catch (error) {
      // Redux stores the API error.
      // The previous value remains selected.
      console.error("Failed to update doctor availability:", error);
    }
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    dispatch(resetMyDoctorProfile());
    dispatch(logout());

    navigate("/login", {
      replace: true,
    });
  };

  // ====================================================
  // SIDEBAR UI
  // ====================================================

  return (
    <div className="mt-10 shrink-0">
      <aside className="w-full border-r border-slate-200 bg-white lg:w-[300px]">
        <div className="sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto px-4 py-5">
          {/* ======================================
              DOCTOR PROFILE CARD
          ====================================== */}

          <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 shrink-0 border-2 border-white/80">
                <AvatarImage
                  src={profileImage}
                  alt={displayName}
                  className="object-cover"
                />

                <AvatarFallback className="bg-blue-400 font-semibold text-white">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {displayName}
                </h3>

                <p className="mt-1 line-clamp-2 text-xs leading-5 text-blue-100">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================
              DOCTOR AVAILABILITY STATUS
          ====================================== */}

          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">
                Availability
              </span>

              <span
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  !statusReady
                    ? "text-slate-500"
                    : isAvailable
                      ? "text-emerald-600"
                      : "text-red-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    !statusReady
                      ? "bg-slate-400"
                      : isAvailable
                        ? "bg-emerald-500"
                        : "bg-red-500"
                  }`}
                />

                {statusLabel}
              </span>
            </div>

            <div className="relative">
              <select
                value={
                  !statusReady ? "" : isAvailable ? "available" : "unavailable"
                }
                onChange={handleAvailabilityChange}
                disabled={statusUpdating || profileLoading || !statusReady}
                aria-label="Doctor availability status"
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>
                  {profileLoading
                    ? "Loading availability..."
                    : "Select availability"}
                </option>

                <option value="available">I'm Available Now</option>

                <option value="unavailable">I'm Not Available</option>
              </select>

              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            </div>

            {/* Updating message */}

            {statusUpdating && (
              <p role="status" className="mt-2 text-xs text-blue-600">
                Updating availability...
              </p>
            )}

            {/* API error */}

            {statusError && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {statusError}
              </p>
            )}

            {/* Profile loading error */}

            {!statusReady && !profileLoading && profileError && (
              <div className="mt-2">
                <p role="alert" className="text-xs text-red-500">
                  {profileError}
                </p>

                <button
                  type="button"
                  onClick={() => dispatch(fetchMyDoctorProfile())}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* ======================================
              SIDEBAR NAVIGATION
          ====================================== */}

          <nav className="space-y-1" aria-label="Doctor navigation">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.path}
                end={item.path === "/doctor/dashboard"}
              >
                {({ isActive }) => (
                  <div
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-blue-600 font-medium text-white shadow-sm"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>

                    <span className="flex-1 text-left">{item.title}</span>

                    {item.notification && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-yellow-300" : "bg-yellow-400"
                        }`}
                      />
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ======================================
              LOGOUT BUTTON
          ====================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-500"
          >
            <MdLogout className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
