import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldHalved,
  FaCircleCheck,
  FaCircleXmark,
  FaKey,
  FaArrowRotateLeft,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  changePassword,
  selectPasswordLoading,
  clearAuthMessage,
} from "@/redux/slices/authSlice";

// ======================================================
// CONSTANTS
// ======================================================

const initialForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialVisibility = {
  oldPassword: false,
  newPassword: false,
  confirmPassword: false,
};

const passwordFields = [
  {
    name: "oldPassword",
    label: "Current Password",
    placeholder: "Enter your current password",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "New Password",
    placeholder: "Create a strong new password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm New Password",
    placeholder: "Re-enter your new password",
    autoComplete: "new-password",
  },
];

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ChangePassword() {
  const dispatch = useDispatch();

  // Redux loading
  const loading = useSelector(selectPasswordLoading);

  // Local state
  const [form, setForm] = useState({ ...initialForm });
  const [visible, setVisible] = useState({
    ...initialVisibility,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // ====================================================
  // PASSWORD REQUIREMENTS
  // ====================================================

  const requirements = [
    {
      label: "At least 8 characters",
      valid: form.newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(form.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(form.newPassword),
    },
    {
      label: "One number",
      valid: /\d/.test(form.newPassword),
    },
  ];

  const strengthScore = requirements.filter((item) => item.valid).length;

  const strength =
    strengthScore <= 1
      ? "Weak"
      : strengthScore === 2
        ? "Fair"
        : strengthScore === 3
          ? "Good"
          : "Strong";

  const strengthColor =
    strengthScore <= 1
      ? "bg-red-500"
      : strengthScore === 2
        ? "bg-orange-400"
        : strengthScore === 3
          ? "bg-blue-500"
          : "bg-emerald-500";

  // ====================================================
  // HANDLE INPUT CHANGE
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));

    setMessage("");
  };

  // ====================================================
  // TOGGLE PASSWORD VISIBILITY
  // ====================================================

  const toggleVisibility = (field) => {
    setVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // ====================================================
  // RESET FORM
  // ====================================================

  const handleCancel = () => {
    if (loading) return;

    setForm({ ...initialForm });
    setVisible({ ...initialVisibility });
    setErrors({});
    setMessage("");

    dispatch(clearAuthMessage());
  };

  // ====================================================
  // FORM VALIDATION
  // ====================================================

  const validate = () => {
    const nextErrors = {};

    if (!form.oldPassword) {
      nextErrors.oldPassword = "Current password is required.";
    }

    if (!form.newPassword) {
      nextErrors.newPassword = "New password is required.";
    } else if (
      !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(form.newPassword)
    ) {
      nextErrors.newPassword = "Your password does not meet the requirements.";
    }

    if (
      form.oldPassword &&
      form.newPassword &&
      form.oldPassword === form.newPassword
    ) {
      nextErrors.newPassword =
        "New password must be different from current password.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ====================================================
  // UPDATE PASSWORD - REDUX + BACKEND API
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!validate()) return;

    setMessage("");
    setErrors({});

    dispatch(clearAuthMessage());

    try {
      // Frontend oldPassword maps to backend currentPassword.
      const result = await dispatch(
        changePassword({
          currentPassword: form.oldPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      ).unwrap();

      // Only show success after backend confirmation.
      setMessage(result?.message || "Password changed successfully.");

      // Clear sensitive inputs.
      setForm({ ...initialForm });
      setVisible({ ...initialVisibility });
    } catch (error) {
      setErrors({
        general:
          typeof error === "string"
            ? error
            : error?.message || "Unable to change password.",
      });
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full">
      {/* PAGE HEADING */}
      <div className="mb-7">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
          <span>Doctor</span>
          <span>/</span>
          <span>Account Settings</span>
          <span>/</span>
          <span className="text-blue-600">Change Password</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Change Password
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update your password to keep your doctor account secure.
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT: PASSWORD FORM */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
          {/* CARD HEADER */}
          <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FaKey className="text-xl" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Password Settings
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Enter your current password and choose a new one.
              </p>
            </div>
          </div>

          {/* PASSWORD FORM */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6 px-6 py-7">
              {passwordFields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    {field.label}
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={visible[field.name] ? "text" : "password"}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      disabled={loading}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-describedby={
                        errors[field.name] ? `${field.name}-error` : undefined
                      }
                      className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 pl-4 pr-12 text-sm transition focus-visible:ring-blue-500 ${
                        errors[field.name] ? "border-red-400" : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => toggleVisibility(field.name)}
                      disabled={loading}
                      aria-label={
                        visible[field.name]
                          ? `Hide ${field.label}`
                          : `Show ${field.label}`
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600 disabled:opacity-50"
                    >
                      {visible[field.name] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* FIELD ERROR */}
                  {errors[field.name] && (
                    <p
                      id={`${field.name}-error`}
                      className="mt-2 flex items-center gap-1 text-xs text-red-500"
                    >
                      <FaCircleXmark />
                      {errors[field.name]}
                    </p>
                  )}

                  {/* PASSWORD STRENGTH */}
                  {field.name === "newPassword" && form.newPassword && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Password strength
                        </span>

                        <span className="text-xs font-semibold text-slate-700">
                          {strength}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((segment) => (
                          <div
                            key={segment}
                            className={`h-1.5 rounded-full ${
                              segment <= strengthScore
                                ? strengthColor
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PASSWORD MATCH */}
                  {field.name === "confirmPassword" &&
                    form.confirmPassword &&
                    form.newPassword === form.confirmPassword && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <FaCircleCheck />
                        Passwords match
                      </p>
                    )}
                </div>
              ))}

              {/* GENERAL ERROR */}
              {errors.general && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {errors.general}
                </div>
              )}

              {/* SUCCESS MESSAGE */}
              {message && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {message}
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 px-5"
              >
                <FaArrowRotateLeft className="mr-2" />
                Reset
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-blue-600 px-6 font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <FaLock className="mr-2" />
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Card>

        {/* RIGHT: SECURITY PANEL */}
        <div className="space-y-5">
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FaShieldHalved className="text-lg" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Password Requirements
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Follow these security rules
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div
                  key={requirement.label}
                  className="flex items-center gap-3"
                >
                  {requirement.valid ? (
                    <FaCircleCheck className="shrink-0 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                  )}

                  <span
                    className={`text-sm ${
                      requirement.valid
                        ? "font-medium text-emerald-700"
                        : "text-slate-500"
                    }`}
                  >
                    {requirement.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* SECURITY TIP */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-start gap-3">
              <FaLock className="mt-1 shrink-0 text-blue-600" />

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Security Tip
                </h3>

                <p className="mt-2 text-xs leading-6 text-slate-600">
                  Use a unique password that you don't use for other accounts.
                  Avoid sharing your password with anyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
