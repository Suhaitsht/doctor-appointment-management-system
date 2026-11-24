const User = require("../models/User");
const notificationService = require("./notificationService");

// Adjust this adapter to your existing
// notificationService.js export and signature.
const sendNotification = async (payload) => {
  return notificationService.createNotification(payload);
};

// ======================================================
// NOTIFY DOCTOR + ADMINS ON NEW APPOINTMENT
// ======================================================

const notifyNewAppointment = async ({
  appointment,
  patientName,
  doctorUserId,
}) => {
  if (!appointment?._id || !doctorUserId) {
    throw new Error("Appointment ID and doctor user ID are required");
  }

  const admins = await User.find({
    role: "admin",
  }).select("_id");

  const appointmentId = String(appointment._id);

  const recipients = [
    {
      recipient: doctorUserId,
      type: "appointment_booked",
      title: "New Appointment Request",
      message: `${patientName} has booked an appointment. Please review the request.`,
      link: "/doctor/requests",
      eventKey: `appointment:${appointmentId}:doctor:new`,
    },

    ...admins.map((admin) => ({
      recipient: admin._id,
      type: "appointment_booked",
      title: "New Appointment Created",
      message: `${patientName} has booked a new appointment.`,
      link: "/admin/appointments",
      eventKey: `appointment:${appointmentId}:admin:${admin._id}`,
    })),
  ];

  const results = await Promise.allSettled(
    recipients.map((payload) => sendNotification(payload)),
  );

  const failed = results.filter((result) => result.status === "rejected");

  if (failed.length > 0) {
    console.error(
      `${failed.length} appointment notifications failed`,
      failed.map((item) => item.reason),
    );
  }

  return results;
};

module.exports = {
  notifyNewAppointment,
};
