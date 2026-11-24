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

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { logout } from "@/redux/slices/authSlice";

export default function PatientProfileDropdown() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  // ==========================================
  // GET LOGGED-IN USER FROM REDUX
  // ==========================================

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    dispatch(logout());

    navigate("/", {
      replace: true,
    });
  };

  // ==========================================
  // IF USER NOT LOGGED IN
  // ==========================================

  if (!isAuthenticated || !user) {
    return null;
  }

  // ==========================================
  // GET USER INITIALS
  // ==========================================

  const getInitials = () => {
    if (!user?.name) {
      return "PT";
    }

    return user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.image || ""}
              alt={user?.name || "Patient"}
            />

            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>

          <IoIosArrowDown className="text-gray-600" />
        </button>
      </DropdownMenuTrigger>

      {/* ===================================== */}
      {/* DROPDOWN */}
      {/* ===================================== */}

      <DropdownMenuContent align="end" className="w-[230px]">
        {/* USER INFORMATION */}

        <div className="px-3 py-3">
          <p className="font-semibold text-gray-900">{user?.name}</p>

          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* DASHBOARD */}

        <DropdownMenuItem
          onClick={() => navigate("/patient/dashboard")}
          className="cursor-pointer"
        >
          Dashboard
        </DropdownMenuItem>

        {/* PROFILE SETTINGS */}

        <DropdownMenuItem
          onClick={() => navigate("/patient/settings")}
          className="cursor-pointer"
        >
          Profile Settings
        </DropdownMenuItem>

        {/* APPOINTMENTS */}

        <DropdownMenuItem
          onClick={() => navigate("/patient/appointments")}
          className="cursor-pointer"
        >
          My Appointments
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* LOGOUT */}

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-500 focus:text-red-500"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
