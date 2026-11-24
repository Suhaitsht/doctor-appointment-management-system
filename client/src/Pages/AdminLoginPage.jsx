import React, { useState } from "react";

import { FaFacebookF, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa6";

import { Link, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { loginUser, logout, clearAuthError } from "@/redux/slices/authSlice";

import logo from "@/assets/logo (1).svg";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminLoginPage() {
  // ======================================================
  // ROUTER + REDUX
  // ======================================================

  const navigate = useNavigate();

  const dispatch = useDispatch();

  // ======================================================
  // REDUX AUTH STATE
  // ======================================================

  const { loading, error: authError } = useSelector((state) => state.auth);

  // ======================================================
  // FORM DATA
  // ======================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ======================================================
  // SHOW / HIDE PASSWORD
  // ======================================================

  const [showPassword, setShowPassword] = useState(false);

  // ======================================================
  // FRONTEND VALIDATION ERRORS
  // ======================================================

  const [errors, setErrors] = useState({});

  // ======================================================
  // ADMIN ROLE ERROR
  // ======================================================

  const [adminError, setAdminError] = useState("");

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update input
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // Clear admin role error
    setAdminError("");

    // Clear Redux login error
    if (authError) {
      dispatch(clearAuthError());
    }
  };

  // ======================================================
  // FRONTEND VALIDATION
  // ======================================================

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ======================================================
  // ADMIN LOGIN
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ------------------------------------------
    // 1. Frontend validation
    // ------------------------------------------

    if (!validateForm()) {
      return;
    }

    // Clear previous admin error
    setAdminError("");

    try {
      // ----------------------------------------
      // 2. Redux login
      // ----------------------------------------

      const result = await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),

          password: formData.password,
        }),
      ).unwrap();

      console.log("ADMIN LOGIN RESULT:", result);

      // ----------------------------------------
      // 3. Check admin role
      // ----------------------------------------

      if (result.user?.role !== "admin") {
        /*
         * loginUser already stored this
         * user's details and JWT.
         *
         * But this is not an admin.
         * So immediately remove them.
         */

        dispatch(logout());

        setAdminError("Access denied. This account is not an admin account.");

        return;
      }

      // ----------------------------------------
      // 4. ADMIN LOGIN SUCCESS
      // ----------------------------------------

      console.log("ADMIN LOGIN SUCCESS:", result.user);

      // ----------------------------------------
      // 5. REDIRECT ADMIN
      // ----------------------------------------

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (error) {
      /*
       * Backend login errors are already
       * stored inside Redux state.error.
       */

      console.error("ADMIN LOGIN ERROR:", error);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-8">
      <Card className="w-full max-w-[900px] overflow-hidden border-0 p-0 shadow-xl">
        <div className="grid min-h-[520px] md:grid-cols-2">
          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <div className="relative hidden overflow-hidden bg-gradient-to-b from-[#17619a] via-[#148bb5] to-[#08c7df] md:flex">
            {/* Decorative circles */}

            <div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-white/10" />

            <div className="absolute right-10 top-20 h-32 w-32 rounded-full border border-white/10" />

            <div className="absolute bottom-10 left-14 h-20 w-20 rounded-full border border-white/10" />

            <div className="flex w-full items-center justify-center">
              <img
                src={logo}
                alt="Doccure"
                className="w-[190px] brightness-0 invert"
              />
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT SIDE */}
          {/* ================================================= */}

          <div className="flex items-center bg-white px-6 py-10 sm:px-10 md:px-12">
            <div className="mx-auto w-full max-w-[340px]">
              {/* ============================================= */}
              {/* MOBILE LOGO */}
              {/* ============================================= */}

              <div className="mb-7 flex justify-center md:hidden">
                <img src={logo} alt="Doccure" className="w-[160px]" />
              </div>

              {/* ============================================= */}
              {/* HEADING */}
              {/* ============================================= */}

              <div className="text-center">
                <h1 className="text-2xl font-semibold text-slate-900">
                  Admin Login
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Access to admin dashboard
                </p>
              </div>

              {/* ============================================= */}
              {/* BACKEND LOGIN ERROR */}
              {/* ============================================= */}

              {authError && (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              {/* ============================================= */}
              {/* ADMIN ROLE ERROR */}
              {/* ============================================= */}

              {adminError && (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{adminError}</p>
                </div>
              )}

              {/* ============================================= */}
              {/* FORM */}
              {/* ============================================= */}

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {/* =========================================== */}
                {/* EMAIL */}
                {/* =========================================== */}

                <div>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Admin Email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                    className={`h-11 ${
                      errors.email
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />

                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* =========================================== */}
                {/* PASSWORD */}
                {/* =========================================== */}

                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={loading}
                      className={`h-11 pr-11 ${
                        errors.password
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* =========================================== */}
                {/* LOGIN BUTTON */}
                {/* =========================================== */}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* ============================================= */}
              {/* FORGOT PASSWORD */}
              {/* ============================================= */}

              <div className="mt-4 text-center">
                <Link
                  to="/admin/forgot-password"
                  className="text-sm text-slate-500 transition hover:text-blue-600"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* ============================================= */}
              {/* OR */}
              {/* ============================================= */}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs text-slate-400">OR</span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* ============================================= */}
              {/* SOCIAL LOGIN */}
              {/* ============================================= */}

              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-slate-500">Login with</span>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded bg-[#4267B2] text-white transition hover:opacity-90"
                >
                  <FaFacebookF />
                </button>

                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded bg-[#ea4335] text-white transition hover:opacity-90"
                >
                  <FaGoogle />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
