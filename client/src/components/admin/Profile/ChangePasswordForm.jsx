import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FaEye, FaEyeSlash } from "react-icons/fa6";

import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePassword, clearAuthMessage } from "@/redux/slices/authSlice";

// ==========================================
// INITIAL FORM STATE
// ==========================================

const initialFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ==========================================
// PASSWORD VALIDATION
// ==========================================

const passwordRules = [
  {
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    label: "One number",
    test: (value) => /\d/.test(value),
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ChangePasswordForm() {
  const dispatch = useDispatch();

  const { passwordLoading, error, successMessage } = useSelector(
    (state) => state.auth,
  );

  const [formData, setFormData] = useState(initialFormData);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [validationError, setValidationError] = useState("");

  const [localSuccess, setLocalSuccess] = useState("");

  // ==========================================
  // PASSWORD STRENGTH
  // ==========================================

  const passedRules = passwordRules.filter((rule) =>
    rule.test(formData.newPassword),
  ).length;

  const passwordStrength =
    passedRules === 4 ? "Strong" : passedRules >= 2 ? "Medium" : "Weak";

  const strengthColor =
    passedRules === 4
      ? "bg-green-500"
      : passedRules >= 2
        ? "bg-yellow-500"
        : "bg-red-500";

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationError("");
    setLocalSuccess("");

    if (error || successMessage) {
      dispatch(clearAuthMessage());
    }
  };

  // ==========================================
  // TOGGLE PASSWORD VISIBILITY
  // ==========================================

  const togglePassword = (field) => {
    setShowPassword((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const handleReset = () => {
    setFormData(initialFormData);

    setShowPassword({
      current: false,
      new: false,
      confirm: false,
    });

    setValidationError("");
    setLocalSuccess("");

    dispatch(clearAuthMessage());
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword) {
      return "Current password is required.";
    }

    if (!newPassword) {
      return "New password is required.";
    }

    if (!passwordRules.every((rule) => rule.test(newPassword))) {
      return "New password must contain at least 8 characters, uppercase, lowercase and a number.";
    }

    if (newPassword === currentPassword) {
      return "New password must be different from current password.";
    }

    if (!confirmPassword) {
      return "Please confirm your new password.";
    }

    if (newPassword !== confirmPassword) {
      return "New password and confirm password do not match.";
    }

    return "";
  };

  // ==========================================
  // SUBMIT CHANGE PASSWORD
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (passwordLoading) return;

    const errorMessage = validateForm();

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    try {
      setValidationError("");
      setLocalSuccess("");

      await dispatch(
        changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      ).unwrap();

      // Clear sensitive values after success.
      setFormData(initialFormData);

      setShowPassword({
        current: false,
        new: false,
        confirm: false,
      });

      setLocalSuccess("Password changed successfully.");
    } catch (err) {
      // Redux authSlice stores the backend error.
      console.error(
        "Change password request failed:",
        typeof err === "string" ? err : err?.message || "Request failed",
      );
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <Card className="border-slate-200 p-5 shadow-sm sm:p-6">
      {/* HEADER */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-cyan-50 p-3">
          <LockKeyhole className="h-5 w-5 text-cyan-600" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Change Password
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update your account password to keep your admin account secure.
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-[550px] space-y-5">
        {/* CURRENT PASSWORD */}
        <PasswordField
          label="Current Password"
          name="currentPassword"
          value={formData.currentPassword}
          show={showPassword.current}
          toggle={() => togglePassword("current")}
          onChange={handleChange}
          disabled={passwordLoading}
          autoComplete="current-password"
        />

        {/* NEW PASSWORD */}
        <PasswordField
          label="New Password"
          name="newPassword"
          value={formData.newPassword}
          show={showPassword.new}
          toggle={() => togglePassword("new")}
          onChange={handleChange}
          disabled={passwordLoading}
          autoComplete="new-password"
        />

        {/* PASSWORD STRENGTH */}
        {formData.newPassword && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Password Requirements
              </span>

              <span className="text-xs font-medium text-slate-500">
                {passwordStrength}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {passwordRules.map((rule, index) => (
                <div
                  key={rule.label}
                  className={`h-1.5 rounded-full ${
                    index < passedRules ? strengthColor : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {passwordRules.map((rule) => {
                const passed = rule.test(formData.newPassword);

                return (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${
                      passed ? "text-green-600" : "text-slate-500"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        passed ? "text-green-500" : "text-slate-300"
                      }`}
                    />

                    {rule.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONFIRM PASSWORD */}
        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          show={showPassword.confirm}
          toggle={() => togglePassword("confirm")}
          onChange={handleChange}
          disabled={passwordLoading}
          autoComplete="new-password"
        />

        {/* VALIDATION ERROR */}
        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* BACKEND ERROR */}
        {error && !validationError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}
        {(localSuccess || successMessage) && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{localSuccess || successMessage}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={passwordLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={passwordLoading}
            className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
          >
            {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}

            {passwordLoading ? "Updating Password..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ==========================================
// REUSABLE PASSWORD FIELD
// ==========================================

function PasswordField({
  label,
  name,
  value,
  show,
  toggle,
  onChange,
  disabled,
  autoComplete,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>

      <div className="relative">
        <Input
          id={name}
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          required
          className="pr-11"
        />

        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
        >
          {show ? (
            <FaEyeSlash className="h-4 w-4" />
          ) : (
            <FaEye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
