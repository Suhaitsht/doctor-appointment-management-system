import React from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  FaBell,
  FaMagnifyingGlass,
  FaUser,
  FaGear,
  FaRightFromBracket,
  FaChevronDown,
} from "react-icons/fa6";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import AdminNotificationBell from "@/components/admin/AdminNotificationBell";

import { logout, selectAuthUser } from "@/redux/slices/authSlice";

// ==========================================
// API URL
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

// ==========================================
// IMAGE URL
// ==========================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// ADMIN HEADER
// ==========================================

export default function AdminHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get logged-in user from Redux
  const admin = useSelector(selectAuthUser);

  // ========================================
  // ADMIN INFORMATION
  // ========================================

  const fullName = [admin?.firstName, admin?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const adminName = admin?.name || fullName || "Admin";

  const adminEmail = admin?.email || "";

  const adminImage = getImageUrl(admin?.image);

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    dispatch(logout());

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

          <Input
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="h-9 w-[220px] pl-9"
          />
        </div>

        <h2 className="text-sm font-semibold text-slate-800 md:hidden">
          Admin Panel
        </h2>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* NOTIFICATIONS */}
        <AdminNotificationBell />

        {/* ADMIN DROPDOWN */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1 outline-none transition hover:bg-slate-50">
            <Avatar className="h-9 w-9">
              <AvatarImage src={adminImage} alt={adminName} />

              <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                {initials || "AD"}
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left sm:block">
              <p className="max-w-[150px] truncate text-xs font-semibold text-slate-800">
                {adminName}
              </p>

              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>

            <FaChevronDown className="hidden text-[10px] text-slate-400 sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-64">
            {/* ADMIN DETAILS */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1 py-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {adminName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {adminEmail || "Administrator"}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* PROFILE & SETTINGS */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigate("/admin/profile")}
                className="cursor-pointer gap-3 py-2"
              >
                <FaUser className="text-slate-500" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/admin/settings")}
                className="cursor-pointer gap-3 py-2"
              >
                <FaGear className="text-slate-500" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* LOGOUT */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-3 py-2 text-red-600 focus:text-red-600"
              >
                <FaRightFromBracket />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
