import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";

import {
  createAppointment,
  initializePayment,
} from "@/redux/slices/appointmentSlice";

import {
  selectAuthUser,
  selectAuthToken,
  selectIsAuthenticated,
} from "@/redux/slices/authSlice";

const EMPTY_PATIENT = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  symptoms: "",
};

const getInitialPatient = (user) => {
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

const errorText = (error) => {
  if (typeof error === "string") return error;
  return error?.message || "Something went wrong.";
};

export default function ChatbotBookingPayment({ booking, onCancel }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectAuthUser);
  const token = useSelector(selectAuthToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [patient, setPatient] = useState(EMPTY_PATIENT);
  const [appointmentId, setAppointmentId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const lockRef = useRef(false);

  const summary = booking?.summary || booking;

  const doctorId = summary?.doctorId;
  const appointmentDate = summary?.appointmentDate || summary?.date;
  const startTime = summary?.startTime;
  const endTime = summary?.endTime;

  const doctorName = summary?.doctorName || "Doctor";
  const speciality = summary?.speciality || "";
  const fee = Number(summary?.consultationFee || 0);

  useEffect(() => {
    setPatient(getInitialPatient(user));
  }, [user]);

  // Never reuse an appointment ID for a different slot.
  useEffect(() => {
    setAppointmentId("");
    setOrderId("");
    setError("");
    setPaymentMessage("");
  }, [doctorId, appointmentDate, startTime, endTime]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setPatient((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const validatePatient = () => {
    if (!patient.firstName.trim()) return "First name is required.";
    if (!patient.lastName.trim()) return "Last name is required.";

    if (!/^0\d{9}$/.test(patient.phone.trim())) {
      return "Enter a valid Sri Lankan phone number, e.g. 0771234567.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email.trim())) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const handleCreateAppointment = async () => {
    if (lockRef.current || appointmentId) return;

    if (!isAuthenticated || !token || user?.role !== "patient") {
      setError("Please log in with a patient account.");
      return;
    }

    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      setError("Booking details are incomplete. Please select the slot again.");
      return;
    }

    const validationError = validatePatient();

    if (validationError) {
      setError(validationError);
      return;
    }

    lockRef.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await dispatch(
        createAppointment({
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
        }),
      ).unwrap();

      if (!result?.success) {
        throw new Error(result?.message || "Appointment creation failed.");
      }

      const createdId = result.appointmentId || result.appointment?._id;

      if (!createdId) {
        throw new Error(
          "Appointment may have been created, but its ID was not returned. Check My Appointments before retrying.",
        );
      }

      setAppointmentId(createdId);
      setPaymentMessage(
        "Appointment created and awaiting payment. Your selected slot is reserved according to the backend booking rules.",
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };

  const handlePayHere = async () => {
    if (lockRef.current || !appointmentId) return;

    if (!isAuthenticated || !token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof window.payhere?.startPayment !== "function"
    ) {
      setError("PayHere SDK is not loaded. Please refresh and retry.");
      return;
    }

    lockRef.current = true;
    setBusy(true);
    setError("");

    try {
      const result = await dispatch(initializePayment(appointmentId)).unwrap();

      if (!result?.success || !result.payment) {
        throw new Error(
          result?.message || "Unable to initialize PayHere payment.",
        );
      }

      const payment = {
        ...result.payment,
        sandbox: result.payment.sandbox ?? true,
      };

      // Preserve server-generated merchant_id, amount and hash.
      // Do not calculate the PayHere hash in React.
      delete payment.return_url;
      delete payment.cancel_url;

      const required = [
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

      const missing = required.filter(
        (key) =>
          payment[key] === undefined ||
          payment[key] === null ||
          payment[key] === "",
      );

      if (missing.length) {
        throw new Error(
          `PayHere configuration incomplete: ${missing.join(", ")}`,
        );
      }

      setOrderId(payment.order_id);

      window.payhere.onCompleted = (completedOrderId) => {
        setPaymentMessage(
          "PayHere checkout completed. Waiting for backend payment verification.",
        );

        navigate(
          `/payment/success?orderId=${encodeURIComponent(
            completedOrderId || payment.order_id,
          )}`,
        );
      };

      window.payhere.onDismissed = () => {
        setPaymentMessage(
          "Payment window closed. Appointment is not yet confirmed. You can retry payment.",
        );
      };

      window.payhere.onError = (payHereError) => {
        setError(errorText(payHereError));
      };

      window.payhere.startPayment(payment);
    } catch (err) {
      setError(errorText(err));
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-white p-4 text-sm shadow-sm">
      <div>
        <h3 className="font-bold text-slate-900">Appointment Confirmation</h3>
        <p className="mt-1 text-xs text-slate-500">
          Review your booking and complete payment securely.
        </p>
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <Info label="Doctor" value={doctorName} />
        <Info label="Speciality" value={speciality} />
        <Info label="Date" value={appointmentDate} />
        <Info label="Time" value={`${startTime} - ${endTime}`} />

        <div className="border-t pt-2">
          <Info
            label="Consultation Fee"
            value={`LKR ${fee.toLocaleString()}`}
          />
        </div>
      </div>

      {!isAuthenticated || user?.role !== "patient" ? (
        <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
          <p className="text-xs">
            Please sign in using a patient account to continue.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Login
          </button>
        </div>
      ) : !appointmentId ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800">Patient Details</h4>

          <div className="grid grid-cols-2 gap-2">
            <Field
              label="First Name"
              name="firstName"
              value={patient.firstName}
              onChange={updateField}
            />
            <Field
              label="Last Name"
              name="lastName"
              value={patient.lastName}
              onChange={updateField}
            />
          </div>

          <Field
            label="Phone"
            name="phone"
            value={patient.phone}
            onChange={updateField}
          />

          <Field
            label="Email"
            name="email"
            type="email"
            value={patient.email}
            onChange={updateField}
          />

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">
              Symptoms (Optional)
            </span>
            <textarea
              name="symptoms"
              rows={2}
              value={patient.symptoms}
              onChange={updateField}
              className="w-full resize-none rounded-lg border p-2 outline-none focus:border-blue-500"
            />
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={handleCreateAppointment}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Confirm Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" />
            <div>
              <p className="font-semibold">Appointment created</p>
              <p className="mt-1 break-all text-xs">
                Appointment ID: {appointmentId}
              </p>
              <p className="text-xs">Payment pending — not yet confirmed.</p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handlePayHere}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CreditCard size={17} />
            )}
            Pay with PayHere
          </button>
        </div>
      )}

      {paymentMessage && (
        <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          {paymentMessage}
        </p>
      )}

      {orderId && (
        <p className="break-all text-xs text-slate-400">Order ID: {orderId}</p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {onCancel && !appointmentId && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="w-full text-xs text-slate-500 underline"
        >
          Change appointment
        </button>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text" }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border p-2 outline-none focus:border-blue-500"
      />
    </label>
  );
}
