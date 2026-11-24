import React, { useEffect, useRef, useState } from "react";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarDays,
  FaLocationDot,
  FaVenusMars,
  FaCamera,
  FaIdCard,
  FaFloppyDisk,
  FaXmark,
  FaDroplet,
  FaCircleInfo,
  FaUserPlus,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUpload,
  FaShieldHalved,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ==========================================
// CONSTANTS
// ==========================================

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

// ==========================================
// SECTION HEADER
// ==========================================

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="text-base" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>

        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE FORM FIELD
// ==========================================

function FormField({
  label,
  icon: Icon,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={props.name}
        className="text-xs font-semibold text-slate-700"
      >
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        )}

        <Input
          id={props.name}
          required={required}
          {...props}
          className={`h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none focus-visible:border-blue-400 focus-visible:ring-blue-100 ${
            Icon ? "pl-10" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}

// ==========================================
// PASSWORD FIELD
// ==========================================

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>

      <div className="relative">
        <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

        <Input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-sm focus-visible:ring-blue-100"
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// IMAGE UPLOAD
// ==========================================

function ImageUpload({
  image,
  imageFile,
  onImageChange,
  onRemoveImage,
  error,
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const preview = previewUrl || image || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-5 sm:flex-row">
        {/* IMAGE PREVIEW */}
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-4xl text-blue-600 shadow-sm">
          {preview ? (
            <img
              src={preview}
              alt="Patient profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <FaUser />
          )}
        </div>

        {/* UPLOAD CONTROLS */}
        <div className="w-full flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Patient Profile Photo
            </h4>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Upload JPG, PNG or WebP image. Maximum file size: 2 MB.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 rounded-xl border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
            >
              <FaUpload className="text-xs" />
              Choose Image
            </Button>

            {(image || imageFile) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }

                  onRemoveImage();
                }}
                className="gap-2 rounded-xl border-red-100 text-red-500 hover:bg-red-50"
              >
                <FaXmark className="text-xs" />
                Remove
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onImageChange(file);
              }
            }}
            className="hidden"
          />

          {imageFile && (
            <p className="break-all text-xs font-medium text-blue-600">
              Selected: {imageFile.name}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ==========================================
// ACCOUNT STATUS COMPONENT
// EDIT MODE ONLY
// ==========================================

function AccountStatus({ isActive, onChange }) {
  const active = isActive === true;

  return (
    <section>
      <SectionHeader
        icon={FaShieldHalved}
        title="Account Status"
        description="Manage patient account availability"
      />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Patient Account
          </p>

          <p className="text-xs text-slate-500">
            {active
              ? "This patient account is currently active."
              : "This patient account is currently inactive."}
          </p>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* ACCESSIBLE TOGGLE */}
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={active}
            onChange={(event) => onChange(event.target.checked)}
            className="peer sr-only"
            aria-label="Patient account active status"
          />

          <span className="h-7 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-100" />

          <span className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {!active && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <FaCircleInfo className="mt-0.5 shrink-0" />

          <p>
            This account will be marked inactive when you save changes. Access
            restrictions must also be enforced by the backend.
          </p>
        </div>
      )}
    </section>
  );
}

// ==========================================
// MAIN PATIENT FORM DIALOG
// ==========================================

export default function PatientFormDialog({
  open,
  onOpenChange,
  title = "Patient Details",
  formData = {},
  handleInputChange,
  onSubmit,
  submitText = "Save Patient",
  loading = false,
}) {
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");

  const isEditMode =
    /edit|update/i.test(title) || /update|changes/i.test(submitText);

  // ========================================
  // RESET FORM ERRORS WHEN OPENED
  // ========================================

  useEffect(() => {
    if (open) {
      setConfirmPassword("");
      setFormError("");
      setImageError("");
    }
  }, [open]);

  // ========================================
  // IMAGE HANDLERS
  // ========================================

  const handleImageChange = (file) => {
    setImageError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image size must be less than 2 MB.");
      return;
    }

    handleInputChange({
      target: {
        name: "imageFile",
        value: file,
      },
    });
  };

  const handleRemoveImage = () => {
    handleInputChange({
      target: {
        name: "imageFile",
        value: null,
      },
    });

    handleInputChange({
      target: {
        name: "image",
        value: "",
      },
    });
  };

  // ========================================
  // ACCOUNT STATUS HANDLER
  // ========================================

  const handleStatusChange = (checked) => {
    handleInputChange({
      target: {
        name: "isActive",
        value: checked,
      },
    });
  };

  // ========================================
  // SUBMIT HANDLER
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) return;

    setFormError("");

    const password = formData.password || "";

    if (!isEditMode && !password) {
      setFormError("Password is required.");
      return;
    }

    if (password) {
      if (!PASSWORD_REGEX.test(password)) {
        setFormError(
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.",
        );
        return;
      }

      if (password !== confirmPassword) {
        setFormError("Password and confirm password do not match.");
        return;
      }
    }

    if (imageError) {
      setFormError("Please select a valid profile image.");
      return;
    }

    onSubmit?.();
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]">
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {isEditMode ? (
                <FaIdCard className="text-lg" />
              ) : (
                <FaUserPlus className="text-lg" />
              )}
            </div>

            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {title}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs text-slate-500">
                {isEditMode
                  ? "Update patient information and account settings."
                  : "Register a new patient account."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
            {/* PERSONAL INFORMATION */}
            <section>
              <SectionHeader
                icon={FaIdCard}
                title="Personal Information"
                description="Basic patient identity details"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Patient Full Name"
                  name="name"
                  icon={FaUser}
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  placeholder="Enter patient full name"
                  maxLength={100}
                  required
                  className="sm:col-span-2"
                />

                {/* AGE INPUT REMOVED
                    Age is calculated from Date of Birth
                    in AdminPatients.jsx
                */}

                {/* GENDER */}
                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Gender
                  </Label>

                  <div className="relative">
                    <FaVenusMars className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* BLOOD GROUP */}
                <div className="space-y-2">
                  <Label
                    htmlFor="bloodGroup"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Blood Group
                  </Label>

                  <div className="relative">
                    <FaDroplet className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup || ""}
                      onChange={handleInputChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select blood group</option>

                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {/* DATE OF BIRTH */}
                <FormField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  icon={FaCalendarDays}
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </section>

            {/* CONTACT INFORMATION */}
            <section>
              <SectionHeader
                icon={FaPhone}
                title="Contact Information"
                description="Patient communication details"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={FaEnvelope}
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  placeholder="patient@example.com"
                  required
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  icon={FaPhone}
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="+94 77 123 4567"
                  required
                />

                <FormField
                  label="Residential Address"
                  name="address"
                  icon={FaLocationDot}
                  value={
                    typeof formData.address === "string"
                      ? formData.address
                      : formData.address?.addressLine || ""
                  }
                  onChange={handleInputChange}
                  placeholder="Enter patient address"
                  className="sm:col-span-2"
                />
              </div>
            </section>

            {/* ACCOUNT SECURITY */}
            <section>
              <SectionHeader
                icon={FaShieldHalved}
                title="Account Security"
                description={
                  isEditMode
                    ? "Leave password blank to keep the current password"
                    : "Create a secure patient login password"
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  label={isEditMode ? "New Password (Optional)" : "Password"}
                  name="password"
                  value={formData.password || ""}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required={!isEditMode}
                />

                <PasswordField
                  label="Confirm Password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required={!isEditMode}
                />
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                <FaCircleInfo className="mt-0.5 shrink-0" />

                <p>
                  Password must contain at least 8 characters, one uppercase
                  letter, one lowercase letter and one number.
                </p>
              </div>
            </section>

            {/* ACCOUNT STATUS
                ONLY VISIBLE IN EDIT MODE
            */}
            {isEditMode && (
              <AccountStatus
                isActive={formData.isActive}
                onChange={handleStatusChange}
              />
            )}

            {/* APPOINTMENT INFORMATION
                Read-only: last appointment is derived
                from appointment records.
            */}
            {isEditMode && formData.lastAppointment && (
              <section>
                <SectionHeader
                  icon={FaCalendarDays}
                  title="Appointment Information"
                  description="Patient appointment details"
                />

                <FormField
                  label="Last Appointment"
                  name="lastAppointment"
                  type="date"
                  icon={FaCalendarDays}
                  value={
                    /^\d{4}-\d{2}-\d{2}$/.test(formData.lastAppointment)
                      ? formData.lastAppointment
                      : ""
                  }
                  readOnly
                />

                <p className="mt-2 text-xs text-slate-500">
                  Appointment history is managed separately from patient
                  details.
                </p>
              </section>
            )}

            {/* PROFILE IMAGE */}
            <section>
              <SectionHeader
                icon={FaCamera}
                title="Profile Image"
                description="Upload a patient profile photo"
              />

              <ImageUpload
                image={formData.image}
                imageFile={formData.imageFile}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                error={imageError}
              />
            </section>

            {/* FORM ERROR */}
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600"
              >
                {formError}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="gap-2 rounded-xl border-slate-200 px-5"
            >
              <FaXmark className="text-xs" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="gap-2 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              <FaFloppyDisk className="text-sm" />

              {loading ? "Saving..." : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
