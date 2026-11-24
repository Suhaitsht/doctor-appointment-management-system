"use strict";

const crypto = require("crypto");
const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Payment = require("../models/payment");
const Invoice = require("../models/invoiceModel");

const generateInvoiceNumber = require("../utils/generateInvoiceNumber");

const { createNotification } = require("../services/notificationService");

// ======================================================
// HELPERS
// ======================================================

const md5 = (value) =>
  crypto.createHash("md5").update(String(value)).digest("hex").toUpperCase();

const getId = (value) => String(value?._id || value || "");

const isClosed = (status) => ["cancelled", "completed"].includes(status);

const serverError = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
    }),
  });
};

const hasOtherPaidAttempts = async (appointmentId, excludePaymentId) => {
  return Boolean(
    await Payment.exists({
      appointment: appointmentId,
      status: "paid",
      _id: { $ne: excludePaymentId },
    }),
  );
};

// ======================================================
// CLOSED APPOINTMENT PAYMENT
// ======================================================

const markClosedAppointmentPaid = async (appointmentId) => {
  return Appointment.findOneAndUpdate(
    {
      _id: appointmentId,
      status: {
        $in: ["cancelled", "completed"],
      },
      paymentStatus: {
        $ne: "refunded",
      },
    },
    {
      $set: {
        paymentStatus: "paid",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

// ======================================================
// CREATE INVOICE ONCE
// ======================================================

const ensureInvoice = async (appointment, payment) => {
  const existing = await Invoice.findOne({
    appointment: appointment._id,
  });

  if (existing) {
    return existing;
  }

  try {
    return await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),

      patient: appointment.patient,
      doctor: appointment.doctor,

      appointment: appointment._id,
      payment: payment._id,

      consultationFee: Number(appointment.consultationFee || 0),

      bookingFee: Number(appointment.bookingFee || 0),

      tax: Number(appointment.tax || 0),

      discount: Number(appointment.discount || 0),

      totalAmount: Number(appointment.totalAmount || 0),

      paymentStatus: "paid",
      issuedAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      const invoice = await Invoice.findOne({
        appointment: appointment._id,
      });

      if (invoice) {
        return invoice;
      }
    }

    throw error;
  }
};

// ======================================================
// PAYMENT SUCCESS NOTIFICATIONS
// PATIENT + DOCTOR
// ======================================================

const sendPaymentSuccessNotifications = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "name email")
    .populate({
      path: "doctor",
      select: "user",
      populate: {
        path: "user",
        select: "name email",
      },
    });

  if (
    !appointment ||
    appointment.status !== "confirmed" ||
    appointment.paymentStatus !== "paid"
  ) {
    return;
  }

  const patientName =
    [
      appointment.patientDetails?.firstName,
      appointment.patientDetails?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    appointment.patient?.name ||
    "Patient";

  const doctorName = appointment.doctor?.user?.name || "Doctor";

  const date = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
        timeZone: "UTC",
      })
    : "N/A";

  const time =
    [appointment.timeSlot?.startTime, appointment.timeSlot?.endTime]
      .filter(Boolean)
      .join(" - ") || "N/A";

  const amount = Number(appointment.totalAmount || 0).toFixed(2);

  const recipients = [
    {
      recipient: appointment.patient?._id,

      title: "Payment Successful",

      message:
        `Dear ${patientName}, your payment of ` +
        `LKR ${amount} was successful. ` +
        `Your appointment with ${doctorName} ` +
        `on ${date} at ${time} is confirmed.`,

      link: "/patient/appointments",
    },

    {
      recipient: appointment.doctor?.user?._id,

      title: "Appointment Payment Received",

      message:
        `${patientName} has completed payment ` +
        `of LKR ${amount} for the appointment ` +
        `on ${date} at ${time}.`,

      link: "/doctor/requests",
    },
  ];

  for (const item of recipients) {
    if (!item.recipient) {
      continue;
    }

    try {
      await createNotification({
        ...item,

        type: "payment_success",

        eventKey: `payment_success:${appointment._id}`,

        sendEmail: true,
      });
    } catch (error) {
      console.error("PAYMENT NOTIFICATION ERROR:", error);
    }
  }
};

