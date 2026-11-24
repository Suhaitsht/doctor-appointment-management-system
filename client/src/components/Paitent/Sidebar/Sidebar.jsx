import React from "react";

import { NavLink, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import {
  FaCalendarDays,
  FaFileMedical,
  FaFileInvoiceDollar,
  FaGear,
} from "react-icons/fa6";

import { MdDashboard } from "react-icons/md";

import { IoLogOutOutline } from "react-icons/io5";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { logout, selectAuthUser } from "@/redux/slices/authSlice";

// ======================================================
// MENU ITEMS
// ======================================================

const menuItems = [
  {
    name: "Dashboard",
    path: "/patient/dashboard",
    icon: MdDashboard,
  },

  {
    name: "My Appointments",
    path: "/patient/appointments",
    icon: FaCalendarDays,
  },

  {
    name: "Medical Records",
    path: "/patient/medical-records",
    icon: FaFileMedical,
  },

  {
    name: "Invoices",
    path: "/patient/invoices",
    icon: FaFileInvoiceDollar,
  },

  {
    name: "Settings",
    path: "/patient/settings",
    icon: FaGear,
  },
];

// ======================================================
// BACKEND URL
// ======================================================

const BACKEND_URL = "http://localhost:5000";

// ======================================================
// GET FULL NAME
// ======================================================

const getFullName = (user) => {
  if (!user) {
    return "Patient";
  }

  const firstName = user.firstName?.trim() || "";

  const lastName = user.lastName?.trim() || "";

  const fullName = `${firstName} ${lastName}`.trim();

  // Prefer firstName + lastName.
  // Fall back to old name field.

  return fullName || user.name || "Patient";
};

// ======================================================
// GET INITIALS
// ======================================================

const getInitials = (user) => {
  const name = getFullName(user);

  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return `${words[0].charAt(0)}${words[words.length - 1].charAt(
    0,
  )}`.toUpperCase();
};

// ======================================================
// GET PROFILE IMAGE URL
// ======================================================

const getProfileImage = (image) => {
  if (!image) {
    return "";
  }

  // External image or data/blob image.

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  // Backend may return:
  // /uploads/profiles/abc.jpg

  if (image.startsWith("/")) {
    return `${BACKEND_URL}${image}`;
  }

  // Backend may return:
  // uploads/profiles/abc.jpg

  return `${BACKEND_URL}/${image}`;
};

// ======================================================
// CALCULATE AGE
// ======================================================

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return "Age N/A";
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return "Age N/A";
  }

  const today = new Date();

  // Future DOB protection.

  if (birthDate > today) {
    return "Age N/A";
  }

  let years = today.getFullYear() - birthDate.getFullYear();

  let months = today.getMonth() - birthDate.getMonth();

  // If current day is before birthday day,
  // one complete month has not passed yet.

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return "Age N/A";
  }

  if (years === 0) {
    return `${months} ${months === 1 ? "Month" : "Months"}`;
  }

  return `${years} ${years === 1 ? "Year" : "Years"} ${String(months).padStart(
    2,
    "0",
  )} ${months === 1 ? "Month" : "Months"}`;
};

// ======================================================
// FORMAT PATIENT ID
// ======================================================

const getPatientId = (user) => {
  if (!user) {
    return "N/A";
  }

  // If backend later gives a custom patientId,
  // use it first.

  if (user.patientId) {
    return user.patientId;
  }

  // Otherwise use MongoDB user _id
  // to create a short display ID.

  if (user._id) {
    const shortId = user._id.toString().slice(-6).toUpperCase();

    return `PT${shortId}`;
  }

  return "N/A";
};

// ======================================================
// FORMAT GENDER
// ======================================================

const getGender = (user) => {
  if (!user?.gender) {
    return "Gender N/A";
  }

  const gender = user.gender.toString();

  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};

// ======================================================
// PATIENT SIDEBAR
// ======================================================

export default function PatientSidebar() {
  // ====================================================
  // ROUTER + REDUX
  // ====================================================

  const navigate = useNavigate();

  const dispatch = useDispatch();

  // ====================================================
  // LOGGED-IN USER
  // ====================================================

  const user = useSelector(selectAuthUser);

  // Same as:
  //
  // const user = useSelector(
  //   (state) => state.auth.user
  // );

  // ====================================================
  // PATIENT INFORMATION
  // ====================================================

  const patientName = getFullName(user);

  const patientId = getPatientId(user);

  const patientGender = getGender(user);

  const patientAge = calculateAge(user?.dateOfBirth);

  const patientImage = getProfileImage(user?.image);

  const patientInitials = getInitials(user);

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    // Redux logout will remove:
    //
    // localStorage user
    // localStorage token
    //
    // Redux:
    // user = null
    // token = null
    // isAuthenticated = false

    dispatch(logout());

    // Send user back to login page.

    navigate("/login", {
      replace: true,
    });
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:w-[280px]">
      {/* =================================================
          COVER
      ================================================== */}

      <div className="relative h-[125px] overflow-hidden bg-[#101a35]">
        <div className="absolute left-5 top-5 h-14 w-14 rounded-full border border-white/10" />

        <div className="absolute right-6 top-8 h-20 w-20 rounded-full border border-white/10" />

        <div className="absolute bottom-4 left-12 h-8 w-8 rounded-full border border-white/10" />
      </div>

      {/* =================================================
          PATIENT PROFILE
      ================================================== */}

      <div className="-mt-12 flex flex-col items-center px-5 pb-6">
        {/* PROFILE IMAGE */}

        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage
              src={patientImage}
              alt={patientName}
              className="object-cover"
            />

            <AvatarFallback className="bg-blue-50 font-semibold text-blue-600">
              {patientInitials}
            </AvatarFallback>
          </Avatar>

          {/* ONLINE STATUS */}

          <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white bg-green-500" />
        </div>

        {/* PATIENT NAME */}

        <h2 className="mt-3 text-center text-base font-semibold text-slate-900">
          {patientName}
        </h2>

        {/* PATIENT ID */}

        <p className="mt-1 text-[11px] text-slate-400">
          Patient ID : {patientId}
        </p>

        {/* GENDER + AGE */}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
          <span>{patientGender}</span>

          <span className="h-1 w-1 rounded-full bg-slate-400" />

          <span>{patientAge}</span>
        </div>

        {/* ROLE */}

        <Badge
          variant="secondary"
          className="mt-3 bg-blue-50 capitalize text-blue-600"
        >
          {user?.role || "Patient"}
        </Badge>
      </div>

      {/* =================================================
          MENU
      ================================================== */}

      <nav className="border-t border-slate-100 p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                <Icon className="mr-3 text-base" />

                <span className="flex-1">{item.name}</span>
              </NavLink>
            );
          })}

          {/* =============================================
              LOGOUT
          ============================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-500"
          >
            <IoLogOutOutline className="mr-3 text-lg" />

            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
