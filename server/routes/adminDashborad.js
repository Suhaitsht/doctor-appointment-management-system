const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getAdminDashboardStats,
  getDashboardDoctors,
  getDashboardPatients,
  getDashboardAppointments,
  getDashboardRevenue,
} = require("../controllers/adminDashboardController");

const {
  getAdminTransactions,
  getAdminTransactionById,
  getMonthlyRevenue,
  getRevenueReport,
  exportTransactionsCsv,
} = require("../controllers/adminFinanceController");

// ======================================================
// ADMIN DASHBOARD ROUTES
// All endpoints require a valid Admin JWT
// ======================================================

// GET DASHBOARD STATS
router.get("/stats", protect, authorizeRoles("admin"), getAdminDashboardStats);

// GET RECENT DOCTORS
router.get("/doctors", protect, authorizeRoles("admin"), getDashboardDoctors);

// GET RECENT PATIENTS
router.get("/patients", protect, authorizeRoles("admin"), getDashboardPatients);

// GET RECENT APPOINTMENTS
router.get(
  "/appointments",
  protect,
  authorizeRoles("admin"),
  getDashboardAppointments,
);

// GET REVENUE
router.get("/revenue", protect, authorizeRoles("admin"), getDashboardRevenue);

// ======================================================
// ADMIN FINANCE ROUTES
// ======================================================

router.get(
  "/transactions",
  protect,
  authorizeRoles("admin"),
  getAdminTransactions,
);

router.get(
  "/transactions/export",
  protect,
  authorizeRoles("admin"),
  exportTransactionsCsv,
);

router.get(
  "/transactions/:id",
  protect,
  authorizeRoles("admin"),
  getAdminTransactionById,
);

router.get(
  "/revenue/monthly",
  protect,
  authorizeRoles("admin"),
  getMonthlyRevenue,
);

router.get(
  "/reports/revenue",
  protect,
  authorizeRoles("admin"),
  getRevenueReport,
);

module.exports = router;