// ======================================================
// PREPARE PAYHERE CHECKOUT
// ======================================================

const prepareCheckout = async (req, res, appointmentId, isRetry = false) => {
  // ----------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------

  if (!req.user?._id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!mongoose.isValidObjectId(appointmentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment ID.",
    });
  }

  // ----------------------------------------------
  // FIND APPOINTMENT
  // ----------------------------------------------

  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "name email phone")
    .populate({
      path: "doctor",
      populate: {
        path: "user",
        select: "name isActive",
      },
    });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  // ----------------------------------------------
  // VERIFY PATIENT OWNERSHIP
  // ----------------------------------------------

  if (getId(appointment.patient) !== getId(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to pay this appointment.",
    });
  }

  // ----------------------------------------------
  // VERIFY APPOINTMENT STATE
  // ----------------------------------------------

  if (isClosed(appointment.status)) {
    return res.status(409).json({
      success: false,
      message: "Cancelled or completed appointments cannot be paid.",
    });
  }

  if (appointment.paymentStatus === "paid") {
    return res.status(409).json({
      success: false,
      message: "Appointment is already paid.",
    });
  }

  if (appointment.paymentStatus === "refunded") {
    return res.status(409).json({
      success: false,
      message: "Refunded appointment cannot be paid again.",
    });
  }

  if (!appointment.doctor) {
    return res.status(409).json({
      success: false,
      message: "Doctor profile is unavailable.",
    });
  }

  if (appointment.expiresAt && new Date(appointment.expiresAt) <= new Date()) {
    return res.status(409).json({
      success: false,
      message: "Appointment reservation has expired.",
    });
  }

  // ----------------------------------------------
  // PAYMENT AMOUNT
  // ----------------------------------------------

  const amountNumber = Number(appointment.totalAmount);

  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount.",
    });
  }

  const amount = amountNumber.toFixed(2);

  // ----------------------------------------------
  // PAYHERE CONFIGURATION
  // ----------------------------------------------

  const currency = process.env.PAYHERE_CURRENCY || "LKR";

  const merchantId = process.env.PAYHERE_MERCHANT_ID;

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");

  const backendUrl = process.env.BACKEND_PUBLIC_URL?.replace(/\/$/, "");

  if (!merchantId || !merchantSecret || !frontendUrl || !backendUrl) {
    return res.status(500).json({
      success: false,
      message: "PayHere configuration is missing.",
    });
  }

  // ----------------------------------------------
  // GENERATE UNIQUE ORDER ID
  // ----------------------------------------------

  const orderId =
    `APT-${appointment._id}-` + crypto.randomBytes(6).toString("hex");

  // ----------------------------------------------
  // GENERATE PAYHERE HASH
  // ----------------------------------------------

  const hash = md5(
    merchantId + orderId + amount + currency + md5(merchantSecret),
  );

  // ----------------------------------------------
  // CREATE PAYMENT ATTEMPT
  // ----------------------------------------------

  const paymentRecord = await Payment.create({
    appointment: appointment._id,
    patient: appointment.patient._id,

    orderId,
    amount: amountNumber,
    currency,

    status: "pending",
  });

  // ----------------------------------------------
  // PAYMENT URLS
  // ----------------------------------------------

  const returnUrl =
    `${frontendUrl}/payment/success` +
    `?orderId=${encodeURIComponent(orderId)}`;

  const cancelUrl =
    `${frontendUrl}/payment/cancel` +
    `?appointmentId=${appointment._id}` +
    `&orderId=${encodeURIComponent(orderId)}`;

  // ----------------------------------------------
  // PAYHERE CHECKOUT DATA
  // ----------------------------------------------

  const payment = {
    sandbox: process.env.PAYHERE_SANDBOX !== "false",

    merchant_id: merchantId,

    return_url: returnUrl,
    cancel_url: cancelUrl,

    notify_url: `${backendUrl}/api/payments/payhere/notify`,

    order_id: orderId,

    items: `Doctor Appointment ${appointment._id}`,

    currency,
    amount,

    first_name:
      appointment.patientDetails?.firstName ||
      appointment.patient?.name ||
      "Patient",

    last_name: appointment.patientDetails?.lastName || "",

    email:
      appointment.patientDetails?.email || appointment.patient?.email || "",

    phone:
      appointment.patientDetails?.phone || appointment.patient?.phone || "",

    address: "Jayanthi Medical Centre",
    city: "Kekirawa",
    country: "Sri Lanka",

    hash,
  };

  return res.status(200).json({
    success: true,

    message: isRetry ? "Payment retry initialized." : "Payment initialized.",

    payment,
    orderId,

    paymentRecordId: paymentRecord._id,
    appointmentId: appointment._id,
  });
};

