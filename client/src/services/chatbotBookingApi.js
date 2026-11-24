const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function selectChatbotSlot(slot, language = "ta") {
  return request("/chatbot/select-slot", {
    method: "POST",
    body: JSON.stringify({
      doctorId: slot.doctorId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      language,
    }),
  });
}

export async function confirmChatbotBooking({
  summary,
  patientDetails,
  token,
}) {
  if (!token) {
    throw new Error("Please log in to book an appointment.");
  }

  if (!summary || !patientDetails) {
    throw new Error("Booking details are incomplete.");
  }

  // Existing appointment controller:
  // validates patient, doctor, schedule, slot and fees.
  const appointmentResult = await request("/appointments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      doctorId: summary.doctorId,
      appointmentDate: summary.appointmentDate,
      startTime: summary.startTime,
      endTime: summary.endTime,
      appointmentType: "Clinic",
      patientDetails: {
        firstName: patientDetails.firstName,
        lastName: patientDetails.lastName,
        email: patientDetails.email,
        phone: patientDetails.phone,
        symptoms: patientDetails.symptoms || "",
      },
    }),
  });

  const appointmentId =
    appointmentResult.appointmentId || appointmentResult.appointment?._id;

  if (!appointmentId) {
    throw new Error("Appointment response did not include an appointment ID.");
  }

  // Existing PayHere controller.
  // This is a separate request, so payment initialization
  // may fail after the appointment has already been created.
  let paymentResult;

  try {
    paymentResult = await request("/payments/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId }),
    });
  } catch (error) {
    error.appointmentId = appointmentId;
    throw error;
  }

  return {
    appointmentId,
    appointment: appointmentResult.appointment,
    payment: paymentResult.payment,
    orderId: paymentResult.orderId,
    status: "payment_required",
  };
}

export async function retryChatbotPayment(appointmentId, token) {
  return request(`/payments/retry/${encodeURIComponent(appointmentId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getChatbotPaymentStatus(orderId, token) {
  return request(`/payments/status/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
