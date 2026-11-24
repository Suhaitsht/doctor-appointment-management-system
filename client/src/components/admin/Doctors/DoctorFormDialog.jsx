import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaUserDoctor,
  FaGraduationCap,
  FaBriefcase,
  FaImage,
  FaUpload,
} from "react-icons/fa6";

import { toast } from "sonner";

import { fetchPublicSpecialities } from "@/redux/slices/specialitySlice";

// ======================================================
// BACKEND URL
// ======================================================

// .env example:
// VITE_API_URL=http://localhost:5000/api

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

// ======================================================
// IMAGE URL HELPER
// ======================================================

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  // Newly selected file preview
  if (image.startsWith?.("blob:")) {
    return image;
  }

  // Already full URL
  if (image.startsWith?.("http://") || image.startsWith?.("https://")) {
    return image;
  }

  // Backend relative path
  return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

// ======================================================
// DATE HELPER
// ======================================================

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  // Already YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

// ======================================================
// DOCTOR FORM DIALOG
// ======================================================

export default function DoctorFormDialog({
  open,
  onOpenChange,

  title,
  description,

  formData,

  handleInputChange,
  handleImageChange,

  handleExperienceChange,
  handleAddExperience,
  handleRemoveExperience,

  handleEducationChange,
  handleAddEducation,
  handleRemoveEducation,

  onSubmit,

  submitText = "Save",
  loading = false,
  isEdit = false,
}) {
  // ====================================================
  // REDUX
  // ====================================================

  const dispatch = useDispatch();

  const specialityState = useSelector((state) => state.specialities);

  const publicSpecialities = specialityState?.publicSpecialities || [];

  // Supports either publicLoading or loading
  const specialitiesLoading =
    specialityState?.publicLoading ?? specialityState?.loading ?? false;

  // ====================================================
  // PASSWORD
  // ====================================================

  const [showPassword, setShowPassword] = useState(false);

  // ====================================================
  // IMAGE PREVIEW
  // ====================================================

  const [preview, setPreview] = useState("");

  // ====================================================
  // FETCH SPECIALITIES
  // ====================================================

  useEffect(() => {
    if (open && publicSpecialities.length === 0) {
      dispatch(fetchPublicSpecialities());
    }
  }, [dispatch, open, publicSpecialities.length]);

  // ====================================================
  // DOCTOR IMAGE PREVIEW
  // ====================================================

  useEffect(() => {
    // Existing backend image
    if (!formData?.image) {
      setPreview(formData?.imagePreview || "");

      return;
    }

    // Newly selected image
    if (formData.image instanceof File) {
      const objectUrl = URL.createObjectURL(formData.image);

      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    // Image string
    if (typeof formData.image === "string") {
      setPreview(formData.image);
    }
  }, [formData?.image, formData?.imagePreview]);

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    // Basic speciality validation
    if (!formData?.speciality) {
      toast.error("Please select a speciality.");

      return;
    }

    onSubmit();
  };

  // ====================================================
  // CLOSE
  // ====================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    setShowPassword(false);

    onOpenChange(false);
  };

  // ====================================================
  // IMAGE CHANGE
  // ====================================================

  const onImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Allowed types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG or WEBP image.");

      e.target.value = "";

      return;
    }

    // Max 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Profile image must be smaller than 5MB.");

      e.target.value = "";

      return;
    }

    if (handleImageChange) {
      handleImageChange(e);
    }
  };

  // ====================================================
  // SPECIALITY CHANGE
  // ====================================================

  const handleSpecialityChange = (value) => {
    // Makes shadcn Select compatible
    // with the existing input handler.
    handleInputChange({
      target: {
        name: "speciality",
        value,
        type: "select",
      },
    });
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (loading) {
          return;
        }

        if (!value) {
          setShowPassword(false);
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FaUserDoctor className="text-blue-600" />

            {title}
          </DialogTitle>

          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ============================================= */}
        {/* FORM */}
        {/* ============================================= */}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* =========================================== */}
          {/* BASIC INFORMATION */}
          {/* =========================================== */}

          <section className="rounded-xl border bg-white p-5">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                Basic Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter the doctor's account and professional information.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* ======================================= */}
              {/* NAME */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Doctor Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Input
                  id="doctor-name"
                  type="text"
                  name="name"
                  value={formData?.name || ""}
                  onChange={handleInputChange}
                  placeholder="Dr. Mohamed Rizwan"
                  disabled={loading}
                  required
                />
              </div>

              {/* ======================================= */}
              {/* EMAIL */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Input
                  id="doctor-email"
                  type="email"
                  name="email"
                  value={formData?.email || ""}
                  onChange={handleInputChange}
                  placeholder="rizwan.doctor@example.com"
                  disabled={loading}
                  required
                />
              </div>

              {/* ======================================= */}
              {/* PHONE */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-phone"
                  className="text-sm font-medium text-slate-700"
                >
                  Phone
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Input
                  id="doctor-phone"
                  type="tel"
                  name="phone"
                  value={formData?.phone || ""}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                  disabled={loading}
                  required
                />
              </div>

              {/* ======================================= */}
              {/* PASSWORD */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                  {!isEdit && <span className="ml-1 text-red-500">*</span>}
                </label>

                <div className="relative">
                  <Input
                    id="doctor-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData?.password || ""}
                    onChange={handleInputChange}
                    placeholder={
                      isEdit
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    disabled={loading}
                    className="pr-11"
                    autoComplete="new-password"
                    required={!isEdit}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={loading}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                      transition
                      hover:text-slate-700
                    "
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {isEdit && (
                  <p className="text-xs text-slate-400">
                    Leave blank if you don't want to change the password.
                  </p>
                )}
              </div>

              {/* ======================================= */}
              {/* SPECIALITY - BACKEND DROPDOWN */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-speciality"
                  className="text-sm font-medium text-slate-700"
                >
                  Speciality
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <Select
                  value={formData?.speciality || ""}
                  onValueChange={handleSpecialityChange}
                  disabled={loading || specialitiesLoading}
                >
                  <SelectTrigger id="doctor-speciality" className="w-full">
                    <SelectValue
                      placeholder={
                        specialitiesLoading
                          ? "Loading specialities..."
                          : "Select speciality"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {publicSpecialities.map((speciality) => (
                      <SelectItem key={speciality._id} value={speciality.name}>
                        <div className="flex items-center gap-2">
                          {speciality.image && (
                            <img
                              src={getImageUrl(speciality.image)}
                              alt=""
                              className="h-6 w-6 rounded-md object-cover"
                            />
                          )}

                          <span>{speciality.name}</span>
                        </div>
                      </SelectItem>
                    ))}

                    {!specialitiesLoading &&
                      publicSpecialities.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-slate-400">
                          No active specialities available.
                        </div>
                      )}
                  </SelectContent>
                </Select>

                {specialitiesLoading && (
                  <p className="text-xs text-slate-400">
                    Loading specialities...
                  </p>
                )}

                {!specialitiesLoading && publicSpecialities.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Please create an active speciality before adding a doctor.
                  </p>
                )}
              </div>

              {/* ======================================= */}
              {/* HOSPITAL */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="doctor-hospital"
                  className="text-sm font-medium text-slate-700"
                >
                  Hospital
                </label>

                <Input
                  id="doctor-hospital"
                  type="text"
                  name="hospital"
                  value={formData?.hospital || ""}
                  onChange={handleInputChange}
                  placeholder="Jayanthi Medical Centre"
                  disabled={loading}
                />
              </div>

              {/* ======================================= */}
              {/* CONSULTATION FEE */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="consultation-fee"
                  className="text-sm font-medium text-slate-700"
                >
                  Consultation Fee (LKR)
                </label>

                <Input
                  id="consultation-fee"
                  type="number"
                  name="consultationFee"
                  value={formData?.consultationFee ?? ""}
                  onChange={handleInputChange}
                  placeholder="2500"
                  min="0"
                  step="1"
                  disabled={loading}
                />
              </div>

              {/* ======================================= */}
              {/* MEMBER SINCE */}
              {/* ======================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="member-since"
                  className="text-sm font-medium text-slate-700"
                >
                  Member Since
                </label>

                <Input
                  id="member-since"
                  type="date"
                  name="memberSince"
                  value={formatDateForInput(formData?.memberSince)}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              {/* ======================================= */}
              {/* PROFILE IMAGE */}
              {/* ======================================= */}

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="doctor-image"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <FaImage />
                  Profile Image
                </label>

                <label
                  htmlFor="doctor-image"
                  className="
                    flex
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border-2
                    border-dashed
                    border-slate-300
                    bg-slate-50
                    px-6
                    py-8
                    text-center
                    transition
                    hover:border-blue-400
                    hover:bg-blue-50
                  "
                >
                  <FaUpload className="mb-3 text-2xl text-blue-500" />

                  <p className="text-sm font-medium text-slate-700">
                    {isEdit
                      ? "Click to change profile image"
                      : "Click to upload profile image"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG or WEBP — Maximum 5MB
                  </p>

                  <Input
                    id="doctor-image"
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* ======================================= */}
              {/* ACCOUNT STATUS */}
              {/* ======================================= */}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Account Status
                </label>

                <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                  <input
                    id="doctor-status"
                    type="checkbox"
                    name="status"
                    checked={Boolean(formData?.status)}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-4 w-4 cursor-pointer"
                  />

                  <label
                    htmlFor="doctor-status"
                    className="cursor-pointer text-sm text-slate-600"
                  >
                    {formData?.status ? "Active" : "Inactive"}
                  </label>
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* IMAGE PREVIEW */}
            {/* ========================================= */}

            {preview && (
              <div className="mt-6 rounded-xl border bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Profile Preview
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(preview)}
                    alt="Doctor profile preview"
                    className="
                      h-24
                      w-24
                      rounded-full
                      border
                      border-slate-200
                      bg-white
                      object-cover
                      shadow-sm
                    "
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {formData?.image instanceof File
                        ? formData.image.name
                        : "Current profile image"}
                    </p>

                    {formData?.image instanceof File && (
                      <p className="mt-1 text-xs text-slate-400">
                        {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}

                    {isEdit && !formData?.image && (
                      <p className="mt-1 text-xs text-slate-400">
                        Select another image above to replace this profile
                        image.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* =========================================== */}
          {/* EXPERIENCE */}
          {/* =========================================== */}

          <section className="rounded-xl border bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <FaBriefcase className="text-blue-600" />
                  Experience
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add the doctor's previous or current professional experience.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddExperience}
                disabled={loading}
                className="gap-2"
              >
                <FaPlus />
                Add Experience
              </Button>
            </div>

            <div className="space-y-5">
              {formData?.experiences?.map((experience, index) => (
                <div
                  key={experience.id || experience._id || index}
                  className="rounded-xl border bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">
                      Experience {index + 1}
                    </h4>

                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(index)}
                      disabled={loading}
                      className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          text-red-500
                          transition
                          hover:bg-red-50
                          disabled:opacity-50
                        "
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* HOSPITAL */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Hospital
                      </label>

                      <Input
                        type="text"
                        name="hospital"
                        value={experience.hospital || ""}
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="National Hospital"
                        disabled={loading}
                      />
                    </div>

                    {/* YEARS */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Years of Experience
                      </label>

                      <Input
                        type="number"
                        name="yearsOfExperience"
                        value={experience.yearsOfExperience ?? ""}
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="5"
                        min="0"
                        disabled={loading}
                      />
                    </div>

                    {/* START DATE */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Start Date
                      </label>

                      <Input
                        type="date"
                        name="startDate"
                        value={formatDateForInput(experience.startDate)}
                        onChange={(e) => handleExperienceChange(index, e)}
                        disabled={loading}
                      />
                    </div>

                    {/* END DATE */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        End Date
                      </label>

                      <Input
                        type="date"
                        name="endDate"
                        value={formatDateForInput(experience.endDate)}
                        onChange={(e) => handleExperienceChange(index, e)}
                        disabled={loading}
                      />
                    </div>

                    {/* DESCRIPTION */}

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Job Description
                      </label>

                      <textarea
                        name="jobDescription"
                        value={experience.jobDescription || ""}
                        onChange={(e) => handleExperienceChange(index, e)}
                        placeholder="Describe the doctor's responsibilities..."
                        rows={3}
                        disabled={loading}
                        className="
                            w-full
                            resize-none
                            rounded-md
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
                            text-sm
                            outline-none
                            transition
                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData?.experiences ||
                formData.experiences.length === 0) && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <FaBriefcase className="mx-auto mb-2 text-xl text-slate-300" />

                  <p className="text-sm text-slate-400">No experience added.</p>
                </div>
              )}
            </div>
          </section>

          {/* =========================================== */}
          {/* EDUCATION */}
          {/* =========================================== */}

          <section className="rounded-xl border bg-white p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <FaGraduationCap className="text-blue-600" />
                  Education
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add the doctor's academic and professional qualifications.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddEducation}
                disabled={loading}
                className="gap-2"
              >
                <FaPlus />
                Add Education
              </Button>
            </div>

            <div className="space-y-5">
              {formData?.education?.map((education, index) => (
                <div
                  key={education.id || education._id || index}
                  className="rounded-xl border bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">
                      Education {index + 1}
                    </h4>

                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      disabled={loading}
                      className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          text-red-500
                          transition
                          hover:bg-red-50
                          disabled:opacity-50
                        "
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* INSTITUTION */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Institution Name
                      </label>

                      <Input
                        type="text"
                        name="institutionName"
                        value={education.institutionName || ""}
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="University of Colombo"
                        disabled={loading}
                      />
                    </div>

                    {/* COURSE */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Course / Degree
                      </label>

                      <Input
                        type="text"
                        name="course"
                        value={education.course || ""}
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="MBBS"
                        disabled={loading}
                      />
                    </div>

                    {/* START DATE */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Start Date
                      </label>

                      <Input
                        type="date"
                        name="startDate"
                        value={formatDateForInput(education.startDate)}
                        onChange={(e) => handleEducationChange(index, e)}
                        disabled={loading}
                      />
                    </div>

                    {/* END DATE */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        End Date
                      </label>

                      <Input
                        type="date"
                        name="endDate"
                        value={formatDateForInput(education.endDate)}
                        onChange={(e) => handleEducationChange(index, e)}
                        disabled={loading}
                      />
                    </div>

                    {/* NUMBER OF YEARS */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Number of Years
                      </label>

                      <Input
                        type="number"
                        name="numberOfYears"
                        value={education.numberOfYears ?? ""}
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="5"
                        min="0"
                        disabled={loading}
                      />
                    </div>

                    {/* LOGO */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Institution Logo URL
                      </label>

                      <Input
                        type="text"
                        name="logo"
                        value={education.logo || ""}
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="https://example.com/logo.png"
                        disabled={loading}
                      />
                    </div>

                    {/* DESCRIPTION */}

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Description
                      </label>

                      <textarea
                        name="description"
                        value={education.description || ""}
                        onChange={(e) => handleEducationChange(index, e)}
                        placeholder="Additional details about this qualification..."
                        rows={3}
                        disabled={loading}
                        className="
                            w-full
                            resize-none
                            rounded-md
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
                            text-sm
                            outline-none
                            transition
                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!formData?.education || formData.education.length === 0) && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <FaGraduationCap className="mx-auto mb-2 text-xl text-slate-300" />

                  <p className="text-sm text-slate-400">No education added.</p>
                </div>
              )}
            </div>
          </section>

          {/* =========================================== */}
          {/* FOOTER */}
          {/* =========================================== */}

          <DialogFooter className="border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading || specialitiesLoading || !formData?.speciality}
              className="min-w-[140px] bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (isEdit ? "Updating..." : "Creating...") : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
