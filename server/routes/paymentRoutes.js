const express = require("express");

const {
  initializePayment,
  retryPayment,
  payHereNotify,
  getPaymentStatus,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// PAYHERE SERVER-TO-SERVER CALLBACK
// ======================================================

// Public endpoint.
// PayHere does not send your application's JWT.
// The controller MUST verify the PayHere signature,
// merchant ID, amount, currency and order ID.

router.post("/payhere/notify", payHereNotify);

// ======================================================
// INITIALIZE PAYMENT
// POST /api/payments/initialize
// ======================================================

router.post("/initialize", protect, initializePayment);

// ======================================================
// RETRY PAYMENT
// POST /api/payments/retry/:appointmentId
// ======================================================

router.post("/retry/:appointmentId", protect, retryPayment);

// ======================================================
// GET PAYMENT STATUS
// GET /api/payments/status/:orderId
// ======================================================

router.get("/status/:orderId", protect, getPaymentStatus);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
