import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarDays,
  FaClock,
  FaEnvelope,
  FaHospital,
  FaMoneyBillWave,
  FaPhone,
  FaUserDoctor,
} from "react-icons/fa6";

import {
  fetchAppointmentById,
  resetSelectedAppointment,
  selectSelectedAppointment,
  selectSelectedAppointmentError,
  selectSelectedAppointmentLoading,
} from "@/redux/slices/appointmentSlice";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ======================================================
// CONFIG
// ======================================================

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const DEFAULT_DOCTOR_IMAGE = "/default-doctor.png";

// ======================================================
// COMPONENT
// ======================================================

export default function PatientAppointmentDetails() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const { appointmentId } = useParams();

  // ====================================================
  // REDUX
  // ====================================================

  const appointment = useSelector(selectSelectedAppointment);

  const loading = useSelector(selectSelectedAppointmentLoading);

  const error = useSelector(selectSelectedAppointmentError);

  // ====================================================
  // FETCH APPOINTMENT
  // ====================================================

  useEffect(() => {
    if (!appointmentId) {
      return;
    }

    dispatch(fetchAppointmentById(appointmentId));

    return () => {
      dispatch(resetSelectedAppointment());
    };
  }, [dispatch, appointmentId]);

  // ====================================================
  // BACK
  // ====================================================

  const handleBack = () => {
    navigate("/patient/appointments");
  };

  // ====================================================
  // RETRY
  // ====================================================

  const handleRetry = () => {
    if (!appointmentId) {
      return;
    }

    dispatch(fetchAppointmentById(appointmentId));
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return <AppointmentDetailsSkeleton />;
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <div className="w-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="mb-5 gap-2"
        >
          <FaArrowLeft />
          Back
        </Button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load appointment
          </h2>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <Button type="button" className="mt-4" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ====================================================
  // NO APPOINTMENT
  // ====================================================

  if (!appointment) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-slate-500">Appointment not found.</p>

        <Button type="button" className="mt-4" onClick={handleBack}>
          Back to Appointments
        </Button>
      </div>
    );
  }

  // ====================================================
  // DOCTOR
  // ====================================================

  const doctor =
    appointment?.doctor && typeof appointment.doctor === "object"
      ? appointment.doctor
      : {};

  const doctorUser =
    doctor?.user && typeof doctor.user === "object" ? doctor.user : {};

  // ====================================================
  // DOCTOR NAME
  // ====================================================

  const rawDoctorName =
    doctorUser?.name ||
    doctorUser?.fullName ||
    doctor?.name ||
    doctor?.fullName ||
    "Doctor";

  const doctorName = String(rawDoctorName).toLowerCase().startsWith("dr.")
    ? rawDoctorName
    : `Dr. ${rawDoctorName}`;

  // ====================================================
  // DOCTOR IMAGE
  // ====================================================

  const doctorImage = getDoctorImage(doctor, doctorUser);

  // ====================================================
  // DATE
  // ====================================================

  const formattedDate = formatDate(appointment?.appointmentDate);

  // ====================================================
  // TIME
  // ====================================================

  const startTime = appointment?.timeSlot?.startTime || "N/A";

  const endTime = appointment?.timeSlot?.endTime || "N/A";

  // ====================================================
  // PATIENT DETAILS
  // ====================================================

  const patientDetails = appointment?.patientDetails || {};

  const patientName =
    `${patientDetails?.firstName || ""} ${
      patientDetails?.lastName || ""
    }`.trim() || "N/A";

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full">
      {/* =============================================== */}
      {/* HEADER */}
      {/* =============================================== */}

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleBack}
          >
            <FaArrowLeft />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Appointment Details
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Appointment ID: {getAppointmentDisplayId(appointment?._id)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AppointmentStatusBadge status={appointment?.status} />

          <PaymentStatusBadge status={appointment?.paymentStatus} />
        </div>
      </div>

      {/* =============================================== */}
      {/* DOCTOR INFORMATION */}
      {/* =============================================== */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Doctor Information</h2>

          <p className="mt-1 text-xs text-slate-500">
            Your appointment doctor information
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={doctorImage}
            alt={doctorName}
            className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            onError={(event) => {
              event.currentTarget.onerror = null;

              event.currentTarget.src = DEFAULT_DOCTOR_IMAGE;
            }}
          />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              {doctorName}
            </h3>

            <p className="mt-1 text-sm font-medium text-blue-600">
              {doctor?.speciality || doctorUser?.speciality || "Specialist"}
            </p>

            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-5">
              {doctorUser?.email && (
                <div className="flex items-center gap-2">
                  <FaEnvelope />

                  <span>{doctorUser.email}</span>
                </div>
              )}

              {doctorUser?.phone && (
                <div className="flex items-center gap-2">
                  <FaPhone />

                  <span>{doctorUser.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =============================================== */}
      {/* APPOINTMENT INFORMATION */}
      {/* =============================================== */}

      <div className="mt-5">
        <h2 className="mb-3 font-semibold text-slate-900">
          Appointment Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InfoCard
            icon={<FaCalendarDays />}
            label="Appointment Date"
            value={formattedDate}
          />

          <InfoCard
            icon={<FaClock />}
            label="Appointment Time"
            value={`${startTime} - ${endTime}`}
          />

          <InfoCard
            icon={<FaHospital />}
            label="Appointment Type"
            value={appointment?.appointmentType || "Clinic"}
          />

          <InfoCard
            icon={<FaUserDoctor />}
            label="Speciality"
            value={doctor?.speciality || "Specialist"}
          />

          <InfoCard
            icon={<FaHospital />}
            label="Medical Centre"
            value="Jayanthi Medical Centre"
          />

          <InfoCard
            icon={<FaMoneyBillWave />}
            label="Total Amount"
            value={formatCurrency(appointment?.totalAmount)}
          />
        </div>
      </div>

      {/* =============================================== */}
      {/* PATIENT INFORMATION */}
      {/* =============================================== */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Patient Information</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem label="Patient Name" value={patientName} />

          <DetailItem
            label="Phone Number"
            value={patientDetails?.phone || "N/A"}
          />

          <DetailItem
            label="Email Address"
            value={patientDetails?.email || "N/A"}
          />

          <DetailItem
            label="Appointment Type"
            value={appointment?.appointmentType || "Clinic"}
          />
        </div>
      </div>

      {/* =============================================== */}
      {/* SYMPTOMS */}
      {/* =============================================== */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          Symptoms / Reason for Visit
        </h2>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {patientDetails?.symptoms || "No symptoms or reason provided."}
          </p>
        </div>
      </div>

      {/* =============================================== */}
      {/* PAYMENT SUMMARY */}
      {/* =============================================== */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Payment Summary</h2>

            <p className="mt-1 text-xs text-slate-500">
              Appointment payment details
            </p>
          </div>

          <PaymentStatusBadge status={appointment?.paymentStatus} />
        </div>

        <div className="mt-5 space-y-3">
          <PaymentRow
            label="Consultation Fee"
            amount={appointment?.consultationFee}
          />

          <PaymentRow label="Booking Fee" amount={appointment?.bookingFee} />

          <PaymentRow label="Tax" amount={appointment?.tax} />

          {Number(appointment?.discount || 0) > 0 && (
            <PaymentRow
              label="Discount"
              amount={-Number(appointment?.discount)}
            />
          )}

          <div className="border-t border-slate-200 pt-3">
            <PaymentRow
              label="Total Amount"
              amount={appointment?.totalAmount}
              bold
            />
          </div>
        </div>
      </div>

      {/* =============================================== */}
      {/* CREATED DATE */}
      {/* =============================================== */}

      <div className="mt-5 flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Booking created: {formatDateTime(appointment?.createdAt)}</span>

        {appointment?.updatedAt && (
          <span>Last updated: {formatDateTime(appointment.updatedAt)}</span>
        )}
      </div>

      {/* =============================================== */}
      {/* BOTTOM ACTION */}
      {/* =============================================== */}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="gap-2"
        >
          <FaArrowLeft />
          Back to Appointments
        </Button>
      </div>
    </div>
  );
}

// ======================================================
// GET DOCTOR IMAGE
// ======================================================

function getDoctorImage(doctor = {}, doctorUser = {}) {
  const rawImage =
    doctorUser?.image ||
    doctorUser?.profileImage ||
    doctorUser?.avatar ||
    doctor?.image ||
    doctor?.profileImage ||
    doctor?.avatar ||
    "";

  if (!rawImage || typeof rawImage !== "string") {
    return DEFAULT_DOCTOR_IMAGE;
  }

  const cleanImage = rawImage.trim().replace(/\\/g, "/");

  if (!cleanImage) {
    return DEFAULT_DOCTOR_IMAGE;
  }

  // External image

  if (
    cleanImage.startsWith("http://") ||
    cleanImage.startsWith("https://") ||
    cleanImage.startsWith("data:")
  ) {
    return cleanImage;
  }

  // /uploads/doctor.jpg

  if (cleanImage.startsWith("/uploads/")) {
    return `${API_ORIGIN}${cleanImage}`;
  }

  // uploads/doctor.jpg

  if (cleanImage.startsWith("uploads/")) {
    return `${API_ORIGIN}/${cleanImage}`;
  }

  // /doctor.jpg

  if (cleanImage.startsWith("/")) {
    return `${API_ORIGIN}${cleanImage}`;
  }

  // doctor.jpg

  return `${API_ORIGIN}/uploads/${cleanImage}`;
}

// ======================================================
// APPOINTMENT DISPLAY ID
// ======================================================

function getAppointmentDisplayId(id) {
  if (!id) {
    return "#Appointment";
  }

  return `#Apt${String(id).slice(-6).toUpperCase()}`;
}

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// ======================================================
// FORMAT DATE + TIME
// ======================================================

function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",

    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatCurrency(amount) {
  return `LKR ${Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {value || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// DETAIL ITEM
// ======================================================

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "N/A"}
      </p>
    </div>
  );
}

// ======================================================
// PAYMENT ROW
// ======================================================

function PaymentRow({ label, amount, bold = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${
        bold ? "font-bold text-slate-900" : "text-slate-600"
      }`}
    >
      <span>{label}</span>

      <span>{formatCurrency(amount)}</span>
    </div>
  );
}

// ======================================================
// APPOINTMENT STATUS BADGE
// ======================================================

function AppointmentStatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();

  const styles = {
    pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",

    confirmed: "bg-blue-100 text-blue-700 hover:bg-blue-100",

    completed: "bg-green-100 text-green-700 hover:bg-green-100",

    cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return (
    <Badge className={styles[value] || "bg-slate-100 text-slate-700"}>
      Appointment: {capitalize(value)}
    </Badge>
  );
}

// ======================================================
// PAYMENT STATUS BADGE
// ======================================================

function PaymentStatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();

  const styles = {
    paid: "bg-green-100 text-green-700 hover:bg-green-100",

    pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",

    failed: "bg-red-100 text-red-700 hover:bg-red-100",

    refunded: "bg-purple-100 text-purple-700 hover:bg-purple-100",

    cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return (
    <Badge className={styles[value] || "bg-slate-100 text-slate-700"}>
      Payment: {capitalize(value)}
    </Badge>
  );
}

// ======================================================
// CAPITALIZE
// ======================================================

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ======================================================
// LOADING SKELETON
// ======================================================

function AppointmentDetailsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="border-b pb-5">
        <div className="h-7 w-56 rounded bg-slate-200" />

        <div className="mt-2 h-3 w-36 rounded bg-slate-100" />
      </div>

      <div className="mt-5 rounded-2xl border bg-white p-5">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-full bg-slate-200" />

          <div className="flex-1">
            <div className="h-5 w-44 rounded bg-slate-200" />

            <div className="mt-3 h-3 w-28 rounded bg-slate-100" />

            <div className="mt-4 h-3 w-56 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div key={index} className="h-20 rounded-xl border bg-slate-100" />
        ))}
      </div>

      <div className="mt-5 h-48 rounded-2xl border bg-slate-100" />

      <div className="mt-5 h-56 rounded-2xl border bg-slate-100" />
    </div>
  );
}
