"use strict";

const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const timeToMinutes = (time) => {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const overlaps = (a, b) => {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  if ([aStart, aEnd, bStart, bEnd].includes(null)) {
    return false;
  }

  return aStart < bEnd && aEnd > bStart;
};

const getColomboCurrentMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value);

  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  return hour * 60 + minute;
};

const getDoctorFreeSlots = async (doctorId, date) => {
  // 1. Validate doctor ID
  if (!mongoose.isValidObjectId(doctorId)) {
    throw createError("Invalid doctor ID.");
  }

  // 2. Validate appointment date
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError("Date must be YYYY-MM-DD.");
  }

  let selectedDate;

  try {
    selectedDate = Appointment.dateOnlyToUTC(date);

    if (
      !(selectedDate instanceof Date) ||
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new Error("Invalid date");
    }
  } catch {
    throw createError("Invalid appointment date.");
  }

  // 3. Prevent past dates
  const today = Appointment.colomboTodayDateOnly();

  if (date < today) {
    throw createError("Past dates cannot be selected.");
  }

  // 4. Fetch doctor
  const doctor = await Doctor.findById(doctorId)
    .populate("user", "name isActive role")
    .lean();

  if (!doctor) {
    throw createError("Doctor not found.", 404);
  }

  if (
    doctor.isAvailable !== true ||
    !doctor.user ||
    doctor.user.isActive === false ||
    doctor.user.role !== "doctor"
  ) {
    throw createError("Doctor is not available for booking.", 409);
  }

  // 5. Find selected weekday
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(selectedDate);

  const daySchedule = doctor.availability?.find((item) => item.day === day);

  const scheduledSlots = daySchedule?.slots || [];

  // 6. Fetch occupied appointments
  const appointments = await Appointment.find({
    doctor: doctor._id,
    appointmentDate: selectedDate,
    slotOccupied: true,
  })
    .select("timeSlot")
    .lean();

  // 7. Determine current Colombo time
  const isToday = date === today;

  const currentMinutes = isToday ? getColomboCurrentMinutes() : null;

  // 8. Validate, filter and sort slots
  const validSlots = scheduledSlots.filter((slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);

    return start !== null && end !== null && start < end;
  });

  const freeSlots = validSlots
    .filter((slot) => {
      // Exclude slots already started today
      if (isToday && timeToMinutes(slot.startTime) <= currentMinutes) {
        return false;
      }

      // Exclude occupied/overlapping slots
      return !appointments.some(
        (appointment) =>
          appointment.timeSlot?.startTime &&
          appointment.timeSlot?.endTime &&
          overlaps(slot, appointment.timeSlot),
      );
    })
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    }))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // 9. Return verified availability
  return {
    doctorId: String(doctor._id),
    doctorName: doctor.displayName || doctor.user.name,
    speciality: doctor.speciality,
    consultationFee: doctor.consultationFee,
    date,
    day,
    totalSlots: validSlots.length,
    availableSlotCount: freeSlots.length,
    slots: freeSlots,
  };
};

module.exports = {
  getDoctorFreeSlots,
};
