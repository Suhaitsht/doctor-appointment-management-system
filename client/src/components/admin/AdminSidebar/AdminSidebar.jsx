import React from "react";

import { NavLink } from "react-router-dom";

import {
  FaHouse,
  FaUserDoctor,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaMoneyBillTransfer,
  FaGear,
  FaFileLines,
  FaUser,
} from "react-icons/fa6";

const menuItems = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: FaHouse,
  },
  {
    name: "Appointments",
    path: "/admin/appointments",
    icon: FaCalendarCheck,
  },
  {
    name: "Specialities",
    path: "/admin/specialities",
    icon: FaBuilding,
  },
  {
    name: "Doctors",
    path: "/admin/doctors",
    icon: FaUserDoctor,
  },
  {
    name: "Patients",
    path: "/admin/patients",
    icon: FaUsers,
  },
  {
    name: "Reviews",
    path: "/admin/reviews",
    icon: FaFileLines,
  },
  {
    name: "Transactions",
    path: "/admin/transactions",
    icon: FaMoneyBillTransfer,
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: FaGear,
  },
];

export default function AdminSidebar() {
  return (
    <aside
      className="
        min-h-screen
        w-[70px]
        shrink-0
        bg-[#0f5f93]
        text-white
        transition-all
        duration-300
        md:w-[230px]
      "
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-white/10 px-2 md:justify-start md:px-5">
        {/* Small screen logo */}
        <span className="text-xl font-bold md:hidden">D</span>

        {/* Desktop logo */}
        <h1 className="hidden text-xl font-bold md:block">DOCCURE</h1>
      </div>

      {/* Menu */}
      <nav className="p-2 md:p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.name}
                className={({ isActive }) =>
                  `
                  flex
                  items-center
                  justify-center
                  rounded-md
                  px-3
                  py-3
                  text-sm
                  transition
                  md:justify-start
                  md:gap-3
                  md:px-4

                  ${
                    isActive
                      ? "bg-cyan-500 text-white"
                      : "text-blue-50 hover:bg-white/10"
                  }
                  `
                }
              >
                {/* Icon */}
                <Icon className="shrink-0 text-lg" />

                {/* Text hidden on small screens */}
                <span className="hidden md:inline">{item.name}</span>
              </NavLink>
            );
          })}

          {/* Profile */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <NavLink
              to="/admin/profile"
              title="Profile"
              className={({ isActive }) =>
                `
                flex
                items-center
                justify-center
                rounded-md
                px-3
                py-3
                text-sm
                transition
                md:justify-start
                md:gap-3
                md:px-4

                ${
                  isActive
                    ? "bg-cyan-500 text-white"
                    : "text-blue-50 hover:bg-white/10"
                }
                `
              }
            >
              <FaUser className="shrink-0 text-lg" />

              <span className="hidden md:inline">Profile</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </aside>
  );
}
