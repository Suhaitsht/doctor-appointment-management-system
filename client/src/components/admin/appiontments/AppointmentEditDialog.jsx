import React from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppointmentEditDialog({
  open,
  onOpenChange,
  appointment,
  setAppointment,
  onSave,
}) {
  if (!appointment) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Field
            label="Patient Name"
            name="patientName"
            value={appointment.patientName}
            onChange={handleChange}
          />

          <Field
            label="Doctor Name"
            name="doctorName"
            value={appointment.doctorName}
            onChange={handleChange}
          />

          <Field
            label="Speciality"
            name="speciality"
            value={appointment.speciality}
            onChange={handleChange}
          />

          <Field
            label="Date"
            name="date"
            type="date"
            value={appointment.date}
            onChange={handleChange}
          />

          <Field
            label="Time"
            name="time"
            type="time"
            value={appointment.time}
            onChange={handleChange}
          />

          <Field
            label="Amount"
            name="amount"
            value={appointment.amount}
            onChange={handleChange}
          />

          <div>
            <Label className="mb-2 block">Visit Type</Label>

            <select
              name="type"
              value={appointment.type}
              onChange={handleChange}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option>General Visit</option>

              <option>Video Call</option>

              <option>Direct Visit</option>
            </select>
          </div>

          <div>
            <Label className="mb-2 block">Status</Label>

            <select
              name="status"
              value={appointment.status}
              onChange={handleChange}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="pending">Pending</option>

              <option value="confirmed">Confirmed</option>

              <option value="completed">Completed</option>

              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onSave}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>

      <Input {...props} />
    </div>
  );
}
