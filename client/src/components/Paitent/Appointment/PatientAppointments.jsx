import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaCalendarDays,
  FaChevronLeft,
  FaChevronRight,
  FaRotateRight,
  FaArrowRotateRight,
  FaXmark,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaHospital,
  FaUserDoctor,
  FaMoneyBillWave,
  FaFilePdf,
  FaStar,
} from "react-icons/fa6";

import { IoSearchOutline, IoAlertCircleOutline } from "react-icons/io5";

import {
  fetchMyAppointments,
  cancelAppointment,
  selectMyAppointments,
  selectMyAppointmentsLoading,
  selectMyAppointmentsError,
  selectMyAppointmentsTotal,
  selectCancellingAppointment,
  selectCancelAppointmentError,
  clearCancelAppointmentError,
} from "@/redux/slices/appointmentSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import AppointmentCard from "./AppointmentCard";
import DoctorReviewDialog from "./DoctorReviewDialog";

// =====================================================
// CONFIGURATION
// =====================================================

const PER_PAGE = 5;
const FETCH_LIMIT = 100;

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

const API_URL = (import.meta.env.VITE_API_URL || `${API_ORIGIN}/api`).replace(
  /\/$/,
  "",
);

const DEFAULT_DOCTOR_IMAGE = "/default-doctor.png";

const PAYHERE_SDK_URL = "https://www.payhere.lk/lib/payhere.js";

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const capitalize = (value = "") => {
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const getStatus = (appointment) =>
  String(
    appointment?.backendStatus || appointment?.status || "pending",
  ).toLowerCase();

const getPaymentStatus = (appointment) =>
  String(appointment?.paymentStatus || "pending").toLowerCase();

const getPaymentLabel = (appointment) => {
  const status = getStatus(appointment);
  const payment = getPaymentStatus(appointment);

  if (status === "cancelled" && payment === "paid") {
    return "Paid - Refund Not Processed";
  }

  return capitalize(payment);
};

const canRetryAppointment = (appointment) => {
  if (!appointment) return false;

  return (
    ["pending", "confirmed"].includes(getStatus(appointment)) &&
    ["pending", "failed", "cancelled"].includes(getPaymentStatus(appointment))
  );
};

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(date);
};

const formatCurrency = (value) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getDoctorName = (doctor, user) => {
  const name = String(
    user?.name ||
      user?.fullName ||
      doctor?.displayName ||
      doctor?.name ||
      "Doctor",
  ).trim();

  return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
};

const getDoctorImage = (doctor, user) => {
  const image =
    user?.image ||
    user?.profileImage ||
    user?.avatar ||
    doctor?.image ||
    doctor?.profileImage ||
    doctor?.avatar;

  if (!image || typeof image !== "string") {
    return DEFAULT_DOCTOR_IMAGE;
  }

  const path = image.trim().replace(/\\/g, "/");

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  if (path.startsWith("/uploads/")) {
    return `${API_ORIGIN}${path}`;
  }

  if (path.startsWith("uploads/")) {
    return `${API_ORIGIN}/${path}`;
  }

  if (path.startsWith("/")) {
    return `${API_ORIGIN}${path}`;
  }

  return `${API_ORIGIN}/uploads/${path}`;
};

// =====================================================
// NORMALIZE APPOINTMENT
// =====================================================

