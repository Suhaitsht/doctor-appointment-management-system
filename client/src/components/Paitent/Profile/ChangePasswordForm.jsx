import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  changePassword,
  clearAuthError,
  clearAuthMessage,
} from "@/redux/slices/authSlice";

// ======================================================
// INITIAL FORM
// ======================================================

const initialFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ======================================================
// CHANGE PASSWORD FORM
// ======================================================

export default function ChangePasswordForm() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const { passwordLoading, error, successMessage } = useSelector(
    (state) => state.auth,
  );

  // ====================================================
  // FORM STATE
  // ====================================================

  const [formData, setFormData] = useState(initialFormData);

  // ====================================================
  // SHOW / HIDE PASSWORD
  // ====================================================

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ====================================================
  // FRONTEND VALIDATION ERROR
  // ====================================================

  const [validationError, setValidationError] = useState("");

  // ====================================================
  // CLEAR OLD REDUX MESSAGES WHEN COMPONENT LOADS
  // ====================================================

  useEffect(() => {
    dispatch(clearAuthMessage());

    return () => {
      dispatch(clearAuthMessage());
    };
  }, [dispatch]);

  // ====================================================
  // AUTO HIDE SUCCESS MESSAGE
  // ====================================================

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(clearAuthMessage());
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage, dispatch]);

  // ====================================================
  // HANDLE INPUT CHANGE
  // ====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear local validation error
    if (validationError) {
      setValidationError("");
    }

    // Clear backend error
    if (error) {
      dispatch(clearAuthError());
    }
  };

  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!currentPassword.trim()) {
      return "Current password is required";
    }

    if (!newPassword.trim()) {
      return "New password is required";
    }

    if (!confirmPassword.trim()) {
      return "Confirm password is required";
    }

    // --------------------------------------------------
    // MINIMUM LENGTH
    // --------------------------------------------------

    if (newPassword.length < 8) {
      return "New password must be at least 8 characters";
    }

    // --------------------------------------------------
    // STRONG PASSWORD
    //
    // Minimum:
    // 1 uppercase
    // 1 lowercase
    // 1 number
    // 8 characters
    // --------------------------------------------------

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return "Password must contain at least one uppercase letter, one lowercase letter and one number";
    }

    // --------------------------------------------------
    // CURRENT AND NEW PASSWORD SHOULD BE DIFFERENT
    // --------------------------------------------------

    if (currentPassword === newPassword) {
      return "New password must be different from current password";
    }

    // --------------------------------------------------
    // CONFIRM PASSWORD
    // --------------------------------------------------

    if (newPassword !== confirmPassword) {
      return "New password and confirm password do not match";
    }

    return "";
  };

  // ====================================================
  // HANDLE SUBMIT
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Clear previous messages
    setValidationError("");

    dispatch(clearAuthMessage());

    // --------------------------------------------------
    // VALIDATE
    // --------------------------------------------------

    const validationMessage = validateForm();

    if (validationMessage) {
      setValidationError(validationMessage);

      return;
    }

    // --------------------------------------------------
    // CREATE API PAYLOAD
    // --------------------------------------------------

    const passwordData = {
      currentPassword: formData.currentPassword,

      newPassword: formData.newPassword,

      confirmPassword: formData.confirmPassword,
    };

    // --------------------------------------------------
    // CALL REDUX THUNK
    // --------------------------------------------------

    const result = await dispatch(changePassword(passwordData));

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    if (changePassword.fulfilled.match(result)) {
      // Security:
      // Clear password fields immediately after success

      setFormData(initialFormData);

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  // ====================================================
  // HANDLE CANCEL / RESET
  // ====================================================

  const handleCancel = () => {
    setFormData(initialFormData);

    setValidationError("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    dispatch(clearAuthMessage());
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <Card className="border-slate-200 p-5 shadow-sm md:p-6">
      {/* ===============================================
          HEADING
      ================================================ */}

      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FaLock />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Change Password
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Update your account password to keep your account secure.
            </p>
          </div>
        </div>
      </div>

      {/* ===============================================
          SUCCESS MESSAGE
      ================================================ */}

      {successMessage && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <FaCircleCheck className="shrink-0" />

          <span>{successMessage}</span>
        </div>
      )}

      {/* ===============================================
          FRONTEND VALIDATION ERROR
      ================================================ */}

      {validationError && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaCircleExclamation className="shrink-0" />

          <span>{validationError}</span>
        </div>
      )}

      {/* ===============================================
          BACKEND ERROR
      ================================================ */}

      {error && !validationError && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaCircleExclamation className="shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* ===============================================
          FORM
      ================================================ */}

      <form onSubmit={handleSubmit}>
        <Card className="mt-6 border-slate-200 p-4 shadow-none md:p-5">
          <div className="max-w-2xl space-y-5">
            {/* =========================================
                CURRENT PASSWORD
            ========================================== */}

            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              showPassword={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((previous) => !previous)}
              placeholder="Enter current password"
            />

            {/* =========================================
                NEW PASSWORD
            ========================================== */}

            <PasswordField
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              showPassword={showNewPassword}
              onToggle={() => setShowNewPassword((previous) => !previous)}
              placeholder="Enter new password"
            />

            {/* =========================================
                PASSWORD REQUIREMENTS
            ========================================== */}

            <PasswordRequirements password={formData.newPassword} />

            {/* =========================================
                CONFIRM PASSWORD
            ========================================== */}

            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              showPassword={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((previous) => !previous)}
              placeholder="Confirm new password"
            />

            {/* =========================================
                PASSWORD MATCH STATUS
            ========================================== */}

            {formData.confirmPassword && (
              <div>
                {formData.newPassword === formData.confirmPassword ? (
                  <p className="flex items-center gap-2 text-xs font-medium text-green-600">
                    <FaCircleCheck />
                    Passwords match
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-xs font-medium text-red-500">
                    <FaCircleExclamation />
                    Passwords do not match
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* =============================================
            BUTTONS
        ============================================== */}

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={passwordLoading}
            className="rounded-full px-6"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={passwordLoading}
            className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordLoading ? (
              <span className="flex items-center gap-2">
                <FaSpinner className="animate-spin" />
                Changing Password...
              </span>
            ) : (
              "Save Password"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ======================================================
// PASSWORD FIELD COMPONENT
// ======================================================

function PasswordField({
  label,
  name,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-700">
        {label}

        <span className="text-red-500"> *</span>
      </label>

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          className="h-10 pr-11"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

// ======================================================
// PASSWORD REQUIREMENTS
// ======================================================

function PasswordRequirements({ password }) {
  const requirements = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },

    {
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(password),
    },

    {
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(password),
    },

    {
      label: "At least one number",
      valid: /\d/.test(password),
    },
  ];

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="mb-3 text-xs font-semibold text-slate-700">
        Password requirements
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <div
            key={requirement.label}
            className={`flex items-center gap-2 text-xs ${
              requirement.valid ? "text-green-600" : "text-slate-400"
            }`}
          >
            <FaCircleCheck />

            <span>{requirement.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
