const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =============================
// GET ALL DOCTORS
// =============================

export async function getDoctors() {
  const response = await fetch(`${API_URL}/doctors`);

  if (!response.ok) {
    throw new Error("Failed to get doctors");
  }

  return response.json();
}

// =============================
// CREATE DOCTOR
// =============================

export async function createDoctor(doctorData) {
  const response = await fetch(`${API_URL}/doctors`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(doctorData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create doctor");
  }

  return data;
}

// =============================
// UPDATE DOCTOR
// =============================

export async function updateDoctor(doctorId, doctorData) {
  const response = await fetch(`${API_URL}/doctors/${doctorId}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(doctorData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update doctor");
  }

  return data;
}

// =============================
// DELETE DOCTOR
// =============================

export async function deleteDoctor(doctorId) {
  const response = await fetch(`${API_URL}/doctors/${doctorId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete doctor");
  }

  return data;
}

// =============================
// UPDATE STATUS
// =============================

export async function updateDoctorStatus(doctorId, status) {
  const response = await fetch(`${API_URL}/doctors/${doctorId}/status`, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      status,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update status");
  }

  return data;
}
