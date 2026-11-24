import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  UserRound,
  Mail,
  Phone,
  Building2,
  WalletCards,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  AlertCircle,
  Loader2,
  Stethoscope,
  ImageOff,
  ShieldCheck,
} from "lucide-react";

import { fetchPublicDoctorById } from "@/redux/slices/doctorSlice";

import {
  fetchAvailableSlots,
  createAppointment,
  initializePayment,
  clearAvailableSlots,
  clearAppointmentError,
  clearPaymentError,
  resetPayment,
  resetAppointment,
} from "@/redux/slices/appointmentSlice";

// =====================================================
// CONFIGURATION
// =====================================================

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

const DEFAULT_DOCTOR_IMAGE =
  "https://placehold.co/600x600/e2e8f0/64748b?text=Doctor";

const APPOINTMENTS_PATH = "/patient/appointments";

// =====================================================
// HELPERS
// =====================================================

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  const value = String(date).slice(0, 10);
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string") return error;

  return error?.response?.data?.message || error?.message || fallback;
};

const getDoctorImage = (image) => {
  if (!image || typeof image !== "string") {
    return DEFAULT_DOCTOR_IMAGE;
  }

  const value = image.trim().replace(/\\/g, "/");

  if (!value) return DEFAULT_DOCTOR_IMAGE;

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  let path = value.replace(/^\/+/, "");

  // Handle image values returned as /api/uploads/...
  path = path.replace(/^api\/uploads\//i, "uploads/");

  // Handle stored filenames without an uploads prefix.
  if (!path.includes("/")) {
    path = `uploads/${path}`;
  }

  return `${API_ORIGIN}/${path}`;
};

const normalizeSlot = (slot) => {
  if (!slot) return null;

  if (typeof slot === "string") {
    return null;
  }

  return {
    ...slot,
    startTime: slot.startTime || slot.start || slot.time || "",
    endTime: slot.endTime || slot.end || "",
    available:
      slot.available !== false &&
      slot.isAvailable !== false &&
      slot.booked !== true &&
      slot.isBooked !== true,
  };
};

const getAppointmentId = (result) =>
  result?.appointmentId ||
  result?.appointment?._id ||
  result?.data?.appointmentId ||
  result?.data?.appointment?._id ||
  result?.data?._id ||
  null;

const getSpecialityName = (speciality) => {
  if (typeof speciality === "string") return speciality;

  return speciality?.name || speciality?.title || "Specialist";
};

// =====================================================
// DOCTOR IMAGE COMPONENT
// =====================================================

function DoctorImage({ image, name }) {
  const imageUrl = getDoctorImage(image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <div className="relative h-64 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-60">
      {!failed ? (
        <img
          src={imageUrl}
          alt={name}
          loading="eager"
          className="h-full w-full object-cover object-top"
          onError={() => {
            console.warn("Doctor image failed:", imageUrl);
            setFailed(true);
          }}
        />
      ) : (
        <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 bg-slate-100 text-slate-400">
          <ImageOff size={35} />
          <span className="text-sm font-semibold">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

// =====================================================
// REUSABLE INPUT COMPONENT
// =====================================================

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
}) {
  return (
    <div>
      <label
        htmlFor={`booking-${name}`}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={`booking-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : name === "firstName"
                  ? "given-name"
                  : "family-name"
          }
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, subtitle }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="break-words text-sm font-semibold text-slate-900">
        {value || "-"}
      </p>

      {subtitle && <p className="text-xs text-blue-600">{subtitle}</p>}
    </div>
  );
}

// =====================================================
// MAIN BOOKING COMPONENT
// =====================================================

export default function BookingForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { doctorId } = useParams();

  const {
    publicDoctor: doctor,
    publicDoctorLoading: doctorLoading,
    publicDoctorError: doctorError,
  } = useSelector((state) => state.doctors || {});

  const {
    availableSlots = [],
    slotsLoading = false,
    slotsError = null,
    appointment,
    appointmentId,
    creatingAppointment = false,
    createAppointmentError = null,
    paymentLoading = false,
    paymentError = null,
  } = useSelector((state) => state.appointments || {});

  const auth = useSelector((state) => state.auth || {});
  const user = auth.user;

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [createdAppointmentId, setCreatedAppointmentId] = useState("");

  const [patientDetails, setPatientDetails] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    symptoms: "",
    attachment: "",
  });

  const creatingRef = useRef(false);
  const paymentRef = useRef(false);

  // ===================================================
  // FETCH DOCTOR
  // ===================================================

  useEffect(() => {
    if (!doctorId) return;

    dispatch(fetchPublicDoctorById(doctorId));
  }, [dispatch, doctorId]);

  // ===================================================
  // FETCH AVAILABLE SLOTS
  // ===================================================

  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    setSelectedSlot(null);

    dispatch(
      fetchAvailableSlots({
        doctorId,
        date: selectedDate,
      }),
    );
  }, [dispatch, doctorId, selectedDate]);

  // ===================================================
  // PREFILL PATIENT DETAILS
  // ===================================================

  useEffect(() => {
    if (!user) return;

    const names = String(user.name || "")
      .trim()
      .split(/\s+/);

    setPatientDetails((previous) => ({
      ...previous,
      firstName: previous.firstName || user.firstName || names[0] || "",
      lastName:
        previous.lastName || user.lastName || names.slice(1).join(" ") || "",
      phone: previous.phone || user.phone || "",
      email: previous.email || user.email || "",
    }));
  }, [user]);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      dispatch(clearAvailableSlots());
      dispatch(clearAppointmentError());
      dispatch(clearPaymentError());
      dispatch(resetPayment());
      dispatch(resetAppointment());
    };
  }, [dispatch]);

  // ===================================================
  // DOCTOR INFORMATION
  // ===================================================

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const doctorSpeciality = getSpecialityName(
    doctor?.speciality || doctor?.specialization,
  );

  const doctorHospital =
    typeof doctor?.hospital === "string"
      ? doctor.hospital
      : doctor?.hospital?.name || "Jayanthi Medical Centre";

  const doctorImage =
    doctor?.user?.image ||
    doctor?.image ||
    doctor?.profileImage ||
    doctor?.user?.profileImage ||
    "";

  const doctorConsultationFee = Number(doctor?.consultationFee || 0);

  const consultationFee = Number(
    appointment?.consultationFee ?? doctor?.consultationFee ?? 0,
  );

  const totalAmount = Number(
    appointment?.totalAmount ??
      appointment?.consultationFee ??
      doctor?.consultationFee ??
      0,
  );

  const finalAppointmentId =
    createdAppointmentId || appointmentId || appointment?._id;

  // ===================================================
  // NORMALIZE AVAILABLE SLOTS
  // ===================================================

  const normalizedSlots = useMemo(() => {
    if (!Array.isArray(availableSlots)) return [];

    return availableSlots
      .map(normalizeSlot)
      .filter(
        (slot) => slot && slot.startTime && slot.endTime && slot.available,
      );
  }, [availableSlots]);

  // ===================================================
  // PATIENT INPUT HANDLER
  // ===================================================

  const handlePatientChange = (event) => {
    const { name, value } = event.target;

    setPatientDetails((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationError("");
  };

  // ===================================================
  // DATE AND TIME VALIDATION
  // ===================================================

  const handleDateTimeNext = () => {
    if (!selectedDate || selectedDate < getToday()) {
      setValidationError("Please select a valid appointment date.");
      return;
    }

    if (!selectedSlot?.startTime || !selectedSlot?.endTime) {
      setValidationError("Please select an available time slot.");
      return;
    }

    setValidationError("");
    setStep(2);
  };

  // ===================================================
  // PATIENT VALIDATION
  // ===================================================

  const validatePatient = () => {
    const { firstName, lastName, phone, email } = patientDetails;

    if (!firstName.trim()) {
      return "First name is required.";
    }

    if (!lastName.trim()) {
      return "Last name is required.";
    }

    if (!/^(?:0\d{9}|\+94\d{9})$/.test(phone.trim())) {
      return "Please enter a valid Sri Lankan phone number.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  // ===================================================
  // CREATE APPOINTMENT
  // ===================================================

  const handleCreateAppointment = async () => {
    if (creatingRef.current || creatingAppointment) return;

    // Never create the same appointment twice after success.
    if (finalAppointmentId) {
      setStep(3);
      return;
    }

    const formError = validatePatient();

    if (formError) {
      setValidationError(formError);
      return;
    }

    if (
      !doctorId ||
      !selectedDate ||
      !selectedSlot?.startTime ||
      !selectedSlot?.endTime
    ) {
      setValidationError("Doctor, appointment date or time is missing.");
      return;
    }

    creatingRef.current = true;
    setValidationError("");

    dispatch(clearAppointmentError());

    try {
      const appointmentData = {
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        appointmentType: "Clinic",
        patientDetails: {
          firstName: patientDetails.firstName.trim(),
          lastName: patientDetails.lastName.trim(),
          phone: patientDetails.phone.trim(),
          email: patientDetails.email.trim(),
          symptoms: patientDetails.symptoms.trim(),
          attachment: patientDetails.attachment || "",
        },
      };

      const result = await dispatch(
        createAppointment(appointmentData),
      ).unwrap();

      if (result?.success === false) {
        throw new Error(result.message || "Unable to create appointment.");
      }

      const newAppointmentId = getAppointmentId(result);

      if (!newAppointmentId) {
        throw new Error(
          "Appointment response did not include an ID. " +
            "Check My Appointments before trying again.",
        );
      }

      setCreatedAppointmentId(newAppointmentId);
      setValidationError("");
      setStep(3);
    } catch (error) {
      setValidationError(
        getErrorMessage(error, "Unable to create appointment.") +
          " Please check My Appointments before retrying if the request may have succeeded.",
      );
    } finally {
      creatingRef.current = false;
    }
  };

  // ===================================================
  // PAYHERE PAYMENT
  // ===================================================

  const handlePayment = async () => {
    if (paymentRef.current || paymentLoading) return;

    if (!finalAppointmentId) {
      setValidationError("Appointment ID is missing.");
      return;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setValidationError("Invalid payment amount.");
      return;
    }

    if (!window.payhere || typeof window.payhere.startPayment !== "function") {
      setValidationError(
        "PayHere SDK is not loaded. Please refresh and try again.",
      );
      return;
    }

    paymentRef.current = true;
    setValidationError("");
    dispatch(clearPaymentError());

    try {
      const result = await dispatch(
        initializePayment(finalAppointmentId),
      ).unwrap();

      if (result?.success === false || !result?.payment) {
        throw new Error(result?.message || "Unable to initialize payment.");
      }

      const payment = {
        ...result.payment,
        sandbox: result.payment.sandbox ?? true,
        return_url: undefined,
        cancel_url: undefined,
      };

      const requiredFields = [
        "merchant_id",
        "notify_url",
        "order_id",
        "items",
        "currency",
        "amount",
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "city",
        "country",
        "hash",
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          payment[field] === undefined ||
          payment[field] === null ||
          payment[field] === "",
      );

      if (missingFields.length) {
        throw new Error(`Missing PayHere fields: ${missingFields.join(", ")}`);
      }

      window.payhere.onCompleted = (orderId) => {
        // The backend notification must verify payment.
        navigate(`/payment/success?orderId=${encodeURIComponent(orderId)}`);
      };

      window.payhere.onDismissed = () => {
        navigate("/payment/cancel");
      };

      window.payhere.onError = (error) => {
        setValidationError(getErrorMessage(error, "PayHere payment failed."));
      };

      window.payhere.startPayment(payment);
    } catch (error) {
      setValidationError(
        getErrorMessage(error, "Unable to initialize PayHere payment."),
      );
    } finally {
      paymentRef.current = false;
    }
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (doctorLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading doctor information...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* PAGE HEADER */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Book Appointment
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Select your appointment and complete your booking securely.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* DOCTOR ERROR */}
        {doctorError && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={19} />
            {String(doctorError)}
          </div>
        )}

        {/* DOCTOR PROFILE CARD */}
        {doctor ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row">
              <DoctorImage image={doctorImage} name={doctorName} />

              <div className="flex min-w-0 flex-1 flex-col justify-center p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {doctorSpeciality}
                  </span>

                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} />
                    Available
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  {doctorName}
                </h2>

                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Building2 size={17} />
                  {doctorHospital}
                </p>

                <div className="mt-5 rounded-xl bg-orange-50 p-4">
                  <p className="text-xs text-slate-500">Consultation Fee</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    LKR {formatMoney(doctorConsultationFee)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          !doctorError && (
            <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
              Doctor information not found.
            </div>
          )
        )}

        {/* BOOKING CARD */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {/* PROGRESS STEPS */}
          <div className="mb-9">
            <div className="grid grid-cols-3 gap-2">
              {[
                { number: 1, title: "Date & Time" },
                { number: 2, title: "Patient Details" },
                { number: 3, title: "Payment" },
              ].map((item) => (
                <div
                  key={item.number}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      step >= item.number
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step > item.number ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      item.number
                    )}
                  </div>

                  <span
                    className={`text-center text-xs font-medium sm:text-sm ${
                      step >= item.number ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${(step / 3) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* ERRORS */}
          {(validationError || createAppointmentError || paymentError) && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>
                {validationError || createAppointmentError || paymentError}
              </span>
            </div>
          )}

          {/* STEP 1 - DATE AND TIME */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Select Date & Time
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose your preferred appointment date and available time.
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {/* DATE */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Appointment Date
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select your preferred date
                      </p>
                    </div>
                  </div>

                  <input
                    type="date"
                    min={getToday()}
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedSlot(null);
                      setValidationError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />

                  {selectedDate && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Selected Date</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(selectedDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* SLOTS */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Clock3 size={21} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Available Slots
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select an available time
                      </p>
                    </div>
                  </div>

                  {slotsLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                      <Loader2 size={17} className="animate-spin" />
                      Loading available slots...
                    </div>
                  ) : slotsError ? (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                      {String(slotsError)}
                    </div>
                  ) : normalizedSlots.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No available slots for this date.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {normalizedSlots.map((slot, index) => {
                        const selected =
                          selectedSlot?.startTime === slot.startTime &&
                          selectedSlot?.endTime === slot.endTime;

                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setValidationError("");
                            }}
                            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={handleDateTimeNext}
                  disabled={!selectedSlot}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  Next
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - PATIENT DETAILS */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Patient Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter patient information for this appointment.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={patientDetails.firstName}
                  onChange={handlePatientChange}
                  placeholder="Enter first name"
                  icon={UserRound}
                />

                <InputField
                  label="Last Name"
                  name="lastName"
                  value={patientDetails.lastName}
                  onChange={handlePatientChange}
                  placeholder="Enter last name"
                  icon={UserRound}
                />

                <InputField
                  label="Phone Number"
                  name="phone"
                  value={patientDetails.phone}
                  onChange={handlePatientChange}
                  placeholder="0771234567"
                  icon={Phone}
                />

                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={patientDetails.email}
                  onChange={handlePatientChange}
                  placeholder="patient@example.com"
                  icon={Mail}
                />

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Symptoms
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    name="symptoms"
                    rows={4}
                    value={patientDetails.symptoms}
                    onChange={handlePatientChange}
                    placeholder="Describe your symptoms"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* SUMMARY */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="font-bold text-slate-900">
                  Appointment Summary
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <SummaryItem label="Doctor" value={doctorName} />

                  <SummaryItem label="Date" value={formatDate(selectedDate)} />

                  <SummaryItem
                    label="Time"
                    value={
                      selectedSlot
                        ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                        : "-"
                    }
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={creatingAppointment}
                  onClick={() => {
                    setValidationError("");
                    setStep(1);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <ArrowLeft size={17} />
                  Back
                </button>

                <button
                  type="button"
                  disabled={creatingAppointment}
                  onClick={handleCreateAppointment}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingAppointment ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating Appointment...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 - PAYMENT */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Secure Payment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete your payment to confirm your appointment.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* PAYHERE */}
                <div className="rounded-2xl border p-5">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white">
                      <LockKeyhole size={24} />
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      Pay securely with PayHere
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      Complete your payment using PayHere checkout.
                    </p>

                    <p className="mt-5 text-2xl font-bold text-blue-600">
                      LKR {formatMoney(totalAmount)}
                    </p>

                    <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <ShieldCheck size={15} />
                      Secure payment
                    </p>
                  </div>
                </div>

                {/* PAYMENT SUMMARY */}
                <div className="rounded-2xl border p-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Booking Summary
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Review your appointment before payment.
                  </p>

                  <div className="mt-5 space-y-4 border-t pt-5">
                    <SummaryItem
                      label="Doctor"
                      value={doctorName}
                      subtitle={doctorSpeciality}
                    />

                    <SummaryItem label="Hospital" value={doctorHospital} />

                    <SummaryItem
                      label="Appointment Date"
                      value={formatDate(selectedDate)}
                    />

                    <SummaryItem
                      label="Appointment Time"
                      value={`${selectedSlot?.startTime || ""} - ${
                        selectedSlot?.endTime || ""
                      }`}
                    />
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Consultation Fee</span>
                      <span className="font-semibold">
                        LKR {formatMoney(consultationFee)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-600 px-5 py-4 text-white">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-lg font-bold">
                        LKR {formatMoney(totalAmount)}
                      </span>
                    </div>

                    {finalAppointmentId && (
                      <p className="mt-3 break-all text-center text-xs text-slate-400">
                        Appointment ID: {finalAppointmentId}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                    <CheckCircle2 size={16} className="shrink-0" />
                    Appointment created. Payment verification is required to
                    confirm the booking.
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `${APPOINTMENTS_PATH}?appointmentId=${encodeURIComponent(
                        finalAppointmentId || "",
                      )}`,
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold"
                >
                  <CalendarDays size={17} />
                  My Appointments
                </button>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={
                    paymentLoading || !finalAppointmentId || totalAmount <= 0
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Connecting to PayHere...
                    </>
                  ) : (
                    <>
                      <WalletCards size={18} />
                      Pay LKR {formatMoney(totalAmount)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
