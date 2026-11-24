const express = require("express");

const {
  getMyInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");

const { authorizeRoles } = require("../middleware/roleMiddleware");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

// Logged-in patient invoices
router.get("/patient/me", protect, authorizeRoles("patient"), getMyInvoices);

// Single invoice
router.get("/:invoiceId", protect, getInvoiceById);

module.exports = router;
