import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { IoIosArrowDown } from "react-icons/io";

import { FaUserDoctor } from "react-icons/fa6";

import { IoLogOutOutline, IoSettingsOutline } from "react-icons/io5";

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { logout } from "@/redux/slices/authSlice";

export default function DoctorProfileDropdown() {
  // ==========================================
  // REACT ROUTER
  // ==========================================

  const navigate = useNavigate();

  // ==========================================
  // REDUX
  // ==========================================

  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    // Redux state reset
    // localStorage user/token also removed
    dispatch(logout());

    // Go to home page
    navigate("/", {
      replace: true,
    });
  };

  // ==========================================
  // USER NOT LOGGED IN
  // ==========================================

  if (!isAuthenticated || !user) {
    return null;
  }

  // ==========================================
  // DOCTOR NAME INITIALS
  // ==========================================

  const getInitials = () => {
    if (!user?.name) {
      return "DR";
    }

    const initials = user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "DR";
  };

  return (
    <DropdownMenu>
      {/* ===================================== */}
      {/* PROFILE BUTTON */}
      {/* ===================================== */}

      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full outline-none"
        >
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user?.image || ""} alt={user?.name || "Doctor"} />

            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>

          <IoIosArrowDown className="text-sm text-slate-500" />
        </button>
      </DropdownMenuTrigger>

      {/* ===================================== */}
      {/* DROPDOWN CONTENT */}
      {/* ===================================== */}

      <DropdownMenuContent align="end" className="w-[230px] p-2">
        {/* =================================== */}
        {/* DOCTOR INFO */}
        {/* =================================== */}

        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image || ""} alt={user?.name || "Doctor"} />

            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name}
            </p>

            <p className="text-xs font-medium capitalize text-green-500">
              {user?.role}
            </p>
          </div>
        </div>

        {/* =================================== */}
        {/* DASHBOARD */}
        {/* =================================== */}

        <DropdownMenuItem
          onClick={() => navigate("/doctor/dashboard")}
          className="mt-1 cursor-pointer py-2.5"
        >
          <FaUserDoctor className="mr-2" />
          Dashboard
        </DropdownMenuItem>

        {/* =================================== */}
        {/* PROFILE SETTINGS */}
        {/* =================================== */}

        <DropdownMenuItem
          onClick={() => navigate("/doctor/profile-settings")}
          className="cursor-pointer py-2.5"
        >
          <IoSettingsOutline className="mr-2" />
          Profile Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* =================================== */}
        {/* LOGOUT */}
        {/* =================================== */}

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer py-2.5 text-red-500 focus:text-red-600"
        >
          <IoLogOutOutline className="mr-2 text-lg" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
