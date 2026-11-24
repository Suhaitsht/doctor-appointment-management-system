import React, { useEffect, useState } from "react";

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
import { Label } from "@/components/ui/label";

import { FaImage, FaUpload } from "react-icons/fa6";

// ======================================================
// BACKEND BASE URL
// ======================================================

// .env:
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

  // Newly selected File preview
  if (image.startsWith("blob:")) {
    return image;
  }

  // Already full URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Backend relative URL
  // /uploads/specialities/abc.png

  return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

// ======================================================
// COMPONENT
// ======================================================

export default function SpecialityFormDialog({
  open,
  onOpenChange,

  title,
  description,

  formData,

  handleInputChange,
  handleImageChange,

  onSubmit,

  submitText = "Save",

  loading = false,

  isEdit = false,
}) {
  // ====================================================
  // IMAGE PREVIEW
  // ====================================================

  const [preview, setPreview] = useState("");

  // ====================================================
  // CREATE IMAGE PREVIEW
  // ====================================================

  useEffect(() => {
    // -----------------------------------------------
    // New File selected
    // -----------------------------------------------

    if (formData?.image instanceof File) {
      const objectUrl = URL.createObjectURL(formData.image);

      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    // -----------------------------------------------
    // Existing image from backend
    // -----------------------------------------------

    if (formData?.imagePreview) {
      setPreview(formData.imagePreview);

      return;
    }

    // -----------------------------------------------
    // No image
    // -----------------------------------------------

    setPreview("");
  }, [formData?.image, formData?.imagePreview]);

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) {
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

    onOpenChange(false);
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

        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ============================================= */}
        {/* FORM */}
        {/* ============================================= */}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* =========================================== */}
          {/* SPECIALITY NAME */}
          {/* =========================================== */}

          <div>
            <Label htmlFor="name" className="mb-2 block">
              Speciality Name
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <Input
              id="name"
              name="name"
              type="text"
              value={formData?.name || ""}
              onChange={handleInputChange}
              placeholder="Example: Cardiology"
              disabled={loading}
              required
            />
          </div>

          {/* =========================================== */}
          {/* IMAGE */}
          {/* =========================================== */}

          <div>
            <Label
              htmlFor="speciality-image"
              className="mb-2 flex items-center gap-2"
            >
              <FaImage />
              Speciality Image
            </Label>

            <label
              htmlFor="speciality-image"
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
                px-5
                py-6
                text-center
                transition
                hover:border-cyan-400
                hover:bg-cyan-50
              "
            >
              <FaUpload className="mb-3 text-2xl text-cyan-500" />

              <p className="text-sm font-medium text-slate-700">
                {isEdit
                  ? "Click to change speciality image"
                  : "Click to upload speciality image"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG or WEBP — Maximum 5MB
              </p>

              <Input
                id="speciality-image"
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          {/* =========================================== */}
          {/* IMAGE PREVIEW */}
          {/* =========================================== */}

          {preview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                Image Preview
              </p>

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-cyan-100 bg-cyan-50">
                  <img
                    src={getImageUrl(preview)}
                    alt={formData?.name || "Speciality"}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {formData?.name || "Speciality Name"}
                  </p>

                  {formData?.image instanceof File && (
                    <>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {formData.image.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  )}

                  {isEdit && !formData?.image && formData?.imagePreview && (
                    <p className="mt-1 text-xs text-slate-400">
                      Current speciality image
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================== */}
          {/* STATUS */}
          {/* =========================================== */}

          <div>
            <Label htmlFor="isActive" className="mb-2 block">
              Status
            </Label>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={Boolean(formData?.isActive)}
                onChange={handleInputChange}
                disabled={loading}
                className="h-4 w-4 cursor-pointer accent-cyan-500"
              />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  {formData?.isActive ? "Active" : "Inactive"}
                </p>

                <p className="text-xs text-slate-400">
                  {formData?.isActive
                    ? "This speciality is available to users."
                    : "This speciality is hidden from public users."}
                </p>
              </div>
            </div>
          </div>

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
              disabled={loading}
              className="min-w-[140px] bg-cyan-500 text-white hover:bg-cyan-600"
            >
              {loading ? (isEdit ? "Updating..." : "Adding...") : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
