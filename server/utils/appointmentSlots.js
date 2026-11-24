"use strict";

const SLOT_MINUTES = 30;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(time) {
  if (typeof time !== "string" || !TIME_REGEX.test(time)) {
    throw new Error("Time must use HH:mm format.");
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}

function generateSlots(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (start >= end) {
    throw new Error("End time must be after start time.");
  }

  if ((end - start) % SLOT_MINUTES !== 0) {
    throw new Error("Working hours must be divisible into 30-minute slots.");
  }

  if (start % SLOT_MINUTES !== 0 || end % SLOT_MINUTES !== 0) {
    throw new Error("Working hours must align to 00 or 30 minutes.");
  }

  const slots = [];

  for (let current = start; current < end; current += SLOT_MINUTES) {
    slots.push({
      startTime: toTime(current),
      endTime: toTime(current + SLOT_MINUTES),
    });
  }

  return slots;
}

function isThirtyMinuteSlot(startTime, endTime) {
  try {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    return end - start === SLOT_MINUTES && start % SLOT_MINUTES === 0;
  } catch {
    return false;
  }
}

function slotsOverlap(a, b) {
  return (
    toMinutes(a.startTime) < toMinutes(b.endTime) &&
    toMinutes(a.endTime) > toMinutes(b.startTime)
  );
}

module.exports = {
  SLOT_MINUTES,
  generateSlots,
  isThirtyMinuteSlot,
  slotsOverlap,
};
