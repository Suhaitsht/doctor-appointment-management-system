import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { uploadProfileImage } from "@/redux/slices/authSlice";

import { Loader2, Upload, AlertCircle, UserRound, X } from "lucide-react";

// ==========================================
// CONFIGURATION
// ==========================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_ORIGIN = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  addressLine: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (
    /^https?:\/\//i.test(image) ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${API_ORIGIN}/${String(image).replace(/^\/+/, "")}`;
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.message ||
    error?.response?.data?.message ||
    "Unable to update profile."
  );
};

// ==========================================
// FORM DATA MAPPER
// ==========================================

const createFormData = (profile) => {
  const address =
    profile?.rawAddress && typeof profile.rawAddress === "object"
      ? profile.rawAddress
      : profile?.address && typeof profile.address === "object"
        ? profile.address
        : {};

  return {
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || profile?.mobile || "",
    dateOfBirth: profile?.dateOfBirth
      ? String(profile.dateOfBirth).slice(0, 10)
      : "",
    addressLine:
      address.addressLine ||
      (typeof profile?.address === "string" && !profile?.rawAddress
        ? profile.address
        : ""),
    city: address.city || "",
    state: address.state || "",
    country: address.country || "",
    pincode: address.pincode || "",
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  setProfile,
  updating = false,
}) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSubmitting = saving || updating;

  // ==========================================
  // INITIALIZE FORM ON OPEN
  // ==========================================

  useEffect(() => {
    if (!open) return;

    setFormData(createFormData(profile));
    setSelectedImage(null);
    setError("");
  }, [open]);

  // ==========================================
  // IMAGE PREVIEW + CLEANUP
  // ==========================================

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(selectedImage);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  // ==========================================
  // IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setError("");
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Name is required.";
    }

    if (formData.name.trim().length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (!formData.phone.trim()) {
      return "Phone number is required.";
    }

    if (!/^\+?[0-9\s-]{9,16}$/.test(formData.phone.trim())) {
      return "Please enter a valid phone number.";
    }

    if (formData.dateOfBirth) {
      const dob = new Date(`${formData.dateOfBirth}T00:00:00`);

      if (Number.isNaN(dob.getTime()) || dob > new Date()) {
        return "Please enter a valid date of birth.";
      }
    }

    return "";
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || null,

        address: {
          addressLine: formData.addressLine.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
        },
      };

      // Update profile using the parent callback.
      // Parent must dispatch updateProfile().unwrap().
      await setProfile(payload);

      // Upload image through existing authSlice.
      if (selectedImage) {
        await dispatch(uploadProfileImage(selectedImage)).unwrap();
      }

      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Admin Profile
          </DialogTitle>

          <DialogDescription>
            Update your personal details and profile image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {/* PROFILE IMAGE */}
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Profile Image</Label>

              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {imagePreview || profile?.image ? (
                    <img
                      src={imagePreview || getImageUrl(profile.image)}
                      alt="Admin profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-9 w-9 text-slate-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="admin-image-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </Label>

                  <Input
                    id="admin-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />

                  {selectedImage && (
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs text-red-600"
                    >
                      <X className="h-3 w-3" />
                      Remove selection
                    </button>
                  )}

                  <p className="text-xs text-slate-500">
                    JPG, PNG or WebP. Maximum 2 MB.
                  </p>
                </div>
              </div>
            </div>

            {/* NAME */}
            <Field
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />

            {/* EMAIL */}
            <Field
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              disabled
            />

            {/* PHONE */}
            <Field
              label="Mobile Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />

            {/* DATE OF BIRTH */}
            <Field
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={isSubmitting}
              max={new Date().toISOString().slice(0, 10)}
            />

            {/* ADDRESS LINE */}
            <div className="sm:col-span-2">
              <Field
                label="Address Line"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            {/* CITY */}
            <Field
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            {/* STATE */}
            <Field
              label="State / Province"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            {/* COUNTRY */}
            <Field
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            {/* PINCODE */}
            <Field
              label="Postal Code"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FOOTER */}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// REUSABLE INPUT FIELD
// ==========================================

function Field({ label, name, ...props }) {
  return (
    <div>
      <Label htmlFor={`admin-${name}`} className="mb-2 block">
        {label}
      </Label>

      <Input id={`admin-${name}`} name={name} {...props} />
    </div>
  );
}
