const mongoose = require("mongoose");
const Payment = require("../models/payment");

// ======================================================
// CONFIGURATION
// ======================================================

const STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"];

const MAX_LIMIT = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ======================================================
// HELPER - DATE RANGE VALIDATION
// ======================================================

function parseDateRange(query) {
  const { from, to } = query;

  const isValidDate = (value) => {
    if (!value) return true;

    if (!DATE_RE.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  };

  if (!isValidDate(from) || !isValidDate(to) || (from && to && from > to)) {
    const error = new Error(
      "Invalid date range. Use YYYY-MM-DD and ensure from <= to.",
    );

    error.status = 400;
    throw error;
  }

  const createdAt = {};

  if (from) {
    createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    const endDate = new Date(`${to}T00:00:00.000Z`);

    createdAt.$lt = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

// ======================================================
// HELPER - BUILD PAYMENT FILTERS
// ======================================================

function buildMatch(query) {
  const match = {
    ...parseDateRange(query),
  };

  // PAYMENT STATUS FILTER

  if (query.status) {
    if (!STATUSES.includes(query.status)) {
      const error = new Error(`Invalid status. Use: ${STATUSES.join(", ")}`);

      error.status = 400;
      throw error;
    }

    match.status = query.status;
  }

  // CURRENCY FILTER

  if (query.currency) {
    const currency = String(query.currency).toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      const error = new Error("Currency must be a 3-letter ISO code.");

      error.status = 400;
      throw error;
    }

    match.currency = currency;
  }

  // SEARCH ORDER ID / PAYMENT ID

  if (query.search) {
    const search = String(query.search).trim();

    if (search.length > 100) {
      const error = new Error("Search must be 100 characters or fewer.");

      error.status = 400;
      throw error;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      match.$or = [
        {
          orderId: {
            $regex: escaped,
            $options: "i",
          },
        },
        {
          paymentId: {
            $regex: escaped,
            $options: "i",
          },
        },
      ];
    }
  }

  return match;
}

// ======================================================
// HELPER - ERROR HANDLER
// ======================================================

function handleError(res, error, label) {
  if (error.status === 400) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(label, error);

  return res.status(500).json({
    success: false,
    message: "Unable to process finance request.",
  });
}

// ======================================================
// HELPER - POPULATE PAYMENT DETAILS
// ======================================================

const populate = [
  {
    path: "patient",
    select: "name firstName lastName email phone image",
  },
  {
    path: "appointment",
    select: "doctor appointmentDate timeSlot status",
    populate: {
      path: "doctor",
      select: "displayName speciality user",
      populate: {
        path: "user",
        select: "name firstName lastName",
      },
    },
  },
];

// ======================================================
// 1. GET ALL ADMIN TRANSACTIONS
// GET /api/admin/dashboard/transactions
// ======================================================

const getAdminTransactions = async (req, res) => {
  try {
    const match = buildMatch(req.query);

    const page = Math.max(
      1,
      Math.min(1000000, Number.parseInt(req.query.page, 10) || 1),
    );

    const limit = Math.max(
      1,
      Math.min(MAX_LIMIT, Number.parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      Payment.countDocuments(match),

      Payment.find(match)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate(populate)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      transactions: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(res, error, "ADMIN TRANSACTIONS ERROR:");
  }
};

// ======================================================
// 2. GET SINGLE TRANSACTION
// GET /api/admin/dashboard/transactions/:id
// ======================================================

const getAdminTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Payment.findById(id).populate(populate).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction fetched successfully",
      transaction,
    });
  } catch (error) {
    return handleError(res, error, "ADMIN TRANSACTION ERROR:");
  }
};

// ======================================================
// 3. GET MONTHLY REVENUE
// GET /api/admin/dashboard/revenue/monthly
// ======================================================