// ======================================================
// 1. INITIALIZE PAYMENT
// POST /api/payments/initialize
// ======================================================

exports.initializePayment = async (req, res) => {
  try {
    return await prepareCheckout(req, res, req.body?.appointmentId, false);
  } catch (error) {
    return serverError(res, error, "Unable to initialize payment.");
  }
};

// ======================================================
// 2. RETRY PAYMENT
// POST /api/payments/retry/:appointmentId
// ======================================================

exports.retryPayment = async (req, res) => {
  try {
    return await prepareCheckout(req, res, req.params.appointmentId, true);
  } catch (error) {
    return serverError(res, error, "Unable to retry payment.");
  }
};

// ======================================================
// 3. PAYHERE SERVER CALLBACK
// POST /api/payments/payhere/notify
// ======================================================

exports.payHereNotify = async (req, res) => {
  try {
    // ----------------------------------------------
    // EXTRACT CALLBACK DATA
    // ----------------------------------------------

    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
      status_message,
    } = req.body || {};

    // ----------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // ----------------------------------------------

    if (
      !merchant_id ||
      !order_id ||
      !payhere_amount ||
      !payhere_currency ||
      status_code === undefined ||
      status_code === null ||
      !md5sig
    ) {
      return res.status(400).send("Invalid notification");
    }

    // ----------------------------------------------
    // VERIFY MERCHANT ID
    // ----------------------------------------------

    if (merchant_id !== process.env.PAYHERE_MERCHANT_ID) {
      return res.status(400).send("Invalid merchant");
    }

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
      return res.status(500).send("Payment configuration error");
    }

    // ----------------------------------------------
    // VERIFY PAYHERE SIGNATURE
    // ----------------------------------------------

    const signature = md5(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        md5(merchantSecret),
    );

    const expected = Buffer.from(signature, "utf8");

    const received = Buffer.from(String(md5sig).toUpperCase(), "utf8");

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(expected, received)
    ) {
      return res.status(400).send("Invalid signature");
    }

    // ----------------------------------------------
    // FIND PAYMENT ATTEMPT
    // ----------------------------------------------

    const payment = await Payment.findOne({
      orderId: order_id,
    });

    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    // ----------------------------------------------
    // VERIFY AMOUNT
    // ----------------------------------------------

    const callbackAmount = Number(payhere_amount);

    if (
      !Number.isFinite(callbackAmount) ||
      callbackAmount <= 0 ||
      Number(payment.amount).toFixed(2) !== callbackAmount.toFixed(2)
    ) {
      return res.status(400).send("Amount mismatch");
    }

    // ----------------------------------------------
    // VERIFY CURRENCY
    // ----------------------------------------------

    if (payment.currency !== payhere_currency) {
      return res.status(400).send("Currency mismatch");
    }

    // ----------------------------------------------
    // FIND APPOINTMENT
    // ----------------------------------------------

    const appointment = await Appointment.findById(payment.appointment);

    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    const code = String(status_code);

    // ----------------------------------------------
    // PAYMENT METADATA
    // ----------------------------------------------

    const metadata = {
      paymentId: payment_id || payment.paymentId || "",

      paymentMethod: method || payment.paymentMethod || "",

      statusCode: code,

      statusMessage: status_message || "",
    };

    // ==================================================
    // PAYMENT SUCCESS - STATUS 2
    // ==================================================

    if (code === "2") {
      // Do not reopen a refunded payment.

      if (payment.status === "refunded") {
        return res.status(200).send("OK");
      }

      // ----------------------------------------------
      // ATOMIC PAYMENT TRANSITION
      // ----------------------------------------------

      const newlyPaidPayment = await Payment.findOneAndUpdate(
        {
          _id: payment._id,

          status: {
            $nin: ["paid", "refunded"],
          },
        },

        {
          $set: {
            ...metadata,
            status: "paid",
          },
        },

        {
          new: true,
          runValidators: true,
        },
      );

      const effectivePayment =
        newlyPaidPayment || (await Payment.findById(payment._id));

      if (!effectivePayment) {
        return res.status(404).send("Payment not found");
      }

      if (effectivePayment.status === "refunded") {
        return res.status(200).send("OK");
      }

      // ----------------------------------------------
      // ATOMIC APPOINTMENT CONFIRMATION
      // ----------------------------------------------

      const confirmed = await Appointment.findOneAndUpdate(
        {
          _id: appointment._id,

          status: {
            $in: ["pending", "confirmed"],
          },

          paymentStatus: {
            $nin: ["paid", "refunded"],
          },
        },

        {
          $set: {
            paymentStatus: "paid",
            status: "confirmed",
          },
        },

        {
          new: true,
          runValidators: true,
        },
      );

      // ----------------------------------------------
      // NEWLY CONFIRMED APPOINTMENT
      // ----------------------------------------------

      if (confirmed) {
        // Generate invoice.

        await ensureInvoice(confirmed, effectivePayment);

        // Send patient + doctor notifications.

        try {
          await sendPaymentSuccessNotifications(confirmed._id);
        } catch (error) {
          console.error("PAYMENT NOTIFICATION ERROR:", error);
        }

        console.log("PayHere payment successful:", order_id);

        return res.status(200).send("OK");
      }

      // ----------------------------------------------
      // RECHECK APPOINTMENT STATE
      // ----------------------------------------------

      const current = await Appointment.findById(appointment._id);

      if (!current) {
        return res.status(404).send("Appointment not found");
      }

      // ----------------------------------------------
      // DUPLICATE CALLBACK
      // ----------------------------------------------

      if (current.status === "confirmed" && current.paymentStatus === "paid") {
        await ensureInvoice(current, effectivePayment);

        // A separate payment attempt may have
        // succeeded for the same appointment.

        if (
          newlyPaidPayment &&
          (await hasOtherPaidAttempts(current._id, payment._id))
        ) {
          console.error("MULTIPLE PAID ATTEMPTS:", order_id);
        }

        return res.status(200).send("OK");
      }

      // ----------------------------------------------
      // CLOSED APPOINTMENT
      // ----------------------------------------------

      if (isClosed(current.status)) {
        const closed = await markClosedAppointmentPaid(current._id);

        console.error("CLOSED APPOINTMENT PAYMENT:", {
          orderId: order_id,

          appointmentId: getId(current),

          status: closed?.status || current.status,

          action: "Manual reconciliation required",
        });

        return res.status(200).send("OK");
      }

      // ----------------------------------------------
      // REFUNDED APPOINTMENT
      // ----------------------------------------------

      if (current.paymentStatus === "refunded") {
        console.error("PAYMENT AFTER REFUND:", order_id);

        return res.status(200).send("OK");
      }

      console.error("PAYMENT STATE REQUIRES RECONCILIATION:", order_id);

      return res.status(409).send("Appointment state requires reconciliation");
    }

    // ==================================================
    // REFUND - STATUS -3
    // ==================================================

    if (code === "-3") {
      await Payment.updateOne(
        {
          _id: payment._id,

          status: {
            $ne: "refunded",
          },
        },

        {
          $set: {
            ...metadata,
            status: "refunded",
          },
        },
      );

      // Check other successful attempts.

      const anotherPaid = await hasOtherPaidAttempts(
        appointment._id,
        payment._id,
      );

      if (!anotherPaid) {
        await Appointment.updateOne(
          {
            _id: appointment._id,
            paymentStatus: "paid",
          },

          {
            $set: {
              paymentStatus: "refunded",
            },
          },
        );

        await Invoice.updateOne(
          {
            appointment: appointment._id,
          },

          {
            $set: {
              paymentStatus: "refunded",
            },
          },
        );
      }

      console.log("PayHere refund notification:", order_id);

      return res.status(200).send("OK");
    }

    // ==================================================
    // PENDING / FAILED / CANCELLED
    // ==================================================

    const statusMap = {
      0: "pending",
      "-1": "cancelled",
      "-2": "failed",
    };

    const nextStatus = statusMap[code];

    if (!nextStatus) {
      console.warn("Unknown PayHere status:", code);

      return res.status(200).send("OK");
    }

    // ----------------------------------------------
    // NEVER DOWNGRADE PAID / REFUNDED
    // ----------------------------------------------

    const result = await Payment.updateOne(
      {
        _id: payment._id,

        status: {
          $nin: ["paid", "refunded"],
        },
      },

      {
        $set: {
          ...metadata,
          status: nextStatus,
        },
      },
    );

    // ----------------------------------------------
    // HANDLE FAILED OR CANCELLED CHECKOUT
    // ----------------------------------------------

    if ((code === "-1" || code === "-2") && result.modifiedCount > 0) {
      const anyPaid = await Payment.exists({
        appointment: appointment._id,
        status: "paid",
      });

      if (!anyPaid) {
        // Failed payment does not cancel
        // the appointment automatically.

        await Appointment.updateOne(
          {
            _id: appointment._id,

            status: "pending",

            paymentStatus: {
              $nin: ["paid", "refunded"],
            },
          },

          {
            $set: {
              paymentStatus: "failed",
            },
          },
        );
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("PayHere Notify Error:", error);

    return res.status(500).send("Server error");
  }
};

