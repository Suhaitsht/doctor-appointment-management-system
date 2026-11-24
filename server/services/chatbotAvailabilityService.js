const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const getDoctorAvailability = async (doctorId, date) => {
  // 1. Validate doctor ID
  if (!mongoose.isValidObjectId(doctorId)) {
    const error = new Error("Invalid doctor ID");
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate date
  if (!isValidDate(date)) {
    const error = new Error("Invalid date. Use YYYY-MM-DD format.");
    error.statusCode = 400;
    throw error;
  }

  // 3. Find doctor
  const doctor = await Doctor.findById(doctorId)
    .populate("user", "name isActive role")
    .lean();

  if (
    !doctor ||
    !doctor.isAvailable ||
    !doctor.user ||
    doctor.user.isActive !== true ||
    doctor.user.role !== "doctor"
  ) {
    const error = new Error("Doctor is not currently available.");
    error.statusCode = 404;
    throw error;
  }

  // 4. Fetch occupied appointments
  // Date storage format must match the Appointment schema.
  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const occupiedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    slotOccupied: true,
  })
    .select("timeSlot")
    .lean();

  const occupiedSlots = occupiedAppointments.map((appointment) => ({
    startTime: appointment.timeSlot?.startTime,
    endTime: appointment.timeSlot?.endTime,
  }));

  return {
    doctorId: String(doctor._id),
    date,
    occupiedSlots,
  };
};

module.exports = {
  getDoctorAvailability,
};
