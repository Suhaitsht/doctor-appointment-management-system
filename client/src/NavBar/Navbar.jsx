import React, { useEffect, useState } from "react";

import { FaInstagram, FaXTwitter, FaBars, FaXmark } from "react-icons/fa6";

import { MdOutlineFacebook } from "react-icons/md";

import { RiLockPasswordLine, RiUserSettingsFill } from "react-icons/ri";

import { Link, NavLink, useLocation } from "react-router-dom";

import { useSelector } from "react-redux";

import logo from "../assets/logo (1).svg";

import PatientProfileDropdown from "./PatientProfileDropdown";
import DoctorProfileDropdown from "./DoctorProfileDropdown";

// Notification Bell
import NotificationBell from "../components/notifications/NotificationBell";

// ======================================================
// NAVIGATION ITEMS
// ======================================================

const NavItems = [
  {
    name: "home",
    navLink: "/",
  },
  {
    name: "about us",
    navLink: "/about",
  },
  {
    name: "departments",
    navLink: "/departments",
  },
  {
    name: "find a doctors",
    navLink: "/doctors",
  },
  {
    name: "book an appointment",
    navLink: "/appointment",
  },
];

// ======================================================
// NAVBAR COMPONENT
// ======================================================

export default function Navbar() {
  // ====================================================
  // STATE
  // ====================================================

  const [showNav, setShowNav] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ====================================================
  // REDUX AUTH
  // ====================================================

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const location = useLocation();

  const isLoggedIn = Boolean(isAuthenticated && user);

  // IMPORTANT:
  // Use the same token source as your auth system.
  // This example reads Redux first, then localStorage.

  const reduxToken = useSelector((state) => state.auth?.token);

  const token = reduxToken || localStorage.getItem("token");

  // ====================================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // ====================================================

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ====================================================
  // NAVBAR SCROLL BEHAVIOUR
  // ====================================================

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 50);

      if (currentScrollY < 100) {
        setShowNav(true);
      } else if (currentScrollY > lastScrollY) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ====================================================
  // PROFILE DROPDOWN
  // ====================================================

  const renderProfileDropdown = () => {
    if (!isLoggedIn) return null;

    if (user.role === "doctor") {
      return <DoctorProfileDropdown />;
    }

    if (user.role === "patient") {
      return <PatientProfileDropdown />;
    }

    // Add AdminProfileDropdown here if required.
    return null;
  };

  // ====================================================
  // NOTIFICATION BELL
  // ====================================================

  const renderNotificationBell = () => {
    if (!isLoggedIn || !token) {
      return null;
    }

    return (
      <NotificationBell key={String(user._id || user.id || "")} token={token} />
    );
  };

  return (
    <>
      {/* ============================================= */}
      {/* TOP HEADER */}
      {/* ============================================= */}

      <header className="hidden bg-white py-3 shadow-sm xl:block">
        <div className="container-custom flex items-center justify-between">
          {/* EMAIL + PHONE */}

          <div className="flex items-center gap-7">
            <a
              href="mailto:info@example.com"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
            >
              <span>✉</span>
              info@example.com
            </a>

            <a
              href="tel:+16658914556"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
            >
              <span>☎</span>
              +1 66589 14556
            </a>
          </div>

          {/* SOCIAL ICONS */}

          <ul className="flex items-center gap-4">
            <li>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-blue-600 hover:text-white"
              >
                <MdOutlineFacebook className="text-xl" />
              </a>
            </li>

            <li>
              <a
                href="https://www.x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-blue-600 hover:text-white"
              >
                <FaXTwitter className="text-lg" />
              </a>
            </li>

            <li>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-blue-600 hover:text-white"
              >
                <FaInstagram className="text-lg" />
              </a>
            </li>
          </ul>
        </div>
      </header>

      {/* ============================================= */}
      {/* MAIN NAVBAR */}
      {/* ============================================= */}

      <nav
        className={`
          fixed left-0 top-0 z-50 w-full
          bg-white shadow-sm
          transition-all duration-300
          xl:top-14
          ${showNav ? "translate-y-0" : "-translate-y-full"}
          ${isScrolled ? "min-h-[60px]" : "min-h-[80px]"}
        `}
      >
        <div className="container-custom">
          <div
            className={`
              flex items-center justify-between
              gap-4 transition-all duration-300
              ${isScrolled ? "min-h-[60px]" : "min-h-[80px]"}
            `}
          >
            {/* ===================================== */}
            {/* LOGO */}
            {/* ===================================== */}

            <Link to="/" className="flex shrink-0 items-center">
              <img
                src={logo}
                alt="Jayanthi Medical Centre"
                className="h-auto max-h-12 w-auto max-w-[150px] object-contain"
              />
            </Link>

            {/* ===================================== */}
            {/* DESKTOP NAVIGATION */}
            {/* ===================================== */}

            <div className="hidden flex-1 items-center justify-center gap-6 xl:flex">
              {NavItems.map((navItem) => (
                <NavLink
                  to={navItem.navLink}
                  key={navItem.navLink}
                  end={navItem.navLink === "/"}
                  className={({ isActive }) =>
                    `
                    whitespace-nowrap
                    text-sm font-medium capitalize
                    transition-colors duration-200
                    ${
                      isActive
                        ? "text-blue-700"
                        : "text-slate-700 hover:text-blue-700"
                    }
                    `
                  }
                >
                  {navItem.name}
                </NavLink>
              ))}
            </div>

            {/* ===================================== */}
            {/* DESKTOP AUTH SECTION */}
            {/* ===================================== */}

            <div className="hidden shrink-0 items-center gap-3 xl:flex">
              {!isLoggedIn ? (
                <>
                  <NavLink
                    to="/login"
                    className="flex h-10 items-center gap-2 rounded-full bg-[#3c61ea] px-5 font-medium text-white transition hover:bg-blue-700"
                  >
                    <RiLockPasswordLine />
                    Login
                  </NavLink>

                  <NavLink
                    to="/register"
                    className="flex h-10 items-center gap-2 rounded-full bg-[#14cb29] px-5 font-medium text-white transition hover:bg-green-700"
                  >
                    <RiUserSettingsFill />
                    Register
                  </NavLink>
                </>
              ) : (
                <>
                  {/* NOTIFICATION BELL */}

                  {renderNotificationBell()}

                  {/* PROFILE DROPDOWN */}

                  {renderProfileDropdown()}
                </>
              )}
            </div>

            {/* ===================================== */}
            {/* MOBILE / TABLET ACTIONS */}
            {/* ===================================== */}

            <div className="flex items-center gap-2 xl:hidden">
              {/* NOTIFICATION BELL */}

              {isLoggedIn && renderNotificationBell()}

              {/* MOBILE MENU BUTTON */}

              <button
                type="button"
                onClick={() => setMobileMenuOpen((previous) => !previous)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                aria-label={
                  mobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <FaXmark className="text-xl" />
                ) : (
                  <FaBars className="text-xl" />
                )}
              </button>
            </div>
          </div>

          {/* ===================================== */}
          {/* MOBILE NAVIGATION MENU */}
          {/* ===================================== */}

          {mobileMenuOpen && (
            <div className="border-t border-slate-100 bg-white pb-5 xl:hidden">
              <div className="flex flex-col gap-1 pt-3">
                {NavItems.map((navItem) => (
                  <NavLink
                    key={navItem.navLink}
                    to={navItem.navLink}
                    end={navItem.navLink === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `
                      rounded-lg px-4 py-3
                      text-sm font-medium capitalize
                      transition
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                      `
                    }
                  >
                    {navItem.name}
                  </NavLink>
                ))}
              </div>

              {/* MOBILE AUTH */}

              <div className="mt-4 border-t border-slate-100 pt-4">
                {!isLoggedIn ? (
                  <div className="flex gap-3">
                    <NavLink
                      to="/login"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white"
                    >
                      <RiLockPasswordLine />
                      Login
                    </NavLink>

                    <NavLink
                      to="/register"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white"
                    >
                      <RiUserSettingsFill />
                      Register
                    </NavLink>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {user.name || "My Account"}
                      </p>

                      <p className="text-xs capitalize text-slate-500">
                        {user.role}
                      </p>
                    </div>

                    {renderProfileDropdown()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
