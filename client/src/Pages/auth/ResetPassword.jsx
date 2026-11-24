import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import {
  resetPassword,
  clearResetPasswordState,
} from "@/redux/slices/authSlice";

import {
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSpinner,
} from "react-icons/fa";

import LoginBanner from "@/assets/login-banner.webp";

// ======================================================
// RESET PASSWORD PAGE
// ======================================================

const ResetPassword = () => {
  // ====================================================
  // REACT ROUTER
  // ====================================================

  const { token } = useParams();

  const navigate = useNavigate();

  // ====================================================
  // REDUX
  // ====================================================

  const dispatch = useDispatch();

  const {
    resetPasswordLoading,
    resetPasswordError,
    resetPasswordSuccess,
    resetPasswordMessage,
  } = useSelector((state) => state.auth);

  // ====================================================
  // FORM STATE
  // ====================================================

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ====================================================
  // CLEAR PREVIOUS RESET PASSWORD STATE
  // ====================================================

  useEffect(() => {
    dispatch(clearResetPasswordState());
  }, [dispatch, token]);

  // ====================================================
  // PASSWORD RULES
  // ====================================================

  const passwordRules = {
    minLength: formData.newPassword.length >= 8,

    uppercase: /[A-Z]/.test(formData.newPassword),

    lowercase: /[a-z]/.test(formData.newPassword),

    number: /\d/.test(formData.newPassword),
  };

  const isStrongPassword = Object.values(passwordRules).every(Boolean);

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword;

  // ====================================================
  // VALIDATE RESET TOKEN
  // ====================================================

  const isValidToken =
    typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

  // ====================================================
  // HANDLE INPUT CHANGE
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    if (resetPasswordError) {
      dispatch(clearResetPasswordState());
    }
  };

  // ====================================================
  // FORM VALIDATION
  // ====================================================

  const validateForm = () => {
    const tempErrors = {};

    if (!formData.newPassword) {
      tempErrors.newPassword = "New password is required.";
    } else if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(formData.newPassword)
    ) {
      tempErrors.newPassword =
        "Password must contain at least 8 characters, uppercase, lowercase and a number.";
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your new password.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  // ====================================================
  // HANDLE RESET PASSWORD
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (resetPasswordLoading || resetPasswordSuccess) {
      return;
    }

    if (!isValidToken) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(
        resetPassword({
          token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      ).unwrap();

      // Clear sensitive password values.
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });

      // Redux now displays success.
      // User can continue to login.
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
    }
  };

  // ====================================================
  // PASSWORD RULE COMPONENT
  // ====================================================

  const PasswordRule = ({ passed, children }) => (
    <div className="flex items-center gap-2">
      <FaCheckCircle
        className={`text-xs ${passed ? "text-green-500" : "text-slate-300"}`}
      />

      <span
        className={`text-xs ${passed ? "text-green-600" : "text-slate-500"}`}
      >
        {children}
      </span>
    </div>
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="w-full bg-white font-sans">
      {/* MAIN SECTION */}

      <section className="mx-auto flex min-h-[600px] w-full max-w-[1200px] items-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* ============================================
              LEFT SIDE - HEALTHCARE ILLUSTRATION
          ============================================= */}

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[485px]">
              <img
                src={LoginBanner}
                alt="Healthcare password reset illustration"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* ============================================
              RIGHT SIDE - RESET PASSWORD CARD
          ============================================= */}

          <div className="w-full">
            <div className="w-full rounded-[9px] border border-[#E2E8F0] bg-white px-5 py-6 sm:px-6">
              {/* HEADING */}

              <div className="mb-6">
                <h1 className="mb-1 text-[18px] font-bold text-[#0B1736]">
                  Reset Password
                </h1>

                <p className="text-[14px] leading-6 text-[#52627B]">
                  Enter and confirm your new password to securely access your
                  account.
                </p>
              </div>

              {/* ========================================
                  INVALID TOKEN
              ========================================= */}

              {!isValidToken && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" />

                    <div>
                      <h3 className="text-sm font-semibold text-red-700">
                        Invalid Reset Link
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        This reset link is invalid. Please request a new
                        password reset link.
                      </p>

                      <Link
                        to="/forgot-password"
                        className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Request New Link
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================
                  RESET SUCCESS
              ========================================= */}

              {isValidToken && resetPasswordSuccess && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-5 rounded-lg border border-green-200 bg-green-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <FaCheckCircle className="mt-1 shrink-0 text-xl text-green-600" />

                    <div>
                      <h3 className="mb-2 text-base font-bold text-green-800">
                        Password Reset Successful!
                      </h3>

                      <p className="text-sm leading-6 text-green-700">
                        {resetPasswordMessage ||
                          "Your password has been reset successfully."}
                      </p>

                      <p className="mt-2 text-xs text-green-700">
                        You can now sign in using your new password.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login", {
                        replace: true,
                      })
                    }
                    className="mt-5 flex h-[43px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F70FF] to-[#08BDF3] text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Continue to Login
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              )}

              {/* ========================================
                  API ERROR
              ========================================= */}

              {isValidToken && !resetPasswordSuccess && resetPasswordError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <FaExclamationCircle className="mt-0.5 shrink-0 text-base text-red-500" />

                  <div>
                    <p className="text-sm text-red-600">{resetPasswordError}</p>

                    <Link
                      to="/forgot-password"
                      className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Request Another Reset Link
                    </Link>
                  </div>
                </div>
              )}

              {/* ========================================
                  RESET PASSWORD FORM
              ========================================= */}

              {isValidToken && !resetPasswordSuccess && (
                <form onSubmit={handleSubmit} noValidate className="w-full">
                  {/* NEW PASSWORD */}

                  <div className="mb-5">
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-[13px] font-semibold text-[#0B1736]"
                    >
                      New Password
                    </label>

                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={resetPasswordLoading}
                        aria-invalid={Boolean(errors.newPassword)}
                        className={`h-[43px] w-full rounded-[5px] border bg-white px-4 pr-12 text-[14px] text-[#0B1736] outline-none transition-all focus:ring-2 ${
                          errors.newPassword
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-[#E2E8F0] focus:border-[#2D71FF] focus:ring-blue-100"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword((previous) => !previous)
                        }
                        disabled={resetPasswordLoading}
                        aria-label={
                          showNewPassword
                            ? "Hide new password"
                            : "Show new password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-600"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {errors.newPassword && (
                      <p role="alert" className="mt-2 text-xs text-red-500">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* PASSWORD REQUIREMENTS */}

                  <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-700">
                      Password Requirements
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <PasswordRule passed={passwordRules.minLength}>
                        At least 8 characters
                      </PasswordRule>

                      <PasswordRule passed={passwordRules.uppercase}>
                        One uppercase letter
                      </PasswordRule>

                      <PasswordRule passed={passwordRules.lowercase}>
                        One lowercase letter
                      </PasswordRule>

                      <PasswordRule passed={passwordRules.number}>
                        One number
                      </PasswordRule>
                    </div>

                    {formData.newPassword && (
                      <p
                        className={`mt-3 text-xs font-medium ${
                          isStrongPassword ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {isStrongPassword
                          ? "Password meets all requirements"
                          : "Complete all password requirements"}
                      </p>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="mb-5">
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-[13px] font-semibold text-[#0B1736]"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={resetPasswordLoading}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        className={`h-[43px] w-full rounded-[5px] border bg-white px-4 pr-12 text-[14px] text-[#0B1736] outline-none transition-all focus:ring-2 ${
                          errors.confirmPassword
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-[#E2E8F0] focus:border-[#2D71FF] focus:ring-blue-100"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        disabled={resetPasswordLoading}
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmation password"
                            : "Show confirmation password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-600"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {errors.confirmPassword && (
                      <p role="alert" className="mt-2 text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}

                    {passwordsMatch && !errors.confirmPassword && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-green-600">
                        <FaCheckCircle />
                        Passwords match
                      </p>
                    )}
                  </div>

                  {/* RESET BUTTON */}

                  <button
                    type="submit"
                    disabled={resetPasswordLoading}
                    className="group flex h-[43px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2F70FF] to-[#08BDF3] text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:from-[#195CF0] hover:to-[#00A7DD] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetPasswordLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* BACK TO LOGIN */}

              <div className="mt-6 text-center">
                <p className="text-[14px] text-[#52627B]">
                  Remember Password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-[#2F70FF] hover:text-[#1451D8] hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>

              {/* SECURITY NOTE */}

              <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5">
                <FaLock className="text-xs text-slate-400" />

                <p className="text-center text-xs text-slate-400">
                  Your account security is our priority
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
