import React from "react";

import { FaTrash, FaTriangleExclamation } from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function DeleteSpecialityDialog({
  open,
  onOpenChange,
  speciality,
  onDelete,
  loading = false,
}) {
  // ======================================================
  // CLOSE DIALOG
  // ======================================================

  const handleClose = () => {
    // API request நடக்கும்போது dialog close ஆகாமல் prevent
    if (loading) {
      return;
    }

    onOpenChange(false);
  };

  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete = () => {
    if (loading) {
      return;
    }

    if (!speciality?._id) {
      console.error("Speciality ID is missing");

      return;
    }

    onDelete();
  };

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
      <DialogContent className="sm:max-w-[430px]">
        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <DialogHeader>
          {/* DELETE ICON */}

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTrash className="text-lg" />
          </div>

          <DialogTitle className="text-xl">Delete Speciality</DialogTitle>

          <DialogDescription className="leading-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">
              {speciality?.name || "this speciality"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* ============================================= */}
        {/* WARNING */}
        {/* ============================================= */}

        <div className="mt-2 flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
          <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-500" />

          <p className="text-xs leading-5 text-red-600">
            This speciality will be permanently removed from the system.
          </p>
        </div>

        {/* ============================================= */}
        {/* SPECIALITY INFO */}
        {/* ============================================= */}

        {speciality && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Speciality</p>

            <p className="mt-1 font-medium text-slate-800">{speciality.name}</p>

            {speciality.specialityId && (
              <p className="mt-1 text-xs text-slate-500">
                #{speciality.specialityId}
              </p>
            )}
          </div>
        )}

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading || !speciality?._id}
            className="min-w-[100px] bg-red-500 text-white hover:bg-red-600"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
