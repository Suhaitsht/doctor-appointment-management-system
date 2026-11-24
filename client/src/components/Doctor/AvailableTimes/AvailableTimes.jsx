import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FaClock, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";

import {
  fetchMyAvailability,
  updateDoctorAvailability,
} from "@/redux/slices/doctorSlice";

// ======================================================
// DAYS
// ======================================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ======================================================
// CREATE EMPTY AVAILABILITY
// ======================================================

const createEmptyAvailability = () =>
  DAYS.map((day) => ({
    day,
    slots: [],
  }));

// ======================================================
// COMPONENT
// ======================================================

export default function AvailableTimings() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const {
    availability: savedAvailability,
    availabilityLoading,
    availabilityUpdating,
    availabilityError,
  } = useSelector((state) => state.doctors);

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [activeTab, setActiveTab] = useState("general");

  const [selectedDay, setSelectedDay] = useState("Monday");

  const [availability, setAvailability] = useState(createEmptyAvailability());

  const [startTime, setStartTime] = useState("");

  const [endTime, setEndTime] = useState("");

  const [open, setOpen] = useState(false);

  // ====================================================
  // FETCH AVAILABILITY
  // ====================================================

  useEffect(() => {
    dispatch(fetchMyAvailability());
  }, [dispatch]);

  // ====================================================
  // LOAD REDUX DATA INTO LOCAL STATE
  // ====================================================

  useEffect(() => {
    if (!Array.isArray(savedAvailability)) {
      return;
    }

    const mergedAvailability = DAYS.map((day) => {
      const existing = savedAvailability.find((item) => item.day === day);

      return {
        day,
        slots: Array.isArray(existing?.slots) ? existing.slots : [],
      };
    });

    setAvailability(mergedAvailability);
  }, [savedAvailability]);

  // ====================================================
  // CURRENT SELECTED DAY
  // ====================================================

  const selectedDayData = availability.find((item) => item.day === selectedDay);

  const selectedSlots = selectedDayData?.slots || [];

  // ====================================================
  // FORMAT TIME
  // 09:00 -> 09:00 AM
  // 14:30 -> 02:30 PM
  // ====================================================

  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":");

    const date = new Date();

    date.setHours(Number(hour));
    date.setMinutes(Number(minute));
    date.setSeconds(0);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ====================================================
  // ADD SLOT
  // ====================================================

  const handleAddSlot = () => {
    // --------------------------------------------------
    // Required validation
    // --------------------------------------------------

    if (!startTime || !endTime) {
      toast.error("Start time and end time are required.");

      return;
    }

    // --------------------------------------------------
    // End time validation
    // --------------------------------------------------

    if (startTime >= endTime) {
      toast.error("End time must be after start time.");

      return;
    }

    // --------------------------------------------------
    // Duplicate validation
    // --------------------------------------------------

    const duplicateSlot = selectedSlots.some(
      (slot) => slot.startTime === startTime && slot.endTime === endTime,
    );

    if (duplicateSlot) {
      toast.error("This time slot already exists.");

      return;
    }

    // --------------------------------------------------
    // Overlap validation
    //
    // Existing: 09:00 - 09:30
    // New:      09:15 - 09:45
    // => invalid
    // --------------------------------------------------

    const hasOverlap = selectedSlots.some(
      (slot) => startTime < slot.endTime && endTime > slot.startTime,
    );

    if (hasOverlap) {
      toast.error("This time overlaps with another slot.");

      return;
    }

    // --------------------------------------------------
    // Add slot
    // --------------------------------------------------

    setAvailability((previous) =>
      previous.map((item) => {
        if (item.day !== selectedDay) {
          return item;
        }

        const updatedSlots = [
          ...item.slots,
          {
            startTime,
            endTime,
          },
        ];

        // Sort slots by start time
        updatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
          ...item,
          slots: updatedSlots,
        };
      }),
    );

    // Reset dialog
    setStartTime("");
    setEndTime("");
    setOpen(false);
  };

  // ====================================================
  // DELETE SINGLE SLOT
  // ====================================================

  const handleDeleteSlot = (slotToDelete) => {
    setAvailability((previous) =>
      previous.map((item) => {
        if (item.day !== selectedDay) {
          return item;
        }

        return {
          ...item,

          slots: item.slots.filter(
            (slot) =>
              !(
                slot.startTime === slotToDelete.startTime &&
                slot.endTime === slotToDelete.endTime
              ),
          ),
        };
      }),
    );
  };

  // ====================================================
  // DELETE ALL SLOTS FOR SELECTED DAY
  // ====================================================

  const handleDeleteAll = () => {
    if (selectedSlots.length === 0) {
      toast.info(`No slots available for ${selectedDay}.`);

      return;
    }

    setAvailability((previous) =>
      previous.map((item) =>
        item.day === selectedDay
          ? {
              ...item,
              slots: [],
            }
          : item,
      ),
    );
  };

  // ====================================================
  // CANCEL UNSAVED CHANGES
  // ====================================================

  const handleCancel = () => {
    const restored = DAYS.map((day) => {
      const existing = savedAvailability?.find((item) => item.day === day);

      return {
        day,

        slots: Array.isArray(existing?.slots) ? existing.slots : [],
      };
    });

    setAvailability(restored);

    setSelectedDay("Monday");

    setStartTime("");
    setEndTime("");

    toast.info("Unsaved changes cancelled.");
  };

  // ====================================================
  // SAVE AVAILABILITY
  // ====================================================

  const handleSave = async () => {
    try {
      const payload = availability.map((item) => ({
        day: item.day,

        slots: item.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      }));

      await dispatch(updateDoctorAvailability(payload)).unwrap();

      toast.success("Availability updated successfully.");
    } catch (error) {
      console.error("SAVE AVAILABILITY ERROR:", error);

      toast.error(
        typeof error === "string" ? error : "Failed to update availability.",
      );
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (availabilityLoading) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">Loading availability...</p>
        </div>
      </div>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full bg-white px-4 py-6 md:px-6 lg:px-8">
      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Timings</h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your weekly consultation availability.
        </p>

        <div className="mt-4 h-px bg-slate-200" />
      </div>

      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {availabilityError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{availabilityError}</p>
        </div>
      )}

      {/* ==================================================
          TABS
      ================================================== */}

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "general"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          General Availability
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("clinic")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "clinic"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Clinic Availability
        </button>
      </div>

      {/* ==================================================
          GENERAL AVAILABILITY
      ================================================== */}

      {activeTab === "general" && (
        <Card className="border-slate-200 p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Select Available Slots
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose the days and time periods when patients can book
            appointments.
          </p>

          <div className="my-5 h-px bg-slate-200" />

          {/* ==============================================
              SELECT DAYS
          ============================================== */}

          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">
              Select Available Day
            </p>

            <div className="flex flex-wrap gap-3">
              {DAYS.map((day) => {
                const dayData = availability.find((item) => item.day === day);

                const slotCount = dayData?.slots?.length || 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`relative rounded-lg border px-5 py-2.5 text-sm font-medium transition ${
                      selectedDay === day
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {day}

                    {slotCount > 0 && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                          selectedDay === day
                            ? "bg-white/20 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {slotCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==============================================
              SLOT CARD
          ============================================== */}

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {/* Header */}

            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedDay}</h3>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedSlots.length}{" "}
                  {selectedSlots.length === 1 ? "slot" : "slots"} available
                </p>
              </div>

              <div className="flex items-center gap-5">
                {/* ========================================
                    ADD SLOT DIALOG
                ======================================== */}

                <Dialog
                  open={open}
                  onOpenChange={(value) => {
                    setOpen(value);

                    if (!value) {
                      setStartTime("");
                      setEndTime("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <FaPlus className="text-xs" />
                      Add Slot
                    </button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle>Add Time Slot</DialogTitle>

                      <DialogDescription>
                        Add an available time period for {selectedDay}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {/* Start Time */}

                      <div>
                        <label
                          htmlFor="startTime"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Start Time
                        </label>

                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(event) => setStartTime(event.target.value)}
                        />
                      </div>

                      {/* End Time */}

                      <div>
                        <label
                          htmlFor="endTime"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          End Time
                        </label>

                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(event) => setEndTime(event.target.value)}
                        />
                      </div>

                      {/* Preview */}

                      {startTime && endTime && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Selected Time
                          </p>

                          <div className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                            <FaClock className="text-blue-500" />

                            {formatTime(startTime)}

                            <span>-</span>

                            {formatTime(endTime)}
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        onClick={handleAddSlot}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Add Slot
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* ========================================
                    DELETE ALL
                ======================================== */}

                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={selectedSlots.length === 0}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaTrash className="text-xs" />
                  Delete All
                </button>
              </div>
            </div>

            {/* ============================================
                TIME SLOTS
            ============================================ */}

            <div className="flex min-h-[100px] flex-wrap items-center gap-3 p-4">
              {selectedSlots.length > 0 ? (
                selectedSlots.map((slot, index) => (
                  <div
                    key={
                      slot._id || `${slot.startTime}-${slot.endTime}-${index}`
                    }
                    className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <FaClock className="text-blue-500" />

                    <span>
                      {formatTime(slot.startTime)}

                      {" - "}

                      {formatTime(slot.endTime)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot)}
                      className="ml-1 text-red-400 opacity-60 transition hover:text-red-600 group-hover:opacity-100"
                      aria-label="Delete slot"
                    >
                      <FaXmark />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex w-full flex-col items-center justify-center py-5 text-center">
                  <FaClock className="mb-2 text-2xl text-slate-300" />

                  <p className="text-sm text-slate-400">
                    No available slots for {selectedDay}.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Click Add Slot to add availability.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==============================================
              SUMMARY
          ============================================== */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Weekly Availability Summary
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {availability.map((item) => (
                <div
                  key={item.day}
                  className="rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">{item.day}</span>

                  <span className="ml-2 text-xs text-slate-400">
                    {item.slots.length}{" "}
                    {item.slots.length === 1 ? "slot" : "slots"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ==============================================
              ACTION BUTTONS
          ============================================== */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={availabilityUpdating}
              className="rounded-full px-6"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={availabilityUpdating}
              className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              {availabilityUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      )}

      {/* ==================================================
          CLINIC AVAILABILITY
      ================================================== */}

      {activeTab === "clinic" && (
        <Card className="border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Clinic Availability
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Clinic-specific availability settings can be added here later.
          </p>
        </Card>
      )}
    </div>
  );
}
