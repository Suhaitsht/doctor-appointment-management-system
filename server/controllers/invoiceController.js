const Invoice = require("../models/invoiceModel");

// ======================================================
// GET LOGGED-IN PATIENT INVOICES
// GET /api/invoices/patient/me
// ======================================================

const getMyInvoices = async (req, res) => {
  try {
    const patientId = req.user?._id;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const invoices = await Invoice.find({
      patient: patientId,
    })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone image",
        },
      })
      .populate(
        "appointment",
        "appointmentDate timeSlot appointmentType status paymentStatus",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("GET MY INVOICES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching invoices.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ======================================================
// GET SINGLE INVOICE
// GET /api/invoices/:invoiceId
// ======================================================

const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone image",
        },
      })
      .populate("patient", "name email phone image")
      .populate(
        "appointment",
        "appointmentDate timeSlot patientDetails appointmentType consultationFee bookingFee tax discount totalAmount status paymentStatus doctorStatus createdAt",
      )
      .populate({
        path: "payment",
        select:
          "orderId paymentId payherePaymentId paymentMethod method gateway amount currency status createdAt",
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const isPatientOwner =
      invoice.patient?._id?.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isPatientOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get invoice",
      error: error.message,
    });
  }
};

module.exports = {
  getMyInvoices,
  getInvoiceById,
};
