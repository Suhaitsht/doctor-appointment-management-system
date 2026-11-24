import { useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FaImage, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  updateMyDoctorProfile,
  selectMyDoctorProfile,
  selectMyDoctorProfileUpdating,
  selectMyDoctorProfileError,
  clearMyDoctorProfileError,
  clearMyDoctorProfileSuccess,
} from "@/redux/slices/doctorSlice";

// Change this only if your backend runs on another origin.
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const EMPTY_PROFILE = {
  firstName: "",
  lastName: "",
  displayName: "",
  designation: "",
  phone: "",
  email: "",
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
};

const mapMemberships = (items = []) =>
  items.map((item, index) => ({
    id: item._id || `membership-${index}`,
    title: item.title || "",
    description: item.description || "",
  }));

export default function BasicDetails({ profileData }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const generatedId = useId();

  const reduxProfile = useSelector(selectMyDoctorProfile);
  const updating = useSelector(selectMyDoctorProfileUpdating);
  const apiError = useSelector(selectMyDoctorProfileError);

  // Supports the profileData prop from DoctorProfileSettings.
  const savedProfile = profileData || reduxProfile;

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState("");
  const [memberships, setMemberships] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ====================================================
  // LOAD PROFILE FROM REDUX / PARENT PROP
  // ====================================================

  useEffect(() => {
    if (!savedProfile) return;

    setProfile({
      firstName: savedProfile.firstName || "",
      lastName: savedProfile.lastName || "",
      displayName: savedProfile.displayName || "",
      designation: savedProfile.designation || "",
      phone: savedProfile.phone || "",
      email: savedProfile.email || "",
    });

    setLanguages(savedProfile.languages || []);
    setMemberships(mapMemberships(savedProfile.memberships || []));

    setImageFile(null);
    setRemoveImage(false);
    setImagePreview("");

    setLanguage("");
    setValidationError("");
  }, [savedProfile]);

  // Revoke object URLs when they are replaced or unmounted.
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ====================================================
  // PROFILE INPUT CHANGE
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setValidationError("");
    setSuccessMessage("");
  };

  // ====================================================
  // IMAGE UPLOAD
  // ====================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setValidationError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setValidationError("Image size must be below 4 MB.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);

    setValidationError("");
    setSuccessMessage("");
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSuccessMessage("");
  };

  const displayedImage = removeImage
    ? ""
    : imagePreview || getImageUrl(savedProfile?.image);

  // ====================================================
  // LANGUAGES
  // ====================================================

  const addLanguage = () => {
    const value = language.trim();

    if (!value) return;

    const alreadyExists = languages.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );

    if (alreadyExists) {
      setValidationError("This language is already added.");
      return;
    }

    setLanguages((prev) => [...prev, value]);
    setLanguage("");

    setValidationError("");
    setSuccessMessage("");
  };

  const removeLanguage = (item) => {
    setLanguages((prev) => prev.filter((value) => value !== item));

    setSuccessMessage("");
  };

  // ====================================================
  // MEMBERSHIPS
  // ====================================================

  const addMembership = () => {
    setMemberships((prev) => [
      ...prev,
      {
        id: `${generatedId}-${Date.now()}-${prev.length}`,
        title: "",
        description: "",
      },
    ]);

    setSuccessMessage("");
  };

  const updateMembership = (id, field, value) => {
    setMemberships((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

    setSuccessMessage("");
  };

  const removeMembership = (id) => {
    setMemberships((prev) => prev.filter((item) => item.id !== id));

    setSuccessMessage("");
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateForm = () => {
    if (
      !profile.firstName.trim() ||
      !profile.lastName.trim() ||
      !profile.email.trim()
    ) {
      return "First Name, Last Name and Email are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(profile.email.trim())) {
      return "Please enter a valid email address.";
    }

    const invalidMembership = memberships.some(
      (item) => !item.title.trim() && item.description.trim(),
    );

    if (invalidMembership) {
      return "Membership title is required when description is provided.";
    }

    return "";
  };

  // ====================================================
  // CANCEL / RESET
  // ====================================================

  const handleCancel = () => {
    if (!savedProfile) return;

    setProfile({
      firstName: savedProfile.firstName || "",
      lastName: savedProfile.lastName || "",
      displayName: savedProfile.displayName || "",
      designation: savedProfile.designation || "",
      phone: savedProfile.phone || "",
      email: savedProfile.email || "",
    });

    setLanguages(savedProfile.languages || []);
    setMemberships(mapMemberships(savedProfile.memberships || []));

    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setLanguage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setValidationError("");
    setSuccessMessage("");
    dispatch(clearMyDoctorProfileError());
    dispatch(clearMyDoctorProfileSuccess());
  };

  // ====================================================
  // SAVE TO MONGODB THROUGH REDUX
  // ====================================================

  const handleSave = async () => {
    setValidationError("");
    setSuccessMessage("");

    const error = validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    const cleanedMemberships = memberships
      .filter((item) => item.title.trim() || item.description.trim())
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      }));

    const payload = {
      profile: {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        displayName: profile.displayName.trim(),
        designation: profile.designation.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
      },
      languages,
      memberships: cleanedMemberships,
    };

    try {
      let requestPayload = payload;

      // Multipart only for file uploads or image removal.
      if (imageFile || removeImage) {
        const formData = new FormData();

        formData.append("profile", JSON.stringify(payload.profile));

        formData.append("languages", JSON.stringify(payload.languages));

        formData.append("memberships", JSON.stringify(payload.memberships));

        if (imageFile) {
          formData.append("image", imageFile);
        }

        if (removeImage) {
          formData.append("removeImage", "true");
        }

        requestPayload = formData;
      }

      await dispatch(updateMyDoctorProfile(requestPayload)).unwrap();

      setImageFile(null);
      setImagePreview("");
      setRemoveImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage("Profile details updated successfully.");
    } catch (error) {
      setValidationError(
        typeof error === "string"
          ? error
          : error?.message || "Failed to save profile.",
      );
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="mt-6">
      {/* Feedback */}
      {(validationError || apiError) && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {validationError || apiError}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {/* ================================================= */}
      {/* PROFILE IMAGE */}
      {/* ================================================= */}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Profile</h2>

        <Card className="border-slate-200 p-5 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
              {displayedImage ? (
                <img
                  src={displayedImage}
                  alt="Doctor profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaImage className="text-2xl" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Profile Image
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="mt-2 flex gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updating}
                  className="font-medium text-blue-600 disabled:opacity-50"
                >
                  Upload New
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={updating || (!displayedImage && !imageFile)}
                  className="font-medium text-red-500 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Your image should be below 4 MB. Accepted formats: JPG, PNG,
                WEBP.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ================================================= */}
      {/* INFORMATION */}
      {/* ================================================= */}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Information
        </h2>

        <Card className="border-slate-200 p-5 shadow-none">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="First Name"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              required
            />

            <Field
              label="Last Name"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              required
            />

            <Field
              label="Display Name"
              name="displayName"
              value={profile.displayName}
              onChange={handleChange}
            />

            <Field
              label="Designation"
              name="designation"
              value={profile.designation}
              onChange={handleChange}
            />

            <Field
              label="Phone Number"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleChange}
            />

            <Field
              label="Email Address"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Known Languages */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-slate-700">
              Known Languages
            </label>

            <div className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap gap-2">
                {languages.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs"
                  >
                    {item}

                    <button
                      type="button"
                      onClick={() => removeLanguage(item)}
                      aria-label={`Remove ${item}`}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <FaXmark />
                    </button>
                  </div>
                ))}

                {languages.length === 0 && (
                  <p className="text-xs text-slate-400">
                    No languages added yet.
                  </p>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLanguage();
                    }
                  }}
                  placeholder="Type new language"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={addLanguage}
                  aria-label="Add language"
                >
                  <FaPlus />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ================================================= */}
      {/* MEMBERSHIPS */}
      {/* ================================================= */}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Memberships
        </h2>

        <Card className="border-slate-200 p-5 shadow-none">
          <div className="space-y-4">
            {memberships.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
              >
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(e) =>
                    updateMembership(item.id, "title", e.target.value)
                  }
                />

                <Field
                  label="About Membership"
                  value={item.description}
                  onChange={(e) =>
                    updateMembership(item.id, "description", e.target.value)
                  }
                />

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeMembership(item.id)}
                    disabled={updating}
                    aria-label="Remove membership"
                    className="text-red-500"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </div>
            ))}

            {memberships.length === 0 && (
              <p className="text-sm text-slate-400">
                No memberships added yet.
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={addMembership}
              disabled={updating}
              className="text-blue-600"
            >
              <FaPlus className="mr-2" />
              Add New
            </Button>
          </div>
        </Card>
      </section>

      {/* ================================================= */}
      {/* ACTION BUTTONS */}
      {/* ================================================= */}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={updating}
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={updating || !savedProfile}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {updating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ======================================================
// REUSABLE INPUT FIELD
// ======================================================

function Field({ label, required = false, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <Input {...props} />
    </div>
  );
}
