import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import {
  forgotPassword,
  clearForgotPasswordState,
} from "@/redux/slices/authSlice";

import {
  FaArrowRight,
  FaCheckCircle,
  FaSpinner,
  FaEnvelope,
  FaExclamationCircle,
} from "react-icons/fa";

// Use your existing local login banner.
// Adjust the path if your assets folder differs.
import LoginBanner from "@/assets/login-banner.webp";

// ======================================================
// FORGOT PASSWORD PAGE
// ======================================================

const ForgotPassword = () => {
  // ====================================================
  // REDUX
  // ====================================================

  const dispatch = useDispatch();

  const {
    forgotPasswordLoading,
    forgotPasswordError,
    forgotPasswordSuccess,
    forgotPasswordMessage,
  } = useSelector((state) => state.auth);

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [email, setEmail] = useState("");

  const [error, setError] = useState("");

  // ====================================================
  // RESET OLD REDUX MESSAGES ON PAGE MOUNT
  // ====================================================

  useEffect(() => {
    dispatch(clearForgotPasswordState());

    return () => {
      dispatch(clearForgotPasswordState());
    };
  }, [dispatch]);

  // ====================================================
  // EMAIL VALIDATION
  // ====================================================

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // ====================================================
  // HANDLE EMAIL CHANGE
  // ====================================================

  const handleEmailChange = (e) => {
    const value = e.target.value;

    setEmail(value);

    if (error) {
      setError("");
    }

    // Clear previous API results when email changes.
    if (forgotPasswordError || forgotPasswordSuccess) {
      dispatch(clearForgotPasswordState());
    }
  };

  // ====================================================
  // SUBMIT FORGOT PASSWORD REQUEST
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (forgotPasswordLoading) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Required validation
    if (!cleanEmail) {
      setError("Email address is required.");
      return;
    }

    // Email format validation
    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");

    try {
      // Redux Toolkit Async Thunk
      // POST /api/auth/forgot-password

      await dispatch(forgotPassword(cleanEmail)).unwrap();
    } catch (requestError) {
      console.error("FORGOT PASSWORD ERROR:", requestError);
    }
  };

  // ====================================================
  // REQUEST ANOTHER RESET LINK
  // ====================================================

  const handleTryAgain = () => {
    dispatch(clearForgotPasswordState());
    setError("");
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="w-full bg-white font-sans">
      {/* ================================================
          MAIN FORGOT PASSWORD SECTION
      ================================================= */}

      <section className="mx-auto flex min-h-[580px] w-full max-w-[1200px] items-center px-4 py-14 sm:px-6 lg:min-h-[600px] lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* ============================================
              LEFT SIDE - HEALTHCARE ILLUSTRATION
          ============================================= */}

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[485px]">
              <img
                src={LoginBanner}
                alt="Doctor and patient healthcare illustration"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* ============================================
              RIGHT SIDE - FORGOT PASSWORD FORM
          ============================================= */}

          <div className="w-full">
            <div className="w-full rounded-[9px] border border-[#E2E8F0] bg-white px-5 py-6 sm:px-6">
              {/* ========================================
                  HEADING
              ========================================= */}

              <div className="mb-6">
                <h1 className="mb-1 text-[17px] font-bold text-[#0B1736]">
                  Forgot Password
                </h1>

                <p className="text-[14px] leading-6 text-[#52627B]">
                  Enter your email and we will send you a link to reset your
                  password.
                </p>
              </div>

              {/* ========================================
                  SUCCESS MESSAGE
              ========================================= */}

              {forgotPasswordSuccess && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-lg text-green-600" />

                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-green-800">
                        Request Received
                      </h3>

                      <p className="text-sm leading-6 text-green-700">
                        {forgotPasswordMessage ||
                          "If an active account exists with this email, a password reset link will be sent."}
                      </p>

                      <p className="mt-2 text-xs text-green-700">
                        If you receive the email, use the reset link within 15
                        minutes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================
                  API ERROR MESSAGE
              ========================================= */}

              {forgotPasswordError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <FaExclamationCircle className="mt-0.5 shrink-0 text-base text-red-500" />

                  <p className="text-sm text-red-600">{forgotPasswordError}</p>
                </div>
              )}

              {/* ========================================
                  FORGOT PASSWORD FORM
              ========================================= */}

              {!forgotPasswordSuccess && (
                <form onSubmit={handleSubmit} noValidate className="w-full">
                  {/* ====================================
                      EMAIL FIELD
                  ===================================== */}

                  <div className="mb-4">
                    <label
                      htmlFor="forgot-email"
                      className="mb-2 block text-[13px] font-semibold text-[#0B1736]"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <input
                        type="email"
                        id="forgot-email"
                        name="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Enter your registered email"
                        autoComplete="email"
                        disabled={forgotPasswordLoading}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error ? "forgot-email-error" : undefined
                        }
                        className={`h-[43px] w-full rounded-[5px] border bg-white px-4 pr-10 text-[14px] text-[#0B1736] outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                          error
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-[#E2E8F0] hover:border-[#B6C4D8] focus:border-[#2D71FF] focus:ring-blue-100"
                        }`}
                      />

                      {/* Valid email indicator */}

                      {validateEmail(email.trim()) &&
                        !error &&
                        !forgotPasswordLoading && (
                          <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-500" />
                        )}

                      {/* Loading indicator */}

                      {forgotPasswordLoading && (
                        <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-sm text-blue-500" />
                      )}
                    </div>

                    {/* Validation Error */}

                    {error && (
                      <p
                        id="forgot-email-error"
                        role="alert"
                        className="mt-2 text-xs text-red-500"
                      >
                        {error}
                      </p>
                    )}
                  </div>

                  {/* ====================================
                      SUBMIT BUTTON
                  ===================================== */}

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="group flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F70FF] to-[#08BDF3] text-[14px] font-semibold text-white shadow-sm transition-all duration-300 hover:from-[#195CF0] hover:to-[#00A7DD] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit
                        <FaArrowRight className="hidden text-xs transition-transform duration-300 group-hover:translate-x-1 sm:inline" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ========================================
                  REQUEST ANOTHER LINK
              ========================================= */}

              {forgotPasswordSuccess && (
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F70FF] to-[#08BDF3] text-[14px] font-semibold text-white transition-all duration-300 hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  Request Another Link
                  <FaEnvelope className="text-sm" />
                </button>
              )}

              {/* ========================================
                  BACK TO LOGIN
              ========================================= */}

              <div className="mt-5 text-center">
                <p className="text-[14px] text-[#52627B]">
                  Remember Password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-[#2F70FF] transition-colors hover:text-[#1451D8] hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