const normalizeAppointment = (appointment) => {
  const doctor =
    appointment?.doctor && typeof appointment.doctor === "object"
      ? appointment.doctor
      : {};

  const user =
    doctor?.user && typeof doctor.user === "object" ? doctor.user : {};

  const backendStatus = getStatus(appointment);
  const paymentStatus = getPaymentStatus(appointment);

  const status =
    backendStatus === "cancelled"
      ? "cancelled"
      : backendStatus === "completed"
        ? "completed"
        : "upcoming";

  const id = String(appointment?._id || appointment?.id || "");

  const startTime = appointment?.timeSlot?.startTime || "";
  const endTime = appointment?.timeSlot?.endTime || "";

  const appointmentType = appointment?.appointmentType || "Clinic";

  return {
    ...appointment,

    id,
    displayId: id ? `#Apt${id.slice(-6).toUpperCase()}` : "#Appointment",

    doctor: getDoctorName(doctor, user),
    doctorId: doctor?._id || "",
    doctorUserId: user?._id || "",

    image: getDoctorImage(doctor, user),
    speciality: doctor?.speciality || user?.speciality || "Specialist",

    hospital: doctor?.hospital || "Jayanthi Medical Centre",
    email: user?.email || doctor?.email || "",
    phone: user?.phone || doctor?.phone || "",

    date: formatDate(appointment?.appointmentDate),
    startTime,
    endTime,

    time:
      startTime && endTime
        ? `${startTime} - ${endTime}`
        : startTime || "Time not available",

    appointmentType,
    visitType: appointmentType,

    mode: appointmentType === "Online" ? "Online Consultation" : "Direct Visit",

    backendStatus,
    status,
    paymentStatus,

    doctorStatus: String(appointment?.doctorStatus || "pending").toLowerCase(),

    paymentDisplayStatus: getPaymentLabel(appointment),

    consultationFee: Number(appointment?.consultationFee) || 0,
    bookingFee: Number(appointment?.bookingFee) || 0,
    tax: Number(appointment?.tax) || 0,
    discount: Number(appointment?.discount) || 0,
    totalAmount: Number(appointment?.totalAmount) || 0,

    cancellationReason: appointment?.cancellationReason || "",
    cancelledAt: appointment?.cancelledAt || null,
  };
};

// =====================================================
// PAYHERE SDK
// =====================================================

let payhereLoaderPromise = null;

const loadPayHereSDK = () => {
  if (window.payhere?.startPayment) {
    return Promise.resolve(window.payhere);
  }

  if (payhereLoaderPromise) return payhereLoaderPromise;

  payhereLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${PAYHERE_SDK_URL}"]`,
    );

    const script = existingScript || document.createElement("script");

    const onLoad = () => {
      if (window.payhere?.startPayment) {
        resolve(window.payhere);
      } else {
        reject(new Error("PayHere SDK is unavailable."));
      }
    };

    const onError = () => reject(new Error("Unable to load PayHere SDK."));

    if (!existingScript) {
      script.src = PAYHERE_SDK_URL;
      script.async = true;
      script.dataset.payhereSdk = "true";
    }

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existingScript) {
      document.body.appendChild(script);
    } else if (window.payhere?.startPayment) {
      resolve(window.payhere);
    }
  }).catch((error) => {
    payhereLoaderPromise = null;
    throw error;
  });

  return payhereLoaderPromise;
};

// =====================================================
// PDF DOWNLOAD
// =====================================================

