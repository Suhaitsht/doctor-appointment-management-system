import React from "react";

import { FaTrash } from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function DeleteAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onDelete,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[430px]">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FaTrash />
          </div>

          <DialogTitle>Delete Appointment</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">
              {appointment?.id}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onDelete}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Delete Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
