import React, { useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { registerUser, clearAuthMessage } from "@/redux/slices/authSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FaRegEyeSlash } from "react-icons/fa6";

import LoginBanner from "../assets/login-banner.webp";

export default function RegisterPage() {
  // ======================================================
  // ROUTER + REDUX
  // ======================================================

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ======================================================
  // GET AUTH STATE FROM REDUX
  // ======================================================

  const { loading, error, successMessage } = useSelector((state) => state.auth);

  // ======================================================
  // FORM DATA
  // ======================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // ======================================================
  // PASSWORD SHOW / HIDE
  // ======================================================

  const [showPassword, setShowPassword] = useState(false);

  // ======================================================
  // FRONTEND VALIDATION ERRORS
  // ======================================================

  const [errors, setErrors] = useState({});

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Remove validation error
    // when user starts typing
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    // Remove Redux backend messages
    if (error || successMessage) {
      dispatch(clearAuthMessage());
    }
  };

  // ======================================================
  // FRONTEND VALIDATION
  // ======================================================

  const validate = () => {
    const tempErrors = {};

    // Name:
    // Letters and spaces only
    const nameRegex = /^[A-Za-z ]+$/;

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Sri Lankan mobile:
    // Example: 0771234567
    const phoneRegex = /^07\d{8}$/;

    // Password:
    // Minimum 8 characters
    // One uppercase
    // One lowercase
    // One number
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

    // ====================================================
    // NAME VALIDATION
    // ====================================================

    if (!formData.name.trim()) {
      tempErrors.name = "Name is required.";
    } else if (!nameRegex.test(formData.name.trim())) {
      tempErrors.name = "Name must contain letters and spaces only.";
    }

    // ====================================================
    // EMAIL VALIDATION
    // ====================================================

    if (!formData.email.trim()) {
      tempErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      tempErrors.email = "Please enter a valid email address.";
    }

    // ====================================================
    // PHONE VALIDATION
    // ====================================================

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      tempErrors.phone =
        "Please enter a valid Sri Lankan mobile number (e.g., 0771234567).";
    }

    // ====================================================
    // PASSWORD VALIDATION
    // ====================================================

    if (!formData.password) {
      tempErrors.password = "Password is required.";
    } else if (!passwordRegex.test(formData.password)) {
      tempErrors.password =
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.";
    }

    // Save validation errors
    setErrors(tempErrors);

    // true = no errors
    return Object.keys(tempErrors).length === 0;
  };

  // ======================================================
  // REGISTER SUBMIT
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ----------------------------------------------------
    // 1. Frontend validation
    // ----------------------------------------------------

    if (!validate()) {
      return;
    }

    try {
      // --------------------------------------------------
      // 2. Send registration through Redux
      // --------------------------------------------------

      const result = await dispatch(
        registerUser({
          name: formData.name.trim(),

          email: formData.email.trim().toLowerCase(),

          phone: formData.phone.trim(),

          password: formData.password,
        }),
      ).unwrap();

      console.log("REGISTER SUCCESS:", result);

      // --------------------------------------------------
      // 3. Clear form after successful registration
      // --------------------------------------------------

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      // --------------------------------------------------
      // 4. Redirect to login
      // --------------------------------------------------

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (registerError) {
      // Redux already stores the error.
      // We only log it here for debugging.

      console.error("REGISTER ERROR:", registerError);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <>
      <div className="container-custom grid justify-center items-center mt-24 lg:mt-44 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* ================================================= */}
          {/* IMAGE BANNER */}
          {/* ================================================= */}

          <div className="hidden lg:block">
            <img
              src={LoginBanner}
              alt="Register"
              className="aspect-video object-cover h-120"
            />
          </div>

          {/* ================================================= */}
          {/* REGISTER CARD */}
          {/* ================================================= */}

          <Card className="w-120 lg:w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Patient Register
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* ============================================= */}
              {/* REDUX BACKEND ERROR */}
              {/* ============================================= */}

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* ============================================= */}
              {/* REGISTRATION SUCCESS */}
              {/* ============================================= */}

              {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                  {successMessage}
                </div>
              )}

              {/* ============================================= */}
              {/* FORM */}
              {/* ============================================= */}

              <form onSubmit={handleSubmit} className="px-3">
                <div className="flex flex-col gap-6 pl-5">
                  {/* ========================================= */}
                  {/* NAME */}
                  {/* ========================================= */}

                  <div className="grid gap-4">
                    <label>Name</label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className={`border rounded p-2 w-full outline-none ${
                        errors.name ? "border-red-500" : "focus:border-blue-500"
                      }`}
                    />

                    {errors.name && (
                      <span className="text-sm text-red-500">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  {/* ========================================= */}
                  {/* EMAIL */}
                  {/* ========================================= */}

                  <div className="grid gap-4">
                    <label>Email</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="patient@example.com"
                      autoComplete="email"
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

                  {/* ========================================= */}
                  {/* PHONE */}
                  {/* ========================================= */}

                  <div className="grid gap-4">
                    <label>Phone</label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0771234567"
                      maxLength={10}
                      autoComplete="tel"
                      inputMode="numeric"
                      className={`border rounded p-2 w-full outline-none ${
                        errors.phone
                          ? "border-red-500"
                          : "focus:border-blue-500"
                      }`}
                    />

                    {errors.phone && (
                      <span className="text-sm text-red-500">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  {/* ========================================= */}
                  {/* PASSWORD */}
                  {/* ========================================= */}

                  <div className="grid gap-4">
                    <label>Create Password</label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create password"
                        autoComplete="new-password"
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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
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

                  {/* ========================================= */}
                  {/* REGISTER BUTTON */}
                  {/* ========================================= */}

                  <div className="grid gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-base font-semibold text-white shadow-sm transition cursor-pointer hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Creating Account..." : "Register"}
                    </button>
                  </div>

                  {/* ========================================= */}
                  {/* OR */}
                  {/* ========================================= */}

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-sm font-medium text-slate-500">
                      Or
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* ========================================= */}
                  {/* LOGIN LINK */}
                  {/* ========================================= */}

                  <p className="text-center text-md text-gray-600">
                    Already have an account?{" "}
                    <NavLink
                      to="/login"
                      className="text-blue-500 font-semibold"
                    >
                      Sign In
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
