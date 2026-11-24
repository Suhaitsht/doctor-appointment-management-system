import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import {
  FaCircleXmark,
  FaHouse,
  FaArrowRotateRight,
  FaCalendarCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const PAYHERE_SCRIPT = "https://www.payhere.lk/lib/payhere.js";

const getToken = () => localStorage.getItem("token");

const isValidId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const getSavedCheckout = () => {
  try {
    return JSON.parse(sessionStorage.getItem("payhereCheckout") || "{}");
  } catch {
    return {};
  }
};

const loadPayHere = () =>
  new Promise((resolve, reject) => {
    if (window.payhere?.startPayment) {
      resolve(window.payhere);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-payhere-sdk="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.payhere), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("PayHere SDK failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PAYHERE_SCRIPT;
    script.async = true;
    script.dataset.payhereSdk = "true";

    script.onload = () => {
      if (window.payhere?.startPayment) {
        resolve(window.payhere);
      } else {
        reject(new Error("PayHere checkout is unavailable."));
      }
    };

    script.onerror = () => {
      reject(new Error("PayHere SDK failed to load."));
    };

    document.body.appendChild(script);
  });

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();

  const queryAppointmentId = searchParams.get("appointmentId");
  const queryOrderId = searchParams.get("orderId");

  const [appointmentId, setAppointmentId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [checking, setChecking] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const resolveAppointment = async () => {
      setChecking(true);
      setError("");

      const saved = getSavedCheckout();

      const currentOrderId = queryOrderId || saved.orderId || "";

      // Saved appointment is used only when its
      // order matches the current order.
      const savedAppointmentId =
        saved.orderId && currentOrderId && saved.orderId === currentOrderId
          ? saved.appointmentId
          : "";

      let resolvedId = isValidId(queryAppointmentId)
        ? queryAppointmentId
        : isValidId(savedAppointmentId)
          ? savedAppointmentId
          : "";

      if (active) {
        setOrderId(currentOrderId);
      }

      const token = getToken();

      // Verify the order against the backend.
      if (currentOrderId && token) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/payments/status/${encodeURIComponent(
              currentOrderId,
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = response.data;

          const verifiedId = data?.appointment?._id;

          if (isValidId(verifiedId)) {
            resolvedId = verifiedId;
          } else {
            resolvedId = "";
          }

          if (active) {
            setAppointmentStatus(data?.appointment?.status || "");

            setPaymentStatus(data?.appointment?.paymentStatus || "");
          }
        } catch (err) {
          console.error("Payment status lookup failed:", err);

          // Do not trust a stored appointment ID when
          // verification of the current order fails.
          resolvedId = "";
          if (active) {
            setError(
              "Unable to verify the previous payment. Open My Appointments to retry safely.",
            );
          }
        }
      }

      if (active) {
        setAppointmentId(resolvedId);
        setChecking(false);
      }
    };

    resolveAppointment();

    return () => {
      active = false;
    };
  }, [queryAppointmentId, queryOrderId]);

  const cannotRetry =
    appointmentStatus === "cancelled" ||
    appointmentStatus === "completed" ||
    paymentStatus === "paid" ||
    paymentStatus === "refunded";

  const handleRetryPayment = async () => {
    if (!isValidId(appointmentId)) {
      setError(
        "Appointment reference not found. Please open My Appointments and retry from the existing booking.",
      );
      return;
    }

    if (cannotRetry) {
      setError(
        "This appointment cannot be paid again. Please check My Appointments.",
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please log in to retry payment.");
      return;
    }

    try {
      setRetryLoading(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/payments/retry/${appointmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payment = response.data?.payment;

      if (!payment?.order_id) {
        throw new Error("Payment checkout information was not returned.");
      }

      // Store the new attempt so the cancel page
      // can recover it if PayHere omits URL params.
      sessionStorage.setItem(
        "payhereCheckout",
        JSON.stringify({
          appointmentId,
          orderId: payment.order_id,
        }),
      );

      const sdk = await loadPayHere();

      sdk.onCompleted = (completedOrderId) => {
        window.location.assign(
          `/payment/success?orderId=${encodeURIComponent(
            completedOrderId || payment.order_id,
          )}`,
        );
      };

      sdk.onDismissed = () => {
        window.location.assign(
          `/payment/cancel?appointmentId=${encodeURIComponent(
            appointmentId,
          )}&orderId=${encodeURIComponent(payment.order_id)}`,
        );
      };

      sdk.onError = (message) => {
        setError(message || "PayHere checkout encountered an error.");
        setRetryLoading(false);
      };

      sdk.startPayment(payment);
    } catch (err) {
      console.error("Retry payment failed:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to retry payment.",
      );

      setRetryLoading(false);
    }
  };

  const missingReference = !isValidId(appointmentId);

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <FaCircleXmark className="text-5xl text-red-500" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          Payment Cancelled
        </h1>

        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          Your payment checkout was cancelled or not completed. You can retry
          payment for your existing appointment.
        </p>

        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left">
          <div className="flex items-start gap-3">
            <FaTriangleExclamation className="mt-1 shrink-0 text-lg text-orange-500" />

            <div>
              <h3 className="font-semibold text-slate-900">
                Payment not completed
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your booking and payment statuses are verified separately. You
                do not need to create another appointment to retry payment.
              </p>
            </div>
          </div>
        </div>

        {appointmentId && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
            <p className="text-xs font-medium text-slate-500">
              Appointment Reference
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {appointmentId}
            </p>
          </div>
        )}

        {!checking && missingReference && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
            Appointment reference could not be recovered. Open My Appointments
            and retry from your existing appointment.
          </div>
        )}

        {cannotRetry && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-700">
            This appointment is already paid or closed. Please check its latest
            status before making another payment.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleRetryPayment}
          disabled={checking || retryLoading || missingReference || cannotRetry}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaArrowRotateRight className={retryLoading ? "animate-spin" : ""} />

          {checking
            ? "Checking Appointment..."
            : retryLoading
              ? "Preparing Payment..."
              : "Retry Payment"}
        </button>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/patient/appointments"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <FaCalendarCheck />
            My Appointments
          </Link>

          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FaHouse />
            Back Home
          </Link>
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-400">
          If money has already been deducted, verify your payment status before
          attempting another payment.
        </p>
      </div>
    </div>
  );
}
