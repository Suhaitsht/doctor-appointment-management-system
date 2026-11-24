import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";

import {
  FaTriangleExclamation,
  FaTrash,
  FaSpinner,
  FaCircleExclamation,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

import {
  deactivateAccount,
  clearAuthError,
  clearAuthMessage,
} from "@/redux/slices/authSlice";

import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

// ======================================================
// DELETE ACCOUNT FORM
// ======================================================

export default function DeleteAccountForm() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const { deactivateLoading, error } = useSelector((state) => state.auth);

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [currentPassword, setCurrentPassword] = useState("");

  const [confirmation, setConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [localError, setLocalError] = useState("");

  // ====================================================
  // CLEAN MESSAGES
  // ====================================================

  useEffect(() => {
    dispatch(clearAuthError());

    dispatch(clearAuthMessage());

    return () => {
      dispatch(clearAuthError());

      dispatch(clearAuthMessage());
    };
  }, [dispatch]);

  // ====================================================
  // PASSWORD CHANGE
  // ====================================================

  const handlePasswordChange = (event) => {
    setCurrentPassword(event.target.value);

    setLocalError("");

    if (error) {
      dispatch(clearAuthError());
    }
  };

  // ====================================================
  // CONFIRMATION CHANGE
  // ====================================================

  const handleConfirmationChange = (event) => {
    setConfirmation(event.target.value);

    setLocalError("");

    if (error) {
      dispatch(clearAuthError());
    }
  };

  // ====================================================
  // DEACTIVATE ACCOUNT
  // ====================================================

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    // ----------------------------------------------
    // CLEAR OLD MESSAGES
    // ----------------------------------------------

    setLocalError("");

    dispatch(clearAuthError());

    dispatch(clearAuthMessage());

    // ----------------------------------------------
    // PASSWORD VALIDATION
    // ----------------------------------------------

    if (!currentPassword.trim()) {
      setLocalError("Please enter your current password.");

      return;
    }

    // ----------------------------------------------
    // DELETE CONFIRMATION VALIDATION
    // ----------------------------------------------

    if (confirmation.trim() !== "DELETE") {
      setLocalError(
        'Please type "DELETE" exactly to confirm account deletion.',
      );

      return;
    }

    // ----------------------------------------------
    // FINAL BROWSER CONFIRMATION
    // ----------------------------------------------

    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? You will be logged out immediately.",
    );

    if (!confirmed) {
      return;
    }

    // ----------------------------------------------
    // CALL REDUX THUNK
    // ----------------------------------------------

    const result = await dispatch(
      deactivateAccount({
        currentPassword: currentPassword,
        confirmation: confirmation.trim(),
      }),
    );

    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    if (deactivateAccount.fulfilled.match(result)) {
      console.log("ACCOUNT DEACTIVATED:", result.payload);

      // Redux thunk already removes:
      //
      // localStorage user
      // localStorage token
      //
      // Redux state becomes:
      //
      // user = null
      // token = null
      // isAuthenticated = false

      navigate("/login", {
        replace: true,
      });
    }
  };

  // ====================================================
  // CHECK WHETHER DELETE IS READY
  // ====================================================

  const canDelete =
    currentPassword.trim().length > 0 && confirmation.trim() === "DELETE";

  // ====================================================
  // UI
  // ====================================================

  return (
    <Card className="border-red-200 p-5 shadow-sm md:p-6">
      {/* ===============================================
          HEADER
      ================================================ */}

      <div className="border-b border-red-100 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FaTriangleExclamation className="text-lg" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-red-600">
              Delete Account
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Deactivate your patient account permanently from login access.
            </p>
          </div>
        </div>
      </div>

      {/* ===============================================
          WARNING
      ================================================ */}

      <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-600" />

          <div>
            <h3 className="text-sm font-semibold text-red-700">
              Before you continue
            </h3>

            <p className="mt-2 text-xs leading-6 text-red-600">
              Deactivating your account will immediately sign you out and
              prevent you from logging into this patient account again.
            </p>

            <p className="mt-2 text-xs leading-6 text-red-600">
              Your existing appointments, medical records, prescriptions,
              invoices and payment records may remain in the system for record
              purposes.
            </p>
          </div>
        </div>
      </div>

      {/* ===============================================
          ERROR MESSAGE
      ================================================ */}

      {(localError || error) && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaCircleExclamation className="mt-0.5 shrink-0" />

          <span>{localError || error}</span>
        </div>
      )}

      {/* ===============================================
          FORM
      ================================================ */}

      <form onSubmit={handleDeleteAccount} className="mt-6">
        {/* =============================================
            CURRENT PASSWORD
        ============================================== */}

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-700">
            Current Password
            <span className="ml-1 text-red-500">*</span>
          </label>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              autoComplete="current-password"
              disabled={deactivateLoading}
              className="h-10 pr-11"
            />

            {/* PASSWORD SHOW / HIDE */}

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              disabled={deactivateLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* =============================================
            CONFIRMATION
        ============================================== */}

        <div className="mt-5">
          <label className="mb-2 block text-xs font-medium text-slate-700">
            Confirm Account Deactivation
            <span className="ml-1 text-red-500">*</span>
          </label>

          <p className="mb-2 text-xs leading-5 text-slate-500">
            To confirm, type{" "}
            <span className="font-bold text-red-600">DELETE</span> in the field
            below.
          </p>

          <Input
            type="text"
            value={confirmation}
            onChange={handleConfirmationChange}
            placeholder='Type "DELETE"'
            autoComplete="off"
            disabled={deactivateLoading}
            className="h-10"
          />

          {/* CONFIRMATION STATUS */}

          {confirmation && confirmation !== "DELETE" && (
            <p className="mt-2 text-xs text-red-500">
              You must type DELETE exactly.
            </p>
          )}

          {confirmation === "DELETE" && (
            <p className="mt-2 text-xs font-medium text-green-600">
              Confirmation accepted.
            </p>
          )}
        </div>

        {/* =============================================
            SECURITY INFORMATION
        ============================================== */}

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-6 text-slate-500">
            For your security, your current password will be verified before the
            account is deactivated.
          </p>
        </div>

        {/* =============================================
            BUTTON
        ============================================== */}

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={!canDelete || deactivateLoading}
            className="rounded-full bg-red-600 px-6 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deactivateLoading ? (
              <span className="flex items-center gap-2">
                <FaSpinner className="animate-spin" />
                Deactivating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FaTrash />
                Delete Account
              </span>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