const getMonthlyRevenue = async (req, res) => {
  try {
    const match = buildMatch(req.query);

    const results = await Payment.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            currency: "$currency",
            status: "$status",
          },
          amount: {
            $sum: "$amount",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
          "_id.currency": 1,
          "_id.status": 1,
        },
      },
    ]);

    const monthly = new Map();

    for (const row of results) {
      const { month, currency, status } = row._id;

      const paymentCurrency = currency || "LKR";

      const key = `${month}:${paymentCurrency}`;

      if (!monthly.has(key)) {
        monthly.set(key, {
          month,
          currency: paymentCurrency,
          paidRevenue: 0,
          refundedAmount: 0,
          paidCount: 0,
          refundedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          cancelledCount: 0,
        });
      }

      const item = monthly.get(key);

      if (status === "paid") {
        item.paidRevenue += row.amount;
        item.paidCount += row.count;
      }

      if (status === "refunded") {
        item.refundedAmount += row.amount;
        item.refundedCount += row.count;
      }

      if (status === "pending") {
        item.pendingCount += row.count;
      }

      if (status === "failed") {
        item.failedCount += row.count;
      }

      if (status === "cancelled") {
        item.cancelledCount += row.count;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Monthly revenue fetched successfully",

      // Uses payment creation month and current status.
      // This is not a historical settlement cashflow report.
      basis: "payment.createdAt (UTC); current status, not historical cashflow",

      monthly: [...monthly.values()],
    });
  } catch (error) {
    return handleError(res, error, "MONTHLY REVENUE ERROR:");
  }
};

// ======================================================
// 4. GET REVENUE REPORT
// GET /api/admin/dashboard/reports/revenue
// ======================================================

const getRevenueReport = async (req, res) => {
  try {
    const match = buildMatch(req.query);

    const rows = await Payment.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            status: "$status",
          },
          count: {
            $sum: 1,
          },
          amount: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          "_id.currency": 1,
          "_id.status": 1,
        },
      },
    ]);

    const currencies = {};

    for (const row of rows) {
      const currency = row._id.currency || "LKR";

      if (!currencies[currency]) {
        currencies[currency] = {
          currency,
          paidRevenue: 0,
          refundedAmount: 0,
          transactionCount: 0,
          countsByStatus: {},
        };
      }

      const target = currencies[currency];

      target.transactionCount += row.count;

      target.countsByStatus[row._id.status] = row.count;

      if (row._id.status === "paid") {
        target.paidRevenue += row.amount;
      }

      if (row._id.status === "refunded") {
        target.refundedAmount += row.amount;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Revenue report fetched successfully",

      basis:
        "Current payment status, grouped by currency; no cross-currency sums",

      filters: {
        from: req.query.from || null,
        to: req.query.to || null,
        status: req.query.status || null,
        currency: req.query.currency || null,
      },

      byCurrency: Object.values(currencies),
    });
  } catch (error) {
    return handleError(res, error, "REVENUE REPORT ERROR:");
  }
};

// ======================================================
// 5. CSV EXPORT HELPER
// ======================================================

function csvCell(value) {
  let str = value == null ? "" : String(value);

  // Prevent spreadsheet formula injection.
  if (/^[\s]*[=+@\-\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

// ======================================================
// 6. EXPORT TRANSACTIONS AS CSV
// GET /api/admin/dashboard/transactions/export
// ======================================================

const exportTransactionsCsv = async (req, res) => {
  try {
    const match = buildMatch(req.query);

    const count = await Payment.countDocuments(match);

    if (count > 10000) {
      return res.status(400).json({
        success: false,
        message: "Export supports up to 10,000 records. Narrow the date range.",
      });
    }

    const records = await Payment.find(match)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .populate(populate)
      .lean();

    const header = [
      "Order ID",
      "Payment ID",
      "Patient",
      "Patient Email",
      "Doctor",
      "Amount",
      "Currency",
      "Status",
      "Method",
      "Created At",
    ];

    const rows = records.map((payment) => {
      const patient = payment.patient;

      const doctor = payment.appointment?.doctor;

      const doctorName =
        doctor?.displayName ||
        doctor?.user?.name ||
        [doctor?.user?.firstName, doctor?.user?.lastName]
          .filter(Boolean)
          .join(" ");

      const patientName =
        [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
        patient?.name;

      return [
        payment.orderId,
        payment.paymentId,
        patientName,
        patient?.email,
        doctorName,
        payment.amount,
        payment.currency,
        payment.status,
        payment.paymentMethod,
        payment.createdAt?.toISOString?.() || payment.createdAt,
      ]
        .map(csvCell)
        .join(",");
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="admin-transactions.csv"',
    );

    res.setHeader("Cache-Control", "no-store");

    const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    return handleError(res, error, "CSV EXPORT ERROR:");
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  getAdminTransactions,
  getAdminTransactionById,
  getMonthlyRevenue,
  getRevenueReport,
  exportTransactionsCsv,
};
