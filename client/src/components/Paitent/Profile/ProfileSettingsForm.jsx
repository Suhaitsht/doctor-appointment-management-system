import React, { useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  FaImage,
  FaUpload,
  FaTrash,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  clearAuthError,
  clearAuthMessage,
} from "@/redux/slices/authSlice";

// ======================================================
// EMPTY FORM
// ======================================================

const initialFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  bloodGroup: "",

  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

// ======================================================
// PROFILE SETTINGS FORM
// ======================================================

export default function ProfileSettingsForm() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX AUTH STATE
  // ====================================================

  const {
    user,
    loading,
    updateLoading,
    imageUploadLoading,
    error,
    successMessage,
  } = useSelector((state) => state.auth);

  // ====================================================
  // LOCAL FORM STATE
  // ====================================================

  const [formData, setFormData] = useState(initialFormData);

  // ====================================================
  // PROFILE IMAGE STATE
  // ====================================================

  const [profileImage, setProfileImage] = useState(null);

  const [imageFile, setImageFile] = useState(null);

  const [imageError, setImageError] = useState("");

  // Keep temporary browser preview URL
  const objectUrlRef = useRef(null);

  // Keep file input reference
  const fileInputRef = useRef(null);

  // ====================================================
  // 1. FETCH PROFILE WHEN COMPONENT LOADS
  // ====================================================

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // ====================================================
  // 2. PUT REDUX USER DATA INTO FORM
  // ====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    // --------------------------------------------------
    // FALLBACK FOR OLD ACCOUNTS
    //
    // Example:
    //
    // name: "Akmal Mohamed"
    //
    // If firstName / lastName did not previously exist,
    // use the old name field.
    // --------------------------------------------------

    const nameParts = user.name ? user.name.trim().split(/\s+/) : [];

    const fallbackFirstName = nameParts[0] || "";

    const fallbackLastName = nameParts.slice(1).join(" ");

    // --------------------------------------------------
    // FILL FORM
    // --------------------------------------------------

    setFormData({
      firstName: user.firstName || fallbackFirstName,

      lastName: user.lastName || fallbackLastName,

      dateOfBirth: formatDateForInput(user.dateOfBirth),

      phone: user.phone || "",

      email: user.email || "",

      bloodGroup: user.bloodGroup || "",

      address: user.address?.addressLine || "",

      city: user.address?.city || "",

      state: user.address?.state || "",

      country: user.address?.country || "",

      pincode: user.address?.pincode || "",
    });

    // --------------------------------------------------
    // EXISTING BACKEND PROFILE IMAGE
    //
    // Don't replace the temporary preview while
    // the user is selecting a new photo.
    // --------------------------------------------------

    if (user.image && !imageFile) {
      setProfileImage(getImageUrl(user.image));
    }

    if (!user.image && !imageFile) {
      setProfileImage(null);
    }
  }, [user, imageFile]);

  // ====================================================
  // 3. CLEAN OBJECT URL WHEN COMPONENT UNMOUNTS
  // ====================================================

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);

        objectUrlRef.current = null;
      }
    };
  }, []);

  // ====================================================
  // 4. AUTO CLEAR SUCCESS MESSAGE
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
  // HANDLE NORMAL INPUT CHANGE
  // ====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Remove previous API error
    // when user starts editing again.

    if (error) {
      dispatch(clearAuthError());
    }

    setFormData((previous) => ({
      ...previous,

      [name]: value,
    }));
  };

  // ====================================================
  // HANDLE IMAGE CHANGE
  // ====================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageError("");

    dispatch(clearAuthMessage());

    if (error) {
      dispatch(clearAuthError());
    }

    // --------------------------------------------------
    // ALLOWED TYPES
    //
    // Must match backend Multer middleware.
    // --------------------------------------------------

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPG, JPEG, PNG and WEBP images are allowed.");

      event.target.value = "";

      return;
    }

    // --------------------------------------------------
    // MAXIMUM FILE SIZE = 5 MB
    // --------------------------------------------------

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setImageError("Profile image must be below 5 MB.");

      event.target.value = "";

      return;
    }

    // --------------------------------------------------
    // CLEAN PREVIOUS OBJECT URL
    // --------------------------------------------------

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }

    // --------------------------------------------------
    // CREATE LOCAL PREVIEW
    // --------------------------------------------------

    const previewUrl = URL.createObjectURL(file);

    objectUrlRef.current = previewUrl;

    setImageFile(file);

    setProfileImage(previewUrl);
  };

  // ====================================================
  // UPLOAD PROFILE IMAGE
  // ====================================================

  const handleImageUpload = async () => {
    // ----------------------------------------------
    // MUST SELECT IMAGE FIRST
    // ----------------------------------------------

    if (!imageFile) {
      setImageError("Please select a profile image first.");

      return;
    }

    setImageError("");

    dispatch(clearAuthMessage());

    if (error) {
      dispatch(clearAuthError());
    }

    // ----------------------------------------------
    // CALL REDUX THUNK
    //
    // Redux thunk creates FormData:
    //
    // formData.append("image", imageFile)
    //
    // Then:
    //
    // PUT /api/auth/profile/image
    // ----------------------------------------------

    const result = await dispatch(uploadProfileImage(imageFile));

    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    if (uploadProfileImage.fulfilled.match(result)) {
      console.log("PROFILE IMAGE UPDATED:", result.payload);

      // --------------------------------------------
      // DELETE TEMPORARY PREVIEW
      // --------------------------------------------

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);

        objectUrlRef.current = null;
      }

      // --------------------------------------------
      // CLEAR SELECTED FILE
      // --------------------------------------------

      setImageFile(null);

      // Reset HTML file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // --------------------------------------------
      // SHOW REAL BACKEND IMAGE
      // --------------------------------------------

      const updatedUser = result.payload?.user;

      if (updatedUser?.image) {
        setProfileImage(getImageUrl(updatedUser.image));
      } else {
        setProfileImage(null);
      }
    }
  };

  // ====================================================
  // REMOVE SELECTED IMAGE
  //
  // IMPORTANT:
  //
  // At this stage we do NOT have a backend
  // DELETE profile image endpoint.
  //
  // Therefore this button cancels the newly selected
  // local image and restores the saved database image.
  // ====================================================

  const removeImage = () => {
    // ----------------------------------------------
    // CLEAN LOCAL PREVIEW
    // ----------------------------------------------

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }

    // ----------------------------------------------
    // CLEAR LOCAL FILE
    // ----------------------------------------------

    setImageFile(null);

    setImageError("");

    // ----------------------------------------------
    // RESET FILE INPUT
    // ----------------------------------------------

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // ----------------------------------------------
    // RESTORE SAVED DATABASE IMAGE
    // ----------------------------------------------

    setProfileImage(user?.image ? getImageUrl(user.image) : null);
  };

  // ====================================================
  // CANCEL
  //
  // Restore latest Redux / DB profile data.
  // Do NOT empty the form.
  // ====================================================

  const handleCancel = () => {
    if (!user) {
      return;
    }

    // --------------------------------------------------
    // NAME FALLBACK
    // --------------------------------------------------

    const nameParts = user.name ? user.name.trim().split(/\s+/) : [];

    const fallbackFirstName = nameParts[0] || "";

    const fallbackLastName = nameParts.slice(1).join(" ");

    // --------------------------------------------------
    // RESTORE FORM
    // --------------------------------------------------

    setFormData({
      firstName: user.firstName || fallbackFirstName,

      lastName: user.lastName || fallbackLastName,

      dateOfBirth: formatDateForInput(user.dateOfBirth),

      phone: user.phone || "",

      email: user.email || "",

      bloodGroup: user.bloodGroup || "",

      address: user.address?.addressLine || "",

      city: user.address?.city || "",

      state: user.address?.state || "",

      country: user.address?.country || "",

      pincode: user.address?.pincode || "",
    });

    // --------------------------------------------------
    // RESET IMAGE PREVIEW
    // --------------------------------------------------

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }

    setImageFile(null);

    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setProfileImage(user.image ? getImageUrl(user.image) : null);

    dispatch(clearAuthMessage());

    if (error) {
      dispatch(clearAuthError());
    }
  };

  // ====================================================
  // SAVE PROFILE INFORMATION
  // ====================================================

  const handleSave = async () => {
    dispatch(clearAuthMessage());

    if (error) {
      dispatch(clearAuthError());
    }

    // --------------------------------------------------
    // FRONTEND VALIDATION
    // --------------------------------------------------

    if (!formData.firstName.trim()) {
      alert("First name is required");

      return;
    }

    if (!formData.lastName.trim()) {
      alert("Last name is required");

      return;
    }

    if (!formData.phone.trim()) {
      alert("Phone number is required");

      return;
    }

    // --------------------------------------------------
    // DATE OF BIRTH VALIDATION
    // --------------------------------------------------

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);

      const today = new Date();

      if (Number.isNaN(dob.getTime())) {
        alert("Invalid date of birth");

        return;
      }

      if (dob > today) {
        alert("Date of birth cannot be in the future");

        return;
      }
    }

    // --------------------------------------------------
    // BUILD BACKEND PAYLOAD
    //
    // Frontend:
    //
    // address
    // city
    // state
    //
    // Backend:
    //
    // address: {
    //   addressLine,
    //   city,
    //   state,
    //   country,
    //   pincode
    // }
    // --------------------------------------------------

    const profileData = {
      firstName: formData.firstName.trim(),

      lastName: formData.lastName.trim(),

      phone: formData.phone.trim(),

      dateOfBirth: formData.dateOfBirth || null,

      bloodGroup: formData.bloodGroup,

      address: {
        addressLine: formData.address.trim(),

        city: formData.city.trim(),

        state: formData.state.trim(),

        country: formData.country.trim(),

        pincode: formData.pincode.trim(),
      },
    };

    // --------------------------------------------------
    // DO NOT SEND EMAIL
    //
    // Email is read-only in current backend.
    // --------------------------------------------------

    const result = await dispatch(updateProfile(profileData));

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    if (updateProfile.fulfilled.match(result)) {
      console.log("PROFILE UPDATED:", result.payload);
    }
  };

  // ====================================================
  // INITIAL LOADING
  // ====================================================

  if (loading && !user) {
    return (
      <Card className="border-slate-200 p-5 shadow-sm md:p-6">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <FaSpinner className="mx-auto animate-spin text-2xl text-blue-600" />

            <p className="mt-3 text-sm text-slate-500">Loading profile...</p>
          </div>
        </div>
      </Card>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <Card className="border-slate-200 p-5 shadow-sm md:p-6">
      {/* ===============================================
          HEADING
      ================================================ */}

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Profile Settings
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Update your personal information, address and profile photo.
        </p>
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
          API ERROR MESSAGE
      ================================================ */}

      {error && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaCircleExclamation className="shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* ===============================================
          PROFILE PHOTO
      ================================================ */}

      <section className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Profile Photo
        </h3>

        <Card className="border-slate-200 p-4 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* =========================================
                IMAGE PREVIEW
            ========================================== */}

            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaImage className="text-2xl text-slate-300" />
              )}
            </div>

            {/* =========================================
                IMAGE CONTROLS
            ========================================== */}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* UPLOAD NEW */}

                <label
                  className={`flex items-center gap-1 font-medium ${
                    imageUploadLoading
                      ? "cursor-not-allowed text-slate-400"
                      : "cursor-pointer text-blue-600 hover:text-blue-700"
                  }`}
                >
                  <FaUpload />
                  Upload New
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={imageUploadLoading}
                  />
                </label>

                {/* REMOVE SELECTED PHOTO */}

                <button
                  type="button"
                  onClick={removeImage}
                  disabled={!imageFile || imageUploadLoading}
                  className="flex items-center gap-1 font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaTrash />
                  Remove
                </button>
              </div>

              {/* FILE RULES */}

              <p className="mt-2 text-xs text-slate-400">
                Your image should be below 5 MB. Accepted formats: JPG, PNG,
                WEBP.
              </p>

              {/* IMAGE ERROR */}

              {imageError && (
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
                  <FaCircleExclamation />

                  {imageError}
                </p>
              )}

              {/* SELECTED IMAGE */}

              {imageFile && (
                <div className="mt-3">
                  <p className="mb-3 max-w-md truncate text-xs text-slate-500">
                    Selected:{" "}
                    <span className="font-medium text-slate-700">
                      {imageFile.name}
                    </span>
                  </p>

                  {/* SAVE PROFILE PHOTO */}

                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={imageUploadLoading}
                    className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {imageUploadLoading ? (
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FaUpload />
                        Save Profile Photo
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ===============================================
          INFORMATION
      ================================================ */}

      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Information
        </h3>

        <Card className="border-slate-200 p-4 shadow-none">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* FIRST NAME */}

            <Field
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            {/* LAST NAME */}

            <Field
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            {/* DATE OF BIRTH */}

            <Field
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={getTodayDate()}
            />

            {/* PHONE */}

            <Field
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-700">
                Email Address
              </label>

              <Input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="h-10 cursor-not-allowed bg-slate-100 text-slate-500"
              />

              <p className="mt-1 text-[11px] text-slate-400">
                Email cannot be changed from profile settings.
              </p>
            </div>

            {/* BLOOD GROUP */}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-700">
                Blood Group
              </label>

              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="">Select</option>

                <option value="A+">A+</option>

                <option value="A-">A-</option>

                <option value="B+">B+</option>

                <option value="B-">B-</option>

                <option value="AB+">AB+</option>

                <option value="AB-">AB-</option>

                <option value="O+">O+</option>

                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </Card>
      </section>

      {/* ===============================================
          ADDRESS
      ================================================ */}

      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Address</h3>

        <Card className="border-slate-200 p-4 shadow-none">
          {/* ADDRESS LINE */}

          <Field
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />

          {/* CITY / STATE */}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />

            <Field
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          {/* COUNTRY / PINCODE */}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />

            <Field
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
          </div>
        </Card>
      </section>

      {/* ===============================================
          PROFILE BUTTONS
      ================================================ */}

      <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        {/* CANCEL */}

        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={updateLoading || imageUploadLoading}
          className="rounded-full px-6"
        >
          Cancel
        </Button>

        {/* SAVE PROFILE INFORMATION */}

        <Button
          type="button"
          onClick={handleSave}
          disabled={updateLoading || imageUploadLoading}
          className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateLoading ? (
            <span className="flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </Card>
  );
}

// ======================================================
// REUSABLE FIELD
// ======================================================

function Field({ label, required = false, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-700">
        {label}

        {required && <span className="text-red-500"> *</span>}
      </label>

      <Input {...props} className="h-10" />
    </div>
  );
}

// ======================================================
// FORMAT DATABASE DATE -> HTML DATE INPUT
//
// MongoDB:
// 2000-05-15T00:00:00.000Z
//
// Input:
// 2000-05-15
// ======================================================

function formatDateForInput(date) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
}

// ======================================================
// TODAY FOR MAX DOB
// ======================================================

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// ======================================================
// PROFILE IMAGE URL
//
// Database:
// /uploads/profiles/profile-123.jpg
//
// Browser:
// http://localhost:5000/uploads/profiles/profile-123.jpg
//
// Full URL / blob / data URLs are returned directly.
// ======================================================

function getImageUrl(image) {
  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `http://localhost:5000${image}`;
}
