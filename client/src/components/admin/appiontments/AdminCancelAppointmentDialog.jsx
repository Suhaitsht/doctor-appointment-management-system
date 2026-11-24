import React, { useEffect, useState } from "react";

import {
  FaCalendarXmark,
  FaTriangleExclamation,
  FaCircleInfo,
  FaSpinner,
} from "react-icons/fa6";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  "Doctor unavailable",
  "Patient requested cancellation",
  "Schedule conflict",
  "Administrative reason",
  "Other",
];

export default function AdminCancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  loading = false,
  error = null,
}) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);

  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedReason(REASONS[0]);
      setCustomReason("");
    }
  }, [open, appointment?.id]);

  const reason =
    selectedReason === "Other" ? customReason.trim() : selectedReason;

  const isPaid = appointment?.paymentStatus === "paid";

  const canCancel = ["pending", "confirmed"].includes(appointment?.status);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !appointment?.id ||
      !reason ||
      reason.length > 500 ||
      !canCancel ||
      loading
    ) {
      return;
    }

    await onConfirm({
      appointmentId: appointment.id,
      reason,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <FaCalendarXmark className="text-xl" />
          </div>

          <DialogTitle className="text-xl">Cancel Appointment</DialogTitle>

          <DialogDescription>
            Review the appointment before confirming cancellation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Patient</span>
              <span className="text-right font-semibold">
                {appointment?.patientName || "Unknown"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Doctor</span>
              <span className="text-right font-semibold">
                {appointment?.doctorName || "Unknown"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Appointment Date</span>
              <span className="font-medium">{appointment?.date || "N/A"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Payment Status</span>
              <span className="font-semibold capitalize">
                {appointment?.paymentStatus || "pending"}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-cancellation-reason"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Cancellation Reason
            </label>

            <select
              id="admin-cancellation-reason"
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              disabled={loading}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
            >
              {REASONS.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === "Other" && (
            <div>
              <label
                htmlFor="admin-custom-reason"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Explain Reason
              </label>

              <Textarea
                id="admin-custom-reason"
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Enter cancellation reason..."
                maxLength={500}
                disabled={loading}
                rows={3}
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {customReason.length}/500
              </p>
            </div>
          )}

          {isPaid && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <FaTriangleExclamation className="mt-0.5 shrink-0 text-amber-600" />

              <p className="text-xs leading-5 text-amber-800">
                This appointment has been paid. Cancelling it will not
                automatically refund the payment. Refund processing must be
                handled separately.
              </p>
            </div>
          )}

          {!canCancel && (
            <div className="flex gap-2 rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
              <FaCircleInfo className="shrink-0" />
              This appointment cannot be cancelled in its current status.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Keep Appointment
            </Button>

            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !canCancel || !reason || reason.length > 500}
            >
              {loading ? (
                <>
                  <FaSpinner className="mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