// ======================================================
// 4. GET PAYMENT STATUS
// GET /api/payments/status/:orderId
// ======================================================

exports.getPaymentStatus = async (req, res) => {
  try {
    // ----------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    // ----------------------------------------------
    // FIND PAYMENT
    // ----------------------------------------------

    const payment = await Payment.findOne({
      orderId,
    }).populate({
      path: "appointment",

      populate: [
        {
          path: "doctor",

          populate: {
            path: "user",
            select: "name email image",
          },
        },

        {
          path: "patient",
          select: "name email phone image",
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    // ----------------------------------------------
    // AUTHORIZE PATIENT
    // ----------------------------------------------

    if (getId(payment.patient) !== getId(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment.",
      });
    }

    const appointment = payment.appointment;

    // ----------------------------------------------
    // FIND INVOICE
    // ----------------------------------------------

    const invoice = appointment?._id
      ? await Invoice.findOne({
          appointment: appointment._id,
        }).select("_id invoiceNumber totalAmount paymentStatus issuedAt")
      : null;

    const refundRequired =
      appointment?.status === "cancelled" &&
      appointment?.paymentStatus === "paid";

    // ----------------------------------------------
    // RESPONSE
    // ----------------------------------------------

    return res.status(200).json({
      success: true,

      payment: {
        orderId: payment.orderId,
        paymentId: payment.paymentId,

        amount: payment.amount,
        currency: payment.currency,

        status: payment.status,

        paymentMethod: payment.paymentMethod,

        statusCode: payment.statusCode,

        statusMessage: payment.statusMessage,

        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },

      appointment: appointment
        ? {
            _id: appointment._id,

            appointmentDate: appointment.appointmentDate,

            timeSlot: appointment.timeSlot,

            appointmentType: appointment.appointmentType,

            status: appointment.status,

            paymentStatus: appointment.paymentStatus,

            consultationFee: appointment.consultationFee,

            bookingFee: appointment.bookingFee,

            tax: appointment.tax,
            discount: appointment.discount,

            totalAmount: appointment.totalAmount,

            patientDetails: appointment.patientDetails,

            doctor: appointment.doctor,
          }
        : null,

      refundRequired,

      refundProcessed: appointment?.paymentStatus === "refunded",

      paymentDisplayStatus: refundRequired
        ? "Paid - Refund Not Processed"
        : appointment?.paymentStatus || payment.status,

      invoice: invoice
        ? {
            _id: invoice._id,

            invoiceNumber: invoice.invoiceNumber,

            totalAmount: invoice.totalAmount,

            paymentStatus: invoice.paymentStatus,

            issuedAt: invoice.issuedAt,
          }
        : null,
    });
  } catch (error) {
    return serverError(res, error, "Unable to retrieve payment status.");
  }
};
