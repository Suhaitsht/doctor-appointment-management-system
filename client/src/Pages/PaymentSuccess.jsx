import React, { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import {
  CheckCircle2,
  Clock3,
  CalendarDays,
  UserRound,
  Building2,
  ReceiptText,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  CircleCheckBig,
  ArrowRight,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import {
  verifyPaymentStatus,
  resetPaymentVerification,
  clearPaymentVerificationError,
} from "@/redux/slices/appointmentSlice";

// ======================================================
// CONFIGURATION
// ======================================================

const MAX_AUTO_ATTEMPTS = 5;
const RETRY_DELAY = 2000;

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const MY_APPOINTMENTS_ROUTE = "/patient/appointments";

// ======================================================
// HELPERS
// ======================================================

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) {
    return "-";
  }

  const number = Number(amount);

  if (!Number.isFinite(number)) return "-";

  return `LKR ${number.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ======================================================
// COMPONENT
// ======================================================

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");

  // ====================================================
  // REDUX
  // ====================================================

  const { paymentVerification, verifyingPayment, paymentVerificationError } =
    useSelector((state) => state.appointments || {});

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [attemptCount, setAttemptCount] = useState(0);
  const [autoChecking, setAutoChecking] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState("");

  const startedRef = useRef(false);

  // ====================================================
  // PAYMENT DATA
  // ====================================================

  const payment = paymentVerification?.payment || null;

  const appointment = paymentVerification?.appointment || null;

  const doctor = appointment?.doctor || null;

  const appointmentId =
    appointment?._id ||
    appointment?.id ||
    payment?.appointment?._id ||
    payment?.appointment ||
    null;

  // ====================================================
  // DOCTOR DETAILS
  // ====================================================

  const doctorName =
    doctor?.displayName || doctor?.user?.name || doctor?.name || "Doctor";

  const doctorSpeciality = doctor?.speciality || "Specialist";

  const doctorHospital = doctor?.hospital || "Jayanthi Medical Centre";

  // ====================================================
  // PAYMENT STATUS
  // ====================================================

  const paymentStatus = normalizeStatus(payment?.status);

  const appointmentPaymentStatus = normalizeStatus(appointment?.paymentStatus);

  const appointmentStatus = normalizeStatus(appointment?.status);

  const paymentFailed =
    paymentStatus === "failed" || paymentStatus === "cancelled";

  const paymentPaid =
    paymentStatus === "paid" && appointmentPaymentStatus === "paid";

  const appointmentConfirmed = appointmentStatus === "confirmed";

  const appointmentCancelled =
    appointmentStatus === "cancelled" || appointmentStatus === "completed";

  // Payment and appointment confirmation are
  // independent statuses.
  const paymentConfirmed = paymentPaid;

  // Retry only for failed/cancelled payment attempts.
  const canRetryPayment =
    paymentFailed &&
    Boolean(appointmentId) &&
    !appointmentCancelled &&
    appointmentPaymentStatus !== "paid";

  // ====================================================
  // VERIFY PAYMENT
  // ====================================================

  const checkPayment = useCallback(async () => {
    if (!orderId) return null;

    try {
      dispatch(clearPaymentVerificationError());

      const result = await dispatch(verifyPaymentStatus(orderId)).unwrap();

      return result;
    } catch (error) {
      console.error("Payment verification failed:", error);

      return null;
    }
  }, [dispatch, orderId]);

  // ====================================================
  // INITIAL PAYMENT VERIFICATION
  // ====================================================

  useEffect(() => {
    if (!orderId || startedRef.current) {
      return;
    }

    startedRef.current = true;

    const runInitialCheck = async () => {
      await checkPayment();
      setAttemptCount(1);
    };

    runInitialCheck();
  }, [orderId, checkPayment]);

  // ====================================================
  // AUTOMATIC POLLING
  // ====================================================

  useEffect(() => {
    if (!orderId || attemptCount === 0) {
      return;
    }

    if (paymentConfirmed || paymentFailed) {
      setAutoChecking(false);
      return;
    }

    if (attemptCount >= MAX_AUTO_ATTEMPTS) {
      setAutoChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      await checkPayment();

      setAttemptCount((previous) => previous + 1);
    }, RETRY_DELAY);

    return () => clearTimeout(timer);
  }, [orderId, attemptCount, paymentConfirmed, paymentFailed, checkPayment]);

  // ====================================================
  // CLEANUP
  // ====================================================

  useEffect(() => {
    return () => {
      dispatch(resetPaymentVerification());
    };
  }, [dispatch]);

  // ====================================================
  // MANUAL STATUS CHECK
  // ====================================================

  const handleManualRetry = async () => {
    if (!orderId || verifyingPayment) return;

    setAutoChecking(false);
    await checkPayment();
  };

  // ====================================================
  // RETRY FAILED PAYMENT
  // ====================================================

  const handleRetryPayment = async () => {
    if (retryLoading) return;

    if (!canRetryPayment) {
      setRetryError("This appointment is not eligible for payment retry.");
      return;
    }

    try {
      setRetryLoading(true);
      setRetryError("");

      // Use your application's actual auth source.
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to retry your payment.");
      }

      // Important:
      // This endpoint must be implemented in your
      // backend payment controller.
      //
      // It must create a NEW payment attempt for
      // the SAME appointment.

      const response = await axios.post(
        `${API_BASE_URL}/payments/retry/${appointmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to initialize payment.",
        );
      }

      // Expected backend response:
      // {
      //   success: true,
      //   payment: {
      //     sandbox: true,
      //     merchant_id: "...",
      //     order_id: "...",
      //     items: "...",
      //     amount: "3500.00",
      //     currency: "LKR",
      //     hash: "...",
      //     first_name: "...",
      //     last_name: "...",
      //     email: "...",
      //     phone: "...",
      //     address: "...",
      //     city: "...",
      //     country: "...",
      //     return_url: "...",
      //     cancel_url: "...",
      //     notify_url: "..."
      //   }
      // }

      const paymentData = response.data?.payment;

      if (!paymentData) {
        throw new Error("Payment checkout details were not returned.");
      }

      if (
        !paymentData.order_id ||
        !paymentData.merchant_id ||
        !paymentData.hash ||
        !paymentData.amount
      ) {
        throw new Error("Incomplete PayHere checkout details.");
      }

      if (
        !window.payhere ||
        typeof window.payhere.startPayment !== "function"
      ) {
        throw new Error("PayHere checkout SDK is not loaded.");
      }

      // Do not mark payment as paid here.
      // Only the verified backend PayHere notification
      // may confirm a successful payment.

      window.payhere.startPayment(paymentData);
    } catch (error) {
      console.error("RETRY PAYMENT ERROR:", error);

      setRetryError(
        error.response?.data?.message ||
          error.message ||
          "Unable to retry payment.",
      );
    } finally {
      setRetryLoading(false);
    }
  };

  // ====================================================
  // INVALID ORDER ID
  // ====================================================

  if (!orderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={42} className="text-red-500" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Invalid Payment
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Payment order ID was not found. Please return to your appointments
            and check your booking.
          </p>

          <button
            type="button"
            onClick={() => navigate(MY_APPOINTMENTS_ROUTE)}
            className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View My Appointments
          </button>
        </div>
      </main>
    );
  }

  // ====================================================
  // INITIAL LOADING
  // ====================================================

  if (verifyingPayment && !paymentVerification) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Verifying Payment
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while we confirm your payment with the server.
          </p>
        </div>
      </main>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* ========================================
              STATUS HEADER
          ======================================== */}

          <div className="p-7 text-center sm:p-10">
            {/* PAYMENT SUCCESS */}

            {paymentConfirmed && (
              <>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
                  <CircleCheckBig size={52} className="text-emerald-600" />
                </div>

                <h1 className="mt-6 text-3xl font-bold text-slate-900">
                  {appointmentConfirmed
                    ? "Appointment Confirmed"
                    : "Payment Successful"}
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  {appointmentConfirmed
                    ? "Your payment has been verified successfully and your appointment is confirmed."
                    : "Your payment has been verified successfully. Your appointment is awaiting confirmation."}
                </p>

                <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck size={17} />
                  Payment Verified
                </div>
              </>
            )}

            {/* PAYMENT FAILED */}

            {!paymentConfirmed && paymentFailed && (
              <>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle size={50} className="text-red-500" />
                </div>

                <h1 className="mt-6 text-3xl font-bold text-slate-900">
                  Payment Unsuccessful
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Your payment was not completed. Your appointment has not been
                  confirmed by this payment.
                </p>

                <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                  <AlertCircle size={16} />
                  Payment Failed
                </div>

                {canRetryPayment && (
                  <p className="mx-auto mt-4 max-w-sm text-xs leading-5 text-slate-500">
                    You can try another card or payment method without creating
                    a new appointment.
                  </p>
                )}
              </>
            )}

            {/* PAYMENT PENDING */}

            {!paymentConfirmed && !paymentFailed && (
              <>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-50">
                  {verifyingPayment || autoChecking ? (
                    <Loader2
                      size={46}
                      className="animate-spin text-amber-600"
                    />
                  ) : (
                    <Clock3 size={46} className="text-amber-600" />
                  )}
                </div>

                <h1 className="mt-6 text-2xl font-bold text-slate-900">
                  Payment Verification Pending
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  We are waiting for PayHere server confirmation.
                </p>

                {autoChecking && attemptCount < MAX_AUTO_ATTEMPTS && (
                  <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                    <Loader2 size={14} className="animate-spin" />
                    Checking payment automatically...
                  </div>
                )}
              </>
            )}
          </div>

          {/* ========================================
              ERRORS
          ======================================== */}

          {paymentVerificationError && (
            <div
              role="alert"
              className="mx-6 mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 sm:mx-8"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{paymentVerificationError}</span>
            </div>
          )}

          {retryError && (
            <div
              role="alert"
              className="mx-6 mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 sm:mx-8"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{retryError}</span>
            </div>
          )}

          {/* ========================================
              PAYMENT INFORMATION
          ======================================== */}

          <div className="border-t border-slate-100 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ReceiptText size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Payment Information
                </h2>

                <p className="text-xs text-slate-500">Transaction details</p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-5">
              <InfoRow label="Order ID" value={orderId} />

              <InfoRow
                label="Payment Status"
                value={paymentStatus ? paymentStatus.toUpperCase() : "PENDING"}
              />

              <InfoRow
                label="Amount"
                value={formatAmount(
                  payment?.amount ?? appointment?.totalAmount,
                )}
              />

              <InfoRow label="Currency" value={payment?.currency || "LKR"} />

              {payment?.paymentId && (
                <InfoRow label="Payment ID" value={payment.paymentId} />
              )}

              {payment?.paymentMethod && (
                <InfoRow label="Payment Method" value={payment.paymentMethod} />
              )}

              {payment?.statusMessage && (
                <InfoRow label="Status Message" value={payment.statusMessage} />
              )}
            </div>
          </div>

          {/* ========================================
              APPOINTMENT DETAILS
          ======================================== */}

          {appointment && (
            <div className="border-t border-slate-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Appointment Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your booked consultation
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={<UserRound size={19} />}
                  label="Doctor"
                  value={doctorName}
                  subtitle={doctorSpeciality}
                />

                <DetailCard
                  icon={<Building2 size={19} />}
                  label="Hospital"
                  value={doctorHospital}
                />

                <DetailCard
                  icon={<CalendarDays size={19} />}
                  label="Appointment Date"
                  value={formatDate(appointment.appointmentDate)}
                />

                <DetailCard
                  icon={<Clock3 size={19} />}
                  label="Appointment Time"
                  value={`${appointment.timeSlot?.startTime || "-"}${
                    appointment.timeSlot?.endTime
                      ? ` - ${appointment.timeSlot.endTime}`
                      : ""
                  }`}
                />
              </div>

              {/* PAYMENT SUMMARY */}

              <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <CreditCard size={18} className="text-blue-600" />
                  Payment Summary
                </div>

                <div className="mt-4 space-y-3">
                  <AmountRow
                    label="Consultation Fee"
                    value={formatAmount(appointment.consultationFee)}
                  />

                  {Number(appointment.bookingFee) > 0 && (
                    <AmountRow
                      label="Booking Fee"
                      value={formatAmount(appointment.bookingFee)}
                    />
                  )}

                  {Number(appointment.tax) > 0 && (
                    <AmountRow
                      label="Tax"
                      value={formatAmount(appointment.tax)}
                    />
                  )}

                  {Number(appointment.discount) > 0 && (
                    <AmountRow
                      label="Discount"
                      value={`- ${formatAmount(appointment.discount)}`}
                    />
                  )}
                </div>

                <div className="my-4 border-t border-slate-200" />

                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-900">Total Amount</span>

                  <span className="text-xl font-bold text-blue-600">
                    {formatAmount(appointment.totalAmount ?? payment?.amount)}
                  </span>
                </div>
              </div>

              {/* APPOINTMENT STATUS */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatusBox
                  label="Appointment Status"
                  value={appointment.status}
                  success={appointmentConfirmed}
                />

                <StatusBox
                  label="Payment Status"
                  value={appointment.paymentStatus}
                  success={appointmentPaymentStatus === "paid"}
                />
              </div>
            </div>
          )}

          {/* ========================================
              ACTION BUTTONS
          ======================================== */}

          <div className="border-t border-slate-100 p-6 sm:p-8">
            {/* RETRY PAYMENT */}

            {canRetryPayment && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={retryLoading || verifyingPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retryLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Preparing Payment...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Retry Payment
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Your existing appointment will be reused for this payment
                  attempt.
                </p>
              </div>
            )}

            {/* FAILED WITHOUT RETRY ELIGIBILITY */}

            {paymentFailed && !canRetryPayment && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Payment retry is unavailable for this appointment. Please check
                your appointment details or contact support.
              </div>
            )}

            {/* CHECK PAYMENT STATUS */}

            {!paymentConfirmed && !paymentFailed && (
              <button
                type="button"
                disabled={verifyingPayment}
                onClick={handleManualRetry}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifyingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Checking Payment...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Check Payment Status
                  </>
                )}
              </button>
            )}

            {/* MY APPOINTMENTS */}

            <button
              type="button"
              onClick={() => navigate(MY_APPOINTMENTS_ROUTE)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                canRetryPayment
                  ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <CalendarDays size={18} />
              View My Appointments
            </button>

            {paymentFailed && (
              <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                If money was deducted from your account, verify the transaction
                before making another payment.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ======================================================
// INFO ROW
// ======================================================

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-5 py-3">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>

      <span className="break-all text-right text-sm font-semibold text-slate-900">
        {value ?? "-"}
      </span>
    </div>
  );
}

// ======================================================
// DETAIL CARD
// ======================================================

function DetailCard({ icon, label, value, subtitle }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value || "-"}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs font-medium text-blue-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ======================================================
// AMOUNT ROW
// ======================================================

function AmountRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

// ======================================================
// STATUS BOX
// ======================================================

function StatusBox({ label, value, success }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        success
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <p
        className={`text-xs ${success ? "text-emerald-600" : "text-amber-600"}`}
      >
        {label}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {success && <CheckCircle2 size={15} className="text-emerald-600" />}

        <p
          className={`text-sm font-bold capitalize ${
            success ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {value || "Pending"}
        </p>
      </div>
    </div>
  );
}
