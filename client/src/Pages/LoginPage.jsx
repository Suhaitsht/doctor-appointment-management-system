import React, { useState } from "react";

import LoginBanner from "../assets/login-banner.webp";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegEyeSlash } from "react-icons/fa6";

import { NavLink, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { loginUser, clearAuthError } from "@/redux/slices/authSlice";

export default function LoginPage() {
  // ==========================================
  // REACT ROUTER
  // ==========================================

  const navigate = useNavigate();

  // ==========================================
  // REDUX
  // ==========================================

  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,

      [name]: value,
    }));

    // Remove field error when user types
    setErrors((previousErrors) => ({
      ...previousErrors,

      [name]: "",
    }));

    // Remove Redux login error
    if (error) {
      dispatch(clearAuthError());
    }
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validate = () => {
    const tempErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // EMAIL
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      tempErrors.email = "Please enter a valid email address.";
    }

    // PASSWORD
    if (!formData.password) {
      tempErrors.password = "Password is required.";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),

          password: formData.password,
        }),
      ).unwrap();

      console.log("USER ROLE:", result.user);

      if (result.user?.role === "patient") {
        navigate("/patient/dashboard", {
          replace: true,
        });
      } else if (result.user?.role === "doctor") {
        navigate("/doctor/dashboard", {
          replace: true,
        });
      } else {
        console.log("Unknown role:", result.user?.role);
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
    }
  };
  return (
    <>
      <div className="container-custom grid justify-center items-center mt-24 lg:mt-44 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* =================================
              IMAGE BANNER
          ================================= */}

          <div className="hidden lg:block">
            <img
              src={LoginBanner}
              alt="Login"
              className="aspect-video object-cover h-full"
            />
          </div>

          {/* =================================
              LOGIN CARD
          ================================= */}

          <Card className="w-120 lg:w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Login</CardTitle>
            </CardHeader>

            <CardContent>
              {/* =============================
                  REDUX / SERVER ERROR
              ============================= */}

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* =============================
                  LOGIN FORM
              ============================= */}

              <form onSubmit={handleSubmit} className="px-3">
                <div className="flex flex-col gap-6 pl-5">
                  {/* =========================
                      EMAIL
                  ========================= */}

                  <div className="grid gap-4">
                    <label>Email</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={`border rounded p-2 w-full outline-none ${
                        errors.email
                          ? "border-red-500"
                          : "focus:border-blue-500"
                      }`}
                    />

                    {errors.email && (
                      <span className="text-sm text-red-500">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  {/* =========================
                      PASSWORD
                  ========================= */}

                  <div className="grid gap-4">
                    <label>Password</label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className={`border rounded p-2 pr-12 w-full outline-none ${
                          errors.password
                            ? "border-red-500"
                            : "focus:border-blue-500"
                        }`}
                      />

                      {/* SHOW / HIDE PASSWORD */}

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                      >
                        {showPassword ? (
                          <MdOutlineRemoveRedEye />
                        ) : (
                          <FaRegEyeSlash />
                        )}
                      </button>
                    </div>

                    {errors.password && (
                      <span className="text-sm text-red-500">
                        {errors.password}
                      </span>
                    )}
                  </div>

                  {/* =========================
                      LOGIN BUTTON
                  ========================= */}

                  {/* =================================
    FORGOT PASSWORD LINK
================================= */}

                  <div className="flex justify-end">
                    <NavLink
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                    >
                      Forgot Password?
                    </NavLink>
                  </div>

                  <div className="grid gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </button>
                  </div>

                  {/* =========================
                      OR
                  ========================= */}

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-sm font-medium text-slate-500">
                      Or
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* =========================
                      REGISTER LINK
                  ========================= */}

                  <p className="text-center text-md text-gray-600">
                    Don't have an account?{" "}
                    <NavLink
                      to="/register"
                      className="text-blue-500 font-semibold"
                    >
                      Register
                    </NavLink>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
