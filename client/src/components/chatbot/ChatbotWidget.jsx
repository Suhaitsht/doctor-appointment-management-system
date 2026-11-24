import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";

import {
  Bot,
  MessageCircle,
  X,
  Send,
  CalendarDays,
  CalendarCheck,
  Clock3,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

import {
  addUserMessage,
  sendChatMessage,
  resetChat,
  setChatLanguage,
  clearChatError,
  setBookingContext,
} from "@/redux/slices/chatbotSlice";

import { createAppointment } from "@/redux/slices/appointmentSlice";
import { selectChatbotSlot } from "@/services/chatbotBookingApi";

// =====================================================
// CONFIG
// =====================================================

const APPOINTMENTS_PATH = "/patient/appointments";

const BOOKING_STORAGE_KEY = "jayanthi_chatbot_created_booking";

// =====================================================
// TRANSLATIONS
// =====================================================

const TEXT = {
  en: {
    title: "Jayanthi AI",
    subtitle: "Your healthcare companion",
    welcome:
      "Hello! Welcome to Jayanthi Medical Centre. How can I help you today?",
    placeholder: "Ask me anything...",
    doctors: "Find Doctors",
    book: "Book Appointment",
    appointments: "My Appointments",
    summary: "Appointment Summary",
    patient: "Patient Details",
    doctor: "Doctor",
    speciality: "Speciality",
    date: "Date",
    time: "Time",
    fee: "Consultation Fee",
    confirm: "Create Appointment",
    login: "Please login using a patient account.",
    created: "Appointment created successfully!",
    pending:
      "Your appointment is pending. Please complete payment from My Appointments.",
    viewAppointments: "Go to My Appointments",
    change: "Choose Another Slot",
    booking: "Creating appointment...",
    paymentInfo: "Payment will be completed on the Patient Appointments page.",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    email: "Email Address",
    symptoms: "Symptoms (Optional)",
    viewDoctor: "View Doctor",
    slots: "available slots",
    noSlots: "No available slots.",
    checking: "Checking slot...",
    typing: "Assistant is typing...",
    disclaimer: "Appointment assistance • Not medical advice",
  },

  ta: {
    title: "Jayanthi AI",
    subtitle: "உங்கள் மருத்துவ உதவியாளர்",
    welcome: "வணக்கம்! ஜெயந்தி மருத்துவ மையத்திற்கு வரவேற்கிறோம்.",
    placeholder: "உங்கள் கேள்வியை எழுதுங்கள்...",
    doctors: "மருத்துவர்கள்",
    book: "Appointment பதிவு",
    appointments: "என் Appointments",
    summary: "Appointment விவரங்கள்",
    patient: "நோயாளியின் விவரங்கள்",
    doctor: "மருத்துவர்",
    speciality: "சிறப்புத் துறை",
    date: "தேதி",
    time: "நேரம்",
    fee: "ஆலோசனைக் கட்டணம்",
    confirm: "Appointment பதிவு செய்க",
    login: "Patient account-ல் login செய்யுங்கள்.",
    created: "Appointment வெற்றிகரமாக உருவாக்கப்பட்டது!",
    pending:
      "உங்கள் Appointment pending-ல் உள்ளது. My Appointments page-ல் payment செய்யுங்கள்.",
    viewAppointments: "My Appointments செல்லுங்கள்",
    change: "வேறு நேரத்தைத் தேர்ந்தெடுக்கவும்",
    booking: "Appointment உருவாக்கப்படுகிறது...",
    paymentInfo: "Payment செய்ய Patient Appointments page-க்கு செல்ல வேண்டும்.",
    firstName: "முதல் பெயர்",
    lastName: "கடைசி பெயர்",
    phone: "தொலைபேசி எண்",
    email: "மின்னஞ்சல்",
    symptoms: "அறிகுறிகள் (விருப்பம்)",
    viewDoctor: "மருத்துவரைப் பார்க்க",
    slots: "காலியான நேரங்கள்",
    noSlots: "காலியான நேரங்கள் இல்லை.",
    checking: "நேரம் சரிபார்க்கப்படுகிறது...",
    typing: "Assistant பதிலளிக்கிறார்...",
    disclaimer: "Appointment உதவி • மருத்துவ ஆலோசனை அல்ல",
  },

  si: {
    title: "Jayanthi AI",
    subtitle: "ඔබගේ සෞඛ්‍ය සහායකයා",
    welcome: "ආයුබෝවන්! ජයන්ති වෛද්‍ය මධ්‍යස්ථානයට සාදරයෙන් පිළිගනිමු.",
    placeholder: "ඔබගේ ප්‍රශ්නය ලියන්න...",
    doctors: "වෛද්‍යවරු",
    book: "හමුවීමක් වෙන්කරවා ගන්න",
    appointments: "මගේ හමුවීම්",
    summary: "හමුවීමේ විස්තර",
    patient: "රෝගියාගේ විස්තර",
    doctor: "වෛද්‍යවරයා",
    speciality: "විශේෂඥතාව",
    date: "දිනය",
    time: "වේලාව",
    fee: "ගාස්තුව",
    confirm: "හමුවීම සාදන්න",
    login: "රෝගී ගිණුමකින් පිවිසෙන්න.",
    created: "හමුවීම සාර්ථකව නිර්මාණය විය!",
    pending:
      "ඔබගේ හමුවීම තවම තහවුරු වී නැත. My Appointments වෙත ගොස් ගෙවීම කරන්න.",
    viewAppointments: "මගේ හමුවීම් වෙත යන්න",
    change: "වෙනත් වේලාවක් තෝරන්න",
    booking: "හමුවීම නිර්මාණය වෙමින් පවතී...",
    paymentInfo: "ගෙවීම My Appointments පිටුවෙන් කරන්න.",
    firstName: "මුල් නම",
    lastName: "අවසන් නම",
    phone: "දුරකථන අංකය",
    email: "ඊමේල්",
    symptoms: "රෝග ලක්ෂණ (විකල්ප)",
    viewDoctor: "වෛද්‍යවරයා බලන්න",
    slots: "ලබා ගත හැකි වේලාවන්",
    noSlots: "වේලාවන් නොමැත.",
    checking: "වේලාව පරීක්ෂා කරමින්...",
    typing: "සහායකයා පිළිතුරු සපයමින්...",
    disclaimer: "හමුවීම් සහාය • වෛද්‍ය උපදෙස් නොවේ",
  },
};

// =====================================================
// HELPERS
// =====================================================

const getDoctorId = (doctor) => doctor?.doctorId || doctor?.id || doctor?._id;

const getDoctorName = (doctor) =>
  doctor?.doctorName || doctor?.user?.name || doctor?.name || "Doctor";

const getSpeciality = (doctor) => {
  const speciality = doctor?.speciality;

  if (typeof speciality === "object" && speciality !== null) {
    return speciality.name || speciality.title || "";
  }

  return speciality || doctor?.specialization || "";
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const getBookingSummary = (response) => {
  const booking =
    response?.booking || response?.data?.booking || response?.payload?.booking;

  if (booking?.status === "confirmation_required" && booking?.summary) {
    return booking.summary;
  }

  return null;
};

const formatMoney = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;

const getUserId = (user) => String(user?._id || user?.id || "");

const initialPatient = (user) => {
  const names = String(user?.name || "")
    .trim()
    .split(/\s+/);

  return {
    firstName: user?.firstName || names[0] || "",
    lastName: user?.lastName || names.slice(1).join(" ") || "",
    phone: user?.phone || "",
    email: user?.email || "",
    symptoms: "",
  };
};

const readSavedBooking = () => {
  try {
    return JSON.parse(sessionStorage.getItem(BOOKING_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const saveCreatedBooking = (booking) => {
  try {
    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
  } catch (error) {
    console.warn("Unable to save booking reference:", error);
  }
};

const bookingMatches = (saved, userId, summary) =>
  Boolean(
    saved?.appointmentId &&
    saved.userId === userId &&
    String(saved.doctorId) === String(summary?.doctorId) &&
    String(saved.appointmentDate) === String(summary?.appointmentDate) &&
    saved.startTime === summary?.startTime &&
    saved.endTime === summary?.endTime,
  );

const getAppointmentId = (result) =>
  result?.appointmentId ||
  result?.appointment?._id ||
  result?.data?.appointmentId ||
  result?.data?.appointment?._id ||
  result?.data?._id ||
  null;

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="break-words text-right font-semibold text-slate-800">
        {value || "-"}
      </span>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = true,
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
      />
    </label>
  );
}

// =====================================================
// DOCTOR CARD
// =====================================================

function DoctorCard({ doctor, language, disabled, onSelectSlot, onNavigate }) {
  const t = TEXT[language];
  const doctorId = getDoctorId(doctor);
  const slots = Array.isArray(doctor?.slots) ? doctor.slots : [];

  if (!doctorId) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-blue-50 p-3 text-blue-600">
          <Stethoscope size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {getDoctorName(doctor)}
          </p>

          <p className="text-xs text-slate-500">{getSpeciality(doctor)}</p>
        </div>
      </div>

      {doctor.consultationFee != null && (
        <p className="text-xs font-semibold text-blue-700">
          {formatMoney(doctor.consultationFee)}
        </p>
      )}

      {doctor.date && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-slate-600">
            <CalendarDays size={14} />
            {doctor.date}
          </p>

          <p className="flex items-center gap-2 text-xs font-semibold">
            <Clock3 size={14} />
            {slots.length} {t.slots}
          </p>

          {slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot, index) => (
                <button
                  key={`${slot.startTime}-${index}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectSlot(doctor, slot)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white disabled:opacity-50"
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-700">{t.noSlots}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onNavigate(`/doctors/${doctorId}`)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {t.viewDoctor}
        <ArrowUpRight size={14} />
      </button>
    </div>
  );
}

// =====================================================
// CHAT MESSAGE
// =====================================================

function ChatMessage({
  message,
  language,
  disabled,
  onSelectSlot,
  onNavigate,
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="max-w-[88%] space-y-2">
        <div
          className={`rounded-2xl px-4 py-3 text-[13px] leading-6 ${
            isUser ? "bg-blue-600 text-white" : "border bg-white text-slate-700"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {!isUser &&
          Array.isArray(message.doctors) &&
          message.doctors.map((doctor, index) => (
            <DoctorCard
              key={`${getDoctorId(doctor)}-${index}`}
              doctor={doctor}
              language={language}
              disabled={disabled}
              onSelectSlot={onSelectSlot}
              onNavigate={onNavigate}
            />
          ))}

        {!isUser && message.action?.path && (
          <button
            type="button"
            onClick={() => onNavigate(message.action.path)}
            className="w-full rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700"
          >
            {message.action.label || "View"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// =====================================================
// BOOKING COMPONENT - NO PAYHERE
// =====================================================

function ChatbotBooking({ summary, language, onCancel, onBookingCreated }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = TEXT[language];

  // Uses the original Redux auth state shape:
  // state.auth.user, state.auth.token, state.auth.isAuthenticated
  const auth = useSelector((state) => state.auth || {});
  const user = auth.user;
  const token = auth.token;
  const isAuthenticated = Boolean(auth.isAuthenticated && token);

  const [patient, setPatient] = useState(() => initialPatient(user));

  const [appointmentId, setAppointmentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lockRef = useRef(false);

  const doctorId = summary?.doctorId;
  const appointmentDate = summary?.appointmentDate;
  const startTime = summary?.startTime;
  const endTime = summary?.endTime;

  useEffect(() => {
    setPatient(initialPatient(user));
  }, [user]);

  // Restore only a booking matching the same user and slot.
  useEffect(() => {
    const userId = getUserId(user);
    if (!userId) return;

    const saved = readSavedBooking();

    if (bookingMatches(saved, userId, summary)) {
      setAppointmentId(saved.appointmentId);
      setNotice(t.pending);
    }
  }, [user, doctorId, appointmentDate, startTime, endTime, language]);

  const updatePatient = (event) => {
    const { name, value } = event.target;

    setPatient((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const validatePatient = () => {
    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return "Incomplete booking details.";
    }

    if (!patient.firstName.trim()) {
      return "First name is required.";
    }

    if (!patient.lastName.trim()) {
      return "Last name is required.";
    }

    if (!/^(?:0\d{9}|\+94\d{9})$/.test(patient.phone.trim())) {
      return "Enter a valid Sri Lankan phone number.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email.trim())) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const goToAppointments = (id = appointmentId) => {
    const path = id
      ? `${APPOINTMENTS_PATH}?appointmentId=${encodeURIComponent(id)}`
      : APPOINTMENTS_PATH;

    navigate(path);
  };

  const handleCreateAppointment = async () => {
    if (lockRef.current || appointmentId) {
      if (appointmentId) {
        goToAppointments(appointmentId);
      }
      return;
    }

    if (!isAuthenticated || !token || user?.role !== "patient") {
      setError(t.login);
      return;
    }

    const validationError = validatePatient();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Prevent duplicate clicks and repeated submissions.
    lockRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      // If this exact booking was already created in this
      // browser session, reuse it instead of creating again.
      const saved = readSavedBooking();

      if (bookingMatches(saved, getUserId(user), summary)) {
        setAppointmentId(saved.appointmentId);
        setNotice(t.pending);
        onBookingCreated?.(saved.appointmentId);
        goToAppointments(saved.appointmentId);
        return;
      }

      const payload = {
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        appointmentType: "Clinic",
        patientDetails: {
          firstName: patient.firstName.trim(),
          lastName: patient.lastName.trim(),
          phone: patient.phone.trim(),
          email: patient.email.trim(),
          symptoms: patient.symptoms.trim(),
          attachment: "",
        },
      };

      // Only create an appointment.
      // Do NOT call initializePayment or PayHere.
      const result = await dispatch(createAppointment(payload)).unwrap();

      if (result?.success === false) {
        throw new Error(result.message || "Appointment creation failed.");
      }

      const createdId = getAppointmentId(result);

      if (!createdId) {
        throw new Error(
          "Booking response has no appointment ID. " +
            "Check My Appointments before trying again.",
        );
      }

      setAppointmentId(createdId);

      saveCreatedBooking({
        userId: getUserId(user),
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        appointmentId: createdId,
      });

      setNotice(t.created);

      onBookingCreated?.(createdId);

      // Redirect to Patient Appointments for payment.
      goToAppointments(createdId);
    } catch (err) {
      setError(
        getErrorMessage(err) +
          " If the request may have succeeded, check " +
          "My Appointments before retrying.",
      );
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <CalendarCheck size={20} className="text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">{t.summary}</h3>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <DetailRow label={t.doctor} value={summary.doctorName} />
        <DetailRow label={t.speciality} value={summary.speciality} />
        <DetailRow label={t.date} value={appointmentDate} />
        <DetailRow label={t.time} value={`${startTime} - ${endTime}`} />
        <DetailRow label={t.fee} value={formatMoney(summary.consultationFee)} />
      </div>

      {!isAuthenticated || user?.role !== "patient" ? (
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs text-amber-800">{t.login}</p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-3 w-full rounded-xl bg-blue-600 p-3 text-xs font-semibold text-white"
          >
            Login
          </button>
        </div>
      ) : !appointmentId ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold">{t.patient}</h4>

          <div className="grid grid-cols-2 gap-2">
            <Field
              label={t.firstName}
              name="firstName"
              value={patient.firstName}
              onChange={updatePatient}
            />

            <Field
              label={t.lastName}
              name="lastName"
              value={patient.lastName}
              onChange={updatePatient}
            />
          </div>

          <Field
            label={t.phone}
            name="phone"
            value={patient.phone}
            onChange={updatePatient}
          />

          <Field
            label={t.email}
            name="email"
            type="email"
            value={patient.email}
            onChange={updatePatient}
          />

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">
              {t.symptoms}
            </span>

            <textarea
              name="symptoms"
              rows={3}
              value={patient.symptoms}
              onChange={updatePatient}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
            <ClipboardCheck
              size={16}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <p className="text-xs leading-5 text-blue-800">{t.paymentInfo}</p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleCreateAppointment}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t.booking}
              </>
            ) : (
              <>
                <CalendarCheck size={16} />
                {t.confirm}
              </>
            )}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            {t.change}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={16} />
              {t.created}
            </p>

            <p className="mt-2 break-all text-[11px] text-slate-600">
              Appointment ID: {appointmentId}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-700">{t.pending}</p>
          </div>

          <button
            type="button"
            onClick={() => goToAppointments()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-xs font-semibold text-white hover:bg-blue-700"
          >
            {t.viewAppointments}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {notice && (
        <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
          {notice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </p>
      )}
    </motion.div>
  );
}

// =====================================================
// MAIN CHATBOT WIDGET
// =====================================================

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    messages = [],
    language = "en",
    loading = false,
    error = null,
    bookingContext = null,
  } = useSelector((state) => state.chatbot || {});

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [bookingSummary, setBookingSummary] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

  const bottomRef = useRef(null);
  const busyRef = useRef(false);
  const requestRef = useRef(null);

  const safeLanguage = TEXT[language] ? language : "en";

  const t = TEXT[safeLanguage];
  const busy = loading || slotLoading;

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [open, messages, loading, bookingSummary, slotLoading, error]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort?.();
    };
  }, []);

  const resetConversation = () => {
    requestRef.current?.abort?.();

    dispatch(resetChat());

    setInput("");
    setBookingSummary(null);
    setSlotError("");
  };

  const sendMessage = async (value) => {
    const content = String(value || "").trim();

    if (!content || content.length > 1000 || busy || busyRef.current) {
      return;
    }

    busyRef.current = true;

    dispatch(clearChatError());
    dispatch(addUserMessage(content));

    setInput("");
    setSlotError("");

    try {
      const request = dispatch(
        sendChatMessage({
          message: content,
          language: safeLanguage,
          bookingContext,
        }),
      );

      requestRef.current = request;

      const response = await request.unwrap();

      const summary = getBookingSummary(response);

      if (summary) {
        setBookingSummary(summary);
      }
    } catch (err) {
      console.error("Chatbot message error:", err);
    } finally {
      busyRef.current = false;
      requestRef.current = null;
    }
  };

  const handleSelectSlot = async (doctor, slot) => {
    if (busy || busyRef.current) return;

    const doctorId = getDoctorId(doctor);
    const date = doctor?.date;

    if (!doctorId || !date || !slot?.startTime || !slot?.endTime) {
      setSlotError("Invalid doctor or time slot.");
      return;
    }

    setSlotLoading(true);
    setSlotError("");

    try {
      const response = await selectChatbotSlot(
        {
          doctorId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        safeLanguage,
      );

      const summary = getBookingSummary(response);

      if (!summary) {
        throw new Error("Invalid slot confirmation response.");
      }

      setBookingSummary(summary);

      dispatch(
        setBookingContext({
          status: "slot_selection",
          speciality: getSpeciality(doctor),
          date,
        }),
      );
    } catch (err) {
      setSlotError(getErrorMessage(err));
    } finally {
      setSlotLoading(false);
    }
  };

  const handleNavigate = (path) => {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//")
    ) {
      return;
    }

    setOpen(false);
    navigate(path);
  };

  const quickActions = [
    {
      label: t.doctors,
      prompt:
        safeLanguage === "ta"
          ? "மருத்துவர்களைக் காட்டுங்கள்"
          : "Show available doctors",
      icon: Stethoscope,
    },
    {
      label: t.book,
      prompt:
        safeLanguage === "ta"
          ? "Appointment book pannanum"
          : "I want to book an appointment",
      icon: CalendarDays,
    },
  ];

  const displayedMessages = [
    {
      id: "welcome",
      role: "assistant",
      content: t.welcome,
    },
    ...messages,
  ];

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[9999] sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            className="pointer-events-auto absolute bottom-[82px] right-0"
          >
            <div className="flex h-[min(650px,calc(100dvh-115px))] w-[calc(100vw-32px)] max-w-[410px] flex-col overflow-hidden rounded-[26px] border bg-white shadow-2xl">
              {/* HEADER */}
              <div className="bg-gradient-to-br from-[#10254B] to-blue-600 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/15 p-3">
                    <Bot size={24} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{t.title}</h3>
                    <p className="text-xs text-blue-100">{t.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={resetConversation}
                    title="New conversation"
                  >
                    <RotateCcw size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <select
                  value={safeLanguage}
                  onChange={(event) => {
                    setBookingSummary(null);
                    dispatch(resetChat());
                    dispatch(setChatLanguage(event.target.value));
                  }}
                  className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-white"
                >
                  <option value="en" className="text-black">
                    English
                  </option>
                  <option value="ta" className="text-black">
                    தமிழ்
                  </option>
                  <option value="si" className="text-black">
                    සිංහල
                  </option>
                </select>
              </div>

              {/* MESSAGES */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
                {displayedMessages.map((message, index) => (
                  <ChatMessage
                    key={message.id || message._id || index}
                    message={message}
                    language={safeLanguage}
                    disabled={busy}
                    onSelectSlot={handleSelectSlot}
                    onNavigate={handleNavigate}
                  />
                ))}

                {bookingSummary && (
                  <ChatbotBooking
                    key={[
                      bookingSummary.doctorId,
                      bookingSummary.appointmentDate,
                      bookingSummary.startTime,
                      bookingSummary.endTime,
                    ].join("-")}
                    summary={bookingSummary}
                    language={safeLanguage}
                    onCancel={() => setBookingSummary(null)}
                    onBookingCreated={() => {
                      setOpen(false);
                    }}
                  />
                )}

                {slotLoading && (
                  <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-blue-600">
                    <Loader2 size={15} className="animate-spin" />
                    {t.checking}
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-slate-500">
                    <Loader2 size={15} className="animate-spin" />
                    {t.typing}
                  </div>
                )}

                {slotError && (
                  <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    {slotError}
                  </p>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    {String(error)}

                    <button
                      type="button"
                      onClick={() => dispatch(clearChatError())}
                      className="ml-2 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* QUICK ACTIONS */}
              <div className="flex flex-wrap gap-2 border-t bg-white p-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      disabled={busy}
                      onClick={() => sendMessage(action.prompt)}
                      className="flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium text-slate-700 disabled:opacity-50"
                    >
                      <Icon size={13} />
                      {action.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleNavigate(APPOINTMENTS_PATH)}
                  className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700"
                >
                  <CalendarCheck size={13} />
                  {t.appointments}
                </button>
              </div>

              {/* INPUT */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(input);
                }}
                className="bg-white px-4 pb-3"
              >
                <div className="flex items-center gap-2 rounded-2xl border bg-slate-50 p-1.5">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={1000}
                    placeholder={t.placeholder}
                    className="h-10 min-w-0 flex-1 bg-transparent px-3 text-xs outline-none"
                  />

                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50"
                  >
                    <Send size={17} />
                  </button>
                </div>
              </form>

              {/* FOOTER */}
              <div className="flex items-center justify-center gap-2 bg-white pb-3 text-[10px] text-slate-400">
                <ShieldCheck size={12} />
                {t.disclaimer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTON */}
      <motion.button
        type="button"
        whileHover={{
          scale: 1.06,
        }}
        whileTap={{
          scale: 0.95,
        }}
        onClick={() => setOpen((previous) => !previous)}
        className="pointer-events-auto ml-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-blue-500 text-white shadow-xl"
        aria-label="Toggle AI chatbot"
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}