const downloadAppointmentPDF = (appointment) => {
  if (!appointment) return;

  try {
    const doc = new jsPDF();
    const patient = appointment.patientDetails || {};

    const patientName =
      `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "N/A";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("Jayanthi Medical Centre", 105, 20, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Kekirawa, Sri Lanka", 105, 27, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Appointment Receipt", 105, 40, {
      align: "center",
    });

    doc.line(20, 46, 190, 46);

    const addTable = (title, rows, startY) => {
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, 20, startY);

      autoTable(doc, {
        startY: startY + 5,
        theme: "grid",
        head: [["Field", "Details"]],
        body: rows.map(([key, value]) => [String(key), String(value ?? "N/A")]),
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold" },
          1: { cellWidth: 115 },
        },
        margin: { left: 20, right: 20, bottom: 20 },
      });

      return doc.lastAutoTable.finalY + 12;
    };

    let y = addTable(
      "Appointment Information",
      [
        ["Appointment ID", appointment.displayId],
        ["Doctor", appointment.doctor],
        ["Speciality", appointment.speciality],
        ["Medical Centre", appointment.hospital],
        ["Appointment Date", appointment.date],
        ["Appointment Time", appointment.time],
        ["Appointment Type", appointment.appointmentType],
        ["Appointment Status", capitalize(appointment.backendStatus)],
        ["Payment Status", getPaymentLabel(appointment)],
      ],
      56,
    );

    y = addTable(
      "Patient Information",
      [
        ["Patient Name", patientName],
        ["Phone Number", patient.phone || "N/A"],
        ["Email Address", patient.email || "N/A"],
        ["Symptoms", patient.symptoms || "Not provided"],
      ],
      y,
    );

    if (appointment.backendStatus === "cancelled") {
      y = addTable(
        "Cancellation Information",
        [
          [
            "Cancellation Reason",
            appointment.cancellationReason || "Not provided",
          ],
          ["Cancelled At", formatDateTime(appointment.cancelledAt)],
        ],
        y,
      );
    }

    y = addTable(
      "Payment Summary",
      [
        ["Consultation Fee", formatCurrency(appointment.consultationFee)],
        ["Booking Fee", formatCurrency(appointment.bookingFee)],
        ["Tax", formatCurrency(appointment.tax)],
        ["Discount", formatCurrency(appointment.discount)],
        ["Total Amount", formatCurrency(appointment.totalAmount)],
      ],
      y,
    );

    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      `Booking Created: ${formatDateTime(appointment.createdAt)}`,
      20,
      y,
    );

    doc.text(
      `Last Updated: ${formatDateTime(appointment.updatedAt)}`,
      20,
      y + 6,
    );

    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      doc.setFontSize(8);

      doc.text(
        "Jayanthi Medical Centre - Appointment Management System",
        105,
        284,
        { align: "center" },
      );

      doc.text(`Page ${page} of ${pageCount}`, 105, 290, {
        align: "center",
      });
    }

    doc.save(
      `Appointment-${appointment.displayId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`,
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    window.alert("Unable to generate appointment PDF.");
  }
};

// =====================================================
// MAIN PATIENT APPOINTMENTS
// =====================================================

export default function PatientAppointments() {
  const dispatch = useDispatch();

  const appointments = useSelector(selectMyAppointments);
  const loading = useSelector(selectMyAppointmentsLoading);
  const error = useSelector(selectMyAppointmentsError);
  const totalAppointments = useSelector(selectMyAppointmentsTotal);
  const cancelling = useSelector(selectCancellingAppointment);
  const cancelError = useSelector(selectCancelAppointmentError);

  // Filters
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Details
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Cancellation
  const [cancelOpen, setCancelOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Messages
  const [successMessage, setSuccessMessage] = useState("");

  // Payment
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState("");

  // Reviews
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);

  // =====================================================
  // FETCH APPOINTMENTS
  // =====================================================

  const refresh = () =>
    dispatch(
      fetchMyAppointments({
        page: 1,
        limit: FETCH_LIMIT,
      }),
    );

  useEffect(() => {
    dispatch(
      fetchMyAppointments({
        page: 1,
        limit: FETCH_LIMIT,
      }),
    );
  }, [dispatch]);

  // =====================================================
  // FETCH MY REVIEWS
  // =====================================================

  const fetchReviews = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setReviewsLoaded(false);
      setReviewError("Please log in to manage reviews.");
      return false;
    }

    try {
      const response = await axios.get(`${API_URL}/reviews/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMyReviews(
        Array.isArray(response.data?.reviews) ? response.data.reviews : [],
      );

      setReviewsLoaded(true);
      setReviewError("");
      return true;
    } catch (err) {
      setReviewsLoaded(false);
      setReviewError(
        err.response?.data?.message || "Unable to load your reviews.",
      );
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const getAppointmentReview = (appointment) => {
    const id = String(appointment?.id || appointment?._id || "");

    return myReviews.find(
      (review) => String(review.appointment?._id || review.appointment) === id,
    );
  };

  const canWriteReview = (appointment) =>
    appointment?.backendStatus === "completed" &&
    appointment?.paymentStatus === "paid" &&
    appointment?.doctorStatus === "accepted";

  const openReview = (appointment) => {
    if (!canWriteReview(appointment) || !reviewsLoaded) return;

    setReviewAppointment(appointment);
    setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewOpen(false);
    setReviewAppointment(null);
  };

  const handleReviewSaved = async (message) => {
    const refreshed = await fetchReviews();

    if (!refreshed) {
      throw new Error(
        "Review was saved, but the updated review list could not be loaded.",
      );
    }

    setSuccessMessage(message);
  };

  // =====================================================
  // NORMALIZE
  // =====================================================

  const normalized = useMemo(
    () =>
      Array.isArray(appointments) ? appointments.map(normalizeAppointment) : [],
    [appointments],
  );

  const counts = useMemo(
    () => ({
      upcoming: normalized.filter((a) => a.status === "upcoming").length,

      cancelled: normalized.filter((a) => a.status === "cancelled").length,

      completed: normalized.filter((a) => a.status === "completed").length,
    }),
    [normalized],
  );

  // =====================================================
  // FILTERS
  // =====================================================

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalized.filter((a) => {
      const matchesTab = a.status === activeTab;

      const matchesPayment =
        paymentFilter === "all" || a.paymentStatus === paymentFilter;

      const matchesSearch =
        !keyword ||
        [a.doctor, a.displayId, a.speciality, a.hospital].some((value) =>
          String(value).toLowerCase().includes(keyword),
        );

      return matchesTab && matchesPayment && matchesSearch;
    });
  }, [normalized, activeTab, paymentFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visible = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const changeTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSuccessMessage("");
  };

  // =====================================================
  // RETRY PAYMENT
  // =====================================================

  const handleRetryPayment = async (appointment) => {
    if (retryLoading) return;

    const appointmentId = appointment?.id || appointment?._id;

    if (!appointmentId) {
      setRetryError("Appointment ID was not found.");
      return;
    }

    if (!canRetryAppointment(appointment)) {
      setRetryError("This appointment is not eligible for another payment.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setRetryError("Please log in before retrying payment.");
      return;
    }

    setRetryLoading(true);
    setRetryError("");

    try {
      const response = await axios.post(
        `${API_URL}/payments/retry/${appointmentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payment = response.data?.payment;

      if (!payment?.order_id || !payment?.merchant_id || !payment?.hash) {
        throw new Error("Incomplete PayHere checkout information.");
      }

      const payhere = await loadPayHereSDK();

      sessionStorage.setItem(
        "payhereCheckout",
        JSON.stringify({
          appointmentId,
          orderId: payment.order_id,
        }),
      );

      payhere.onCompleted = (completedOrderId) => {
        const finalOrderId = completedOrderId || payment.order_id;

        // Backend must verify payment on success page.
        window.location.assign(
          `/payment/success?orderId=${encodeURIComponent(finalOrderId)}`,
        );
      };

      payhere.onDismissed = () => {
        window.location.assign(
          `/payment/cancel?appointmentId=${encodeURIComponent(
            appointmentId,
          )}&orderId=${encodeURIComponent(payment.order_id)}`,
        );
      };

      payhere.onError = (message) => {
        setRetryError(message || "PayHere checkout encountered an error.");
      };

      payhere.startPayment(payment);
    } catch (err) {
      console.error("Retry payment failed:", err);

      setRetryError(
        err.response?.data?.message ||
          err.message ||
          "Unable to retry payment.",
      );
    } finally {
      setRetryLoading(false);
    }
  };

  // =====================================================
  // CANCEL APPOINTMENT
  // =====================================================

  const openCancel = (appointment) => {
    if (!appointment?.id) return;

    if (["cancelled", "completed"].includes(appointment.backendStatus)) {
      return;
    }

    dispatch(clearCancelAppointmentError());

    setAppointmentToCancel(appointment);
    setCancellationReason("");
    setCancelOpen(true);
  };

  const closeCancel = () => {
    if (cancelling) return;

    setCancelOpen(false);
    setAppointmentToCancel(null);
    setCancellationReason("");
    dispatch(clearCancelAppointmentError());
  };

  const confirmCancel = async () => {
    if (!appointmentToCancel?.id || cancelling) return;

    const reason = cancellationReason.trim();

    if (!reason || reason.length > 500) return;

    try {
      const result = await dispatch(
        cancelAppointment({
          appointmentId: appointmentToCancel.id,
          reason,
        }),
      ).unwrap();

      const paid =
        result?.appointment?.paymentStatus === "paid" ||
        appointmentToCancel.paymentStatus === "paid";

      setCancelOpen(false);
      setAppointmentToCancel(null);
      setCancellationReason("");

      setDetailsOpen(false);
      setSelectedAppointment(null);

      setActiveTab("cancelled");
      setSearch("");
      setPaymentFilter("all");
      setCurrentPage(1);

      setSuccessMessage(
        paid
          ? "Appointment cancelled. Payment remains paid; refund has not been processed."
          : "Appointment cancelled successfully.",
      );

      await refresh().unwrap();
    } catch (err) {
      console.error("Cancellation failed:", err);
    }
  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Appointments</h1>

          <p className="mt-1 text-xs text-slate-500">
            View and manage your appointments
          </p>
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          <div className="relative flex-1 md:w-[260px]">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <Input
              placeholder="Search doctor or appointment"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => {
              refresh();
              fetchReviews();
            }}
            title="Refresh appointments"
          >
            <FaRotateRight className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* TOTAL COUNT */}
      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
        Total appointments:
        <Badge variant="secondary">
          {totalAppointments ?? normalized.length}
        </Badge>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            <FaXmark />
          </button>
        </div>
      )}

      {/* REVIEW ERROR */}
      {reviewError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {reviewError}

          <button
            type="button"
            onClick={fetchReviews}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* TABS AND PAYMENT FILTER */}
      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {["upcoming", "cancelled", "completed"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => changeTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {capitalize(tab)} ({counts[tab]})
            </button>
          ))}
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* APPOINTMENT FETCH ERROR */}
      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <IoAlertCircleOutline className="text-xl text-red-500" />

          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">
              Unable to load appointments
            </p>

            <p className="mt-1 text-xs text-red-600">
              {typeof error === "string"
                ? error
                : error?.message || "Please try again."}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      {/* APPOINTMENT LIST */}
      {loading && normalized.length === 0 ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {visible.length ? (
              visible.map((appointment) => {
                const existingReview = getAppointmentReview(appointment);

                const reviewEligible = canWriteReview(appointment);

                return (
                  <div key={appointment.id}>
                    <AppointmentCard
                      appointment={appointment}
                      onView={(item) => {
                        setSelectedAppointment(item);
                        setRetryError("");
                        setDetailsOpen(true);
                      }}
                      onCancel={openCancel}
                    />

                    {/* DOCTOR REVIEW BUTTON */}
                    {reviewEligible && (
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
                        {existingReview && (
                          <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                            <FaStar />
                            {existingReview.rating}/5
                          </div>
                        )}

                        <Button
                          type="button"
                          disabled={!reviewsLoaded}
                          variant={existingReview ? "outline" : "default"}
                          onClick={() => openReview(appointment)}
                          className="gap-2"
                        >
                          <FaStar
                            className={
                              existingReview ? "text-amber-400" : "text-white"
                            }
                          />

                          {existingReview ? "Edit Review" : "Write Review"}
                        </Button>
                      </div>
                    )}

                    {/* PAID CANCELLATION WARNING */}
                    {appointment.backendStatus === "cancelled" &&
                      appointment.paymentStatus === "paid" && (
                        <div className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          Payment: Paid — Refund Not Processed
                        </div>
                      )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-14 text-center">
                <FaCalendarDays className="mx-auto text-3xl text-slate-400" />

                <p className="mt-4 text-sm font-medium">
                  No appointments found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No matching {activeTab} appointments.
                </p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <FaChevronLeft className="mr-2" />
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <FaChevronRight className="ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      <AppointmentDetailsModal
        open={detailsOpen}
        appointment={selectedAppointment}
        onClose={() => {
          if (retryLoading) return;

          setDetailsOpen(false);
          setSelectedAppointment(null);
          setRetryError("");
        }}
        onCancel={(appointment) => {
          setDetailsOpen(false);
          openCancel(appointment);
        }}
        onRetryPayment={handleRetryPayment}
        retryLoading={retryLoading}
        retryError={retryError}
        onReview={openReview}
        canReview={canWriteReview}
        getReview={getAppointmentReview}
        reviewsLoaded={reviewsLoaded}
      />

      {/* CANCEL MODAL */}
      <CancelAppointmentModal
        open={cancelOpen}
        appointment={appointmentToCancel}
        reason={cancellationReason}
        setReason={setCancellationReason}
        loading={cancelling}
        error={cancelError}
        onClose={closeCancel}
        onConfirm={confirmCancel}
      />

      {/* DOCTOR REVIEW MODAL */}
      <DoctorReviewDialog
        open={reviewOpen}
        appointment={reviewAppointment}
        existingReview={
          reviewAppointment ? getAppointmentReview(reviewAppointment) : null
        }
        onClose={closeReview}
        onSaved={handleReviewSaved}
      />
    </div>
  );
}

// =====================================================
// STATUS BADGES
// =====================================================

function AppointmentStatusBadge({ status }) {
  const value = String(status || "pending").toLowerCase();

  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <Badge className={styles[value] || "bg-slate-100 text-slate-700"}>
      Appointment: {capitalize(value)}
    </Badge>
  );
}

function PaymentStatusBadge({ appointment }) {
  const payment = getPaymentStatus(appointment);

  const cancelledAndPaid =
    getStatus(appointment) === "cancelled" && payment === "paid";

  const styles = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-orange-100 text-orange-700",
    refunded: "bg-purple-100 text-purple-700",
  };

  return (
    <Badge
      className={
        cancelledAndPaid
          ? "bg-amber-100 text-amber-800"
          : styles[payment] || "bg-slate-100 text-slate-700"
      }
    >
      Payment: {getPaymentLabel(appointment)}
    </Badge>
  );
}

// =====================================================
// APPOINTMENT DETAILS MODAL
// =====================================================

function AppointmentDetailsModal({
  open,
  appointment,
  onClose,
  onCancel,
  onRetryPayment,
  retryLoading,
  retryError,
  onReview,
  canReview,
  getReview,
  reviewsLoaded,
}) {
  useEffect(() => {
    if (!open || retryLoading) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, retryLoading]);

  if (!open || !appointment) return null;

  const status = getStatus(appointment);
  const patient = appointment.patientDetails || {};

  const canCancel = ["pending", "confirmed"].includes(status);
  const canRetry = canRetryAppointment(appointment);

  const patientName =
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "N/A";

  const existingReview = getReview(appointment);
  const reviewEligible = canReview(appointment);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !retryLoading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2
              id="appointment-details-title"
              className="text-lg font-semibold"
            >
              Appointment Details
            </h2>

            <p className="text-xs text-slate-500">{appointment.displayId}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={retryLoading}
            onClick={onClose}
          >
            <FaXmark />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="space-y-6 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <AppointmentStatusBadge status={status} />
            <PaymentStatusBadge appointment={appointment} />
          </div>

          {/* DOCTOR */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <img
                src={appointment.image || DEFAULT_DOCTOR_IMAGE}
                alt={appointment.doctor}
                className="h-20 w-20 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_DOCTOR_IMAGE;
                }}
              />

              <div>
                <h3 className="font-semibold">{appointment.doctor}</h3>

                <p className="text-sm text-blue-600">
                  {appointment.speciality}
                </p>

                <p className="text-xs text-slate-500">{appointment.hospital}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
              {appointment.email && (
                <span className="flex items-center gap-2">
                  <FaEnvelope />
                  {appointment.email}
                </span>
              )}

              {appointment.phone && (
                <span className="flex items-center gap-2">
                  <FaPhone />
                  {appointment.phone}
                </span>
              )}
            </div>
          </div>

          {/* APPOINTMENT INFORMATION */}
          <section>
            <h3 className="mb-3 font-semibold">Appointment Information</h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                icon={<FaCalendarDays />}
                label="Appointment Date"
                value={appointment.date}
              />

              <InfoCard
                icon={<FaClock />}
                label="Appointment Time"
                value={appointment.time}
              />

              <InfoCard
                icon={<FaHospital />}
                label="Appointment Type"
                value={appointment.appointmentType}
              />

              <InfoCard
                icon={<FaUserDoctor />}
                label="Speciality"
                value={appointment.speciality}
              />

              <InfoCard
                icon={<FaHospital />}
                label="Medical Centre"
                value={appointment.hospital}
              />

              <InfoCard
                icon={<FaMoneyBillWave />}
                label="Total Amount"
                value={formatCurrency(appointment.totalAmount)}
              />
            </div>
          </section>

          {/* PATIENT */}
          <section className="rounded-xl border p-4">
            <h3 className="font-semibold">Patient Information</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Patient Name" value={patientName} />
              <DetailItem label="Phone" value={patient.phone || "N/A"} />
              <DetailItem label="Email" value={patient.email || "N/A"} />
              <DetailItem
                label="Appointment Type"
                value={appointment.appointmentType}
              />
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-slate-500">
                Symptoms / Reason for Visit
              </p>

              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">
                {patient.symptoms || "No symptoms provided."}
              </p>
            </div>
          </section>

          {/* CANCELLATION */}
          {status === "cancelled" && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-700">
                Cancellation Information
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Cancellation Reason"
                  value={appointment.cancellationReason || "Not provided"}
                />

                <DetailItem
                  label="Cancelled At"
                  value={formatDateTime(appointment.cancelledAt)}
                />
              </div>

              {appointment.paymentStatus === "paid" && (
                <p className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-800">
                  This appointment was cancelled, but payment remains paid. A
                  refund has not been processed.
                </p>
              )}
            </section>
          )}

          {/* PAYMENT SUMMARY */}
          <section className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Payment Summary</h3>
              <PaymentStatusBadge appointment={appointment} />
            </div>

            <div className="mt-4 space-y-3">
              <PaymentRow
                label="Consultation Fee"
                amount={appointment.consultationFee}
              />
              <PaymentRow label="Booking Fee" amount={appointment.bookingFee} />
              <PaymentRow label="Tax" amount={appointment.tax} />

              {appointment.discount > 0 && (
                <PaymentRow label="Discount" amount={-appointment.discount} />
              )}

              <div className="border-t pt-3">
                <PaymentRow
                  label="Total Amount"
                  amount={appointment.totalAmount}
                  bold
                />
              </div>
            </div>
          </section>

          {/* PAYMENT RETRY INFO */}
          {canRetry && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <FaMoneyBillWave className="mt-1 shrink-0 text-blue-600" />

                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Payment Required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Your payment is not yet confirmed. You can retry payment for
                    this existing appointment without creating another booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REVIEW INFORMATION */}
          {reviewEligible && existingReview && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-slate-900">
                Your Doctor Review
              </h3>

              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={
                      star <= existingReview.rating
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  />
                ))}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                {existingReview.comment}
              </p>
            </section>
          )}

          {/* DATES */}
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 sm:grid-cols-2">
            <p>Booking Created: {formatDateTime(appointment.createdAt)}</p>
            <p>Last Updated: {formatDateTime(appointment.updatedAt)}</p>
          </div>
        </div>

        {/* RETRY ERROR */}
        {retryError && (
          <div
            role="alert"
            className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {retryError}
          </div>
        )}

        {/* FOOTER */}
        <div className="flex flex-col-reverse justify-between gap-3 border-t p-5 sm:flex-row">
          <Button
            onClick={() => downloadAppointmentPDF(appointment)}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <FaFilePdf />
            Download PDF
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* REVIEW */}
            {reviewEligible && (
              <Button
                type="button"
                disabled={!reviewsLoaded}
                variant={existingReview ? "outline" : "default"}
                onClick={() => {
                  onClose();
                  onReview(appointment);
                }}
                className="gap-2"
              >
                <FaStar className="text-amber-400" />
                {existingReview ? "Edit Review" : "Write Review"}
              </Button>
            )}

            {/* RETRY PAYMENT */}
            {canRetry && (
              <Button
                type="button"
                onClick={() => onRetryPayment(appointment)}
                disabled={retryLoading}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                <FaArrowRotateRight
                  className={retryLoading ? "animate-spin" : ""}
                />
                {retryLoading ? "Preparing Payment..." : "Retry Payment"}
              </Button>
            )}

            {/* CANCEL */}
            {canCancel && (
              <Button
                variant="destructive"
                disabled={retryLoading}
                onClick={() => onCancel(appointment)}
              >
                Cancel Appointment
              </Button>
            )}

            <Button variant="outline" disabled={retryLoading} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CANCEL APPOINTMENT MODAL
// =====================================================

function CancelAppointmentModal({
  open,
  appointment,
  reason,
  setReason,
  loading,
  error,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open || loading) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !appointment) return null;

  const paid = appointment.paymentStatus === "paid";

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 id="cancel-title" className="text-lg font-semibold">
              Cancel Appointment
            </h2>

            <p className="text-xs text-slate-500">{appointment.displayId}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            disabled={loading}
            onClick={onClose}
          >
            <FaXmark />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <IoAlertCircleOutline className="shrink-0 text-xl text-red-500" />

              <div>
                <p className="font-semibold text-red-700">Are you sure?</p>

                <p className="mt-1 text-sm text-red-600">
                  You are about to cancel your appointment with{" "}
                  {appointment.doctor}.
                </p>
              </div>
            </div>
          </div>

          {/* DOCTOR */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <img
                src={appointment.image || DEFAULT_DOCTOR_IMAGE}
                alt={appointment.doctor}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_DOCTOR_IMAGE;
                }}
              />

              <div>
                <p className="font-semibold">{appointment.doctor}</p>
                <p className="text-xs text-slate-500">
                  {appointment.speciality}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2">
              <p>Date: {appointment.date}</p>
              <p>Time: {appointment.time}</p>
            </div>
          </div>

          {/* PAID WARNING */}
          {paid && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This appointment has already been paid. Cancelling it will not
              automatically refund your payment.
            </div>
          )}

          {/* REASON */}
          <div>
            <label
              htmlFor="cancellationReason"
              className="text-sm font-medium text-slate-700"
            >
              Reason for cancellation *
            </label>

            <textarea
              id="cancellationReason"
              rows={4}
              maxLength={500}
              value={reason}
              disabled={loading}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please enter your reason..."
              className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {reason.length}/500
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {typeof error === "string"
                ? error
                : error?.message || "Unable to cancel appointment."}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <Button variant="outline" disabled={loading} onClick={onClose}>
            Close
          </Button>

          <Button
            variant="destructive"
            disabled={loading || !reason.trim()}
            onClick={onConfirm}
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value ?? "N/A"}
      </p>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {value ?? "N/A"}
      </p>
    </div>
  );
}

function PaymentRow({ label, amount, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold ? "text-sm font-bold text-slate-900" : "text-sm text-slate-600"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "text-sm font-bold text-slate-900"
            : "text-sm font-medium text-slate-800"
        }
      >
        {formatCurrency(amount)}
      </span>
    </div>
  );
}
