const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Payment = require("../models/payment");

// ======================================================
// HELPER - PATIENT NAME
// ======================================================

const getPatientName = (patient) => {
  if (!patient) return "Unknown Patient";

  const fullName = [patient.firstName, patient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || patient.name || "Unknown Patient";
};

// ======================================================
// HELPER - REVENUE BY CURRENCY
// ======================================================

// A payment attempt has one status.
// "paid" contributes to gross revenue.
// "refunded" contributes to refunded totals.
//
// IMPORTANT:
// This assumes refunded payment records represent
// full refunds. Partial refunds require a separate
// refund amount field or refund transaction records.

const getRevenueSummary = async () => {
  const results = await Payment.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "refunded"],
        },
      },
    },
    {
      $group: {
        _id: {
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
  ]);

  const currencies = {};

  for (const item of results) {
    const currency = item._id.currency || "LKR";

    if (!currencies[currency]) {
      currencies[currency] = {
        currency,
        grossPaid: 0,
        refunded: 0,
        netRevenue: 0,
        paidTransactions: 0,
      };
    }

    if (item._id.status === "paid") {
      currencies[currency].grossPaid += item.amount;
      currencies[currency].paidTransactions += item.count;
    }

    if (item._id.status === "refunded") {
      currencies[currency].refunded += item.amount;
    }
  }

  const byCurrency = Object.values(currencies).map((item) => ({
    ...item,
    netRevenue: item.grossPaid - item.refunded,
  }));

  // LKR is the dashboard's primary currency.
  // Do not add different currencies together.

  const lkr = byCurrency.find((item) => item.currency === "LKR");

  return {
    currency: "LKR",
    totalRevenue: lkr?.netRevenue || 0,
    grossPaid: lkr?.grossPaid || 0,
    refunded: lkr?.refunded || 0,
    byCurrency,
  };
};

// ======================================================
// 1. GET ADMIN DASHBOARD STATS
// GET /api/admin/dashboard/stats
// ======================================================

const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      activeDoctors,
      activePatients,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      revenue,
    ] = await Promise.all([
      // Total doctor accounts
      User.countDocuments({
        role: "doctor",
      }),

      // Total patient accounts
      User.countDocuments({
        role: "patient",
      }),

      // Total appointments
      Appointment.countDocuments(),

      // Active doctors
      User.countDocuments({
        role: "doctor",
        isActive: true,
      }),

      // Active patients
      User.countDocuments({
        role: "patient",
        isActive: true,
      }),

      // Pending appointments
      Appointment.countDocuments({
        status: "pending",
      }),

      // Confirmed appointments
      Appointment.countDocuments({
        status: "confirmed",
      }),

      // Completed appointments
      Appointment.countDocuments({
        status: "completed",
      }),

      // Cancelled appointments
      Appointment.countDocuments({
        status: "cancelled",
      }),

      // Successful payment revenue
      getRevenueSummary(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",

      stats: {
        totalDoctors,
        activeDoctors,
        inactiveDoctors: totalDoctors - activeDoctors,

        totalPatients,
        activePatients,
        inactivePatients: totalPatients - activePatients,

        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,

        totalRevenue: revenue.totalRevenue,
        currency: revenue.currency,
      },

      revenue,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

// ======================================================
// 2. GET DASHBOARD DOCTORS LIST
// GET /api/admin/dashboard/doctors
// ======================================================

const getDashboardDoctors = async (req, res) => {
  try {
    // ==========================================
    // 1. GET LATEST DOCTORS WITH USER DETAILS
    // ==========================================

    const doctors = await Doctor.find()
      .populate({
        path: "user",
        select: "name firstName lastName email phone image isActive",
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(5)
      .lean();

    const doctorIds = doctors.map((doctor) => doctor._id);

    // ==========================================
    // 2. CALCULATE DOCTOR EARNINGS
    // ==========================================
    // Payment -> Appointment -> Doctor
    //
    // Only currently paid LKR transactions.
    // Excludes refunded, failed and pending.
    // ==========================================

    let earnings = [];

    if (doctorIds.length > 0) {
      earnings = await Payment.aggregate([
        {
          $match: {
            status: "paid",
            currency: "LKR",
          },
        },
        {
          $lookup: {
            from: Appointment.collection.name,
            localField: "appointment",
            foreignField: "_id",
            as: "appointmentDetails",
          },
        },
        {
          $unwind: "$appointmentDetails",
        },
        {
          $match: {
            "appointmentDetails.doctor": {
              $in: doctorIds,
            },
          },
        },
        {
          $group: {
            _id: "$appointmentDetails.doctor",
            totalEarned: {
              $sum: "$amount",
            },
          },
        },
      ]);
    }

    // ==========================================
    // 3. CREATE EARNINGS LOOKUP
    // ==========================================

    const earningsMap = new Map(
      earnings.map((item) => [String(item._id), item.totalEarned]),
    );

    // ==========================================
    // 4. FORMAT DOCTORS
    // ==========================================

    const formattedDoctors = doctors.map((doctor) => {
      const user = doctor.user;

      const userFullName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const doctorName =
        doctor.displayName?.trim() ||
        userFullName ||
        user?.name ||
        "Unknown Doctor";

      return {
        _id: doctor._id,

        user: user || null,

        name: doctorName,

        displayName: doctor.displayName,

        image: user?.image || "",

        speciality: doctor.speciality,

        designation: doctor.designation,

        hospital: doctor.hospital,

        consultationFee: doctor.consultationFee,

        isAvailable: doctor.isAvailable,

        isActive: user?.isActive ?? false,

        earned: earningsMap.get(String(doctor._id)) ?? 0,

        currency: "LKR",

        // No reviews model supplied yet.
        // Do not invent a rating.
        averageRating: null,

        memberSince: doctor.memberSince,
      };
    });

    // ==========================================
    // 5. SEND RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Dashboard doctors fetched successfully",

      total: formattedDoctors.length,

      doctors: formattedDoctors,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD DOCTORS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard doctors",
    });
  }
};

// ======================================================
// 3. GET DASHBOARD PATIENTS LIST
// GET /api/admin/dashboard/patients
// ======================================================

const getDashboardPatients = async (req, res) => {
  try {
    // ======================================
    // 1. GET RECENT PATIENTS
    // ======================================

    const patients = await User.find({
      role: "patient",
    })
      .select("name firstName lastName email phone image isActive createdAt")
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(5)
      .lean();

    const patientIds = patients.map((patient) => patient._id);

    if (patientIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Dashboard patients fetched successfully",
        total: 0,
        patients: [],
      });
    }

    // ======================================
    // 2. GET LAST COMPLETED APPOINTMENTS
    // ======================================

    const lastVisits = await Appointment.aggregate([
      {
        $match: {
          patient: {
            $in: patientIds,
          },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$patient",
          lastVisit: {
            $max: "$appointmentDate",
          },
        },
      },
    ]);

    // ======================================
    // 3. GET TOTAL SUCCESSFUL PAYMENTS
    // ======================================

    const paymentTotals = await Payment.aggregate([
      {
        $match: {
          patient: {
            $in: patientIds,
          },
          status: "paid",
          currency: "LKR",
        },
      },
      {
        $group: {
          _id: "$patient",
          totalPaid: {
            $sum: "$amount",
          },
        },
      },
    ]);

    // ======================================
    // 4. CREATE LOOKUP MAPS
    // ======================================

    const lastVisitMap = new Map(
      lastVisits.map((item) => [String(item._id), item.lastVisit]),
    );

    const paymentMap = new Map(
      paymentTotals.map((item) => [String(item._id), item.totalPaid]),
    );

    // ======================================
    // 5. FORMAT PATIENT RESPONSE
    // ======================================

    const formattedPatients = patients.map((patient) => {
      const patientId = String(patient._id);

      const displayName =
        [patient.firstName, patient.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        patient.name ||
        "Unknown Patient";

      return {
        ...patient,
        displayName,

        lastVisit: lastVisitMap.get(patientId) || null,

        totalPaid: paymentMap.get(patientId) || 0,

        currency: "LKR",
      };
    });

    // ======================================
    // 6. SEND RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,
      message: "Dashboard patients fetched successfully",

      total: formattedPatients.length,

      patients: formattedPatients,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD PATIENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard patients",
    });
  }
};

// ======================================================
// 4. GET DASHBOARD RECENT APPOINTMENTS
// GET /api/admin/dashboard/appointments
// ======================================================

const getDashboardAppointments = async (req, res) => {
  try {
    // ==========================================
    // 1. FETCH RECENT APPOINTMENTS
    // ==========================================

    const appointments = await Appointment.find()
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(5)
      .populate({
        path: "patient",
        select: "name firstName lastName email phone image",
      })
      .populate({
        path: "doctor",
        select: "user displayName speciality designation consultationFee",
        populate: {
          path: "user",
          select: "name firstName lastName email phone image",
        },
      })
      .lean();

    // ==========================================
    // 2. FORMAT APPOINTMENTS
    // ==========================================

    const formattedAppointments = appointments.map((appointment) => {
      const doctor = appointment.doctor;
      const doctorUser = doctor?.user;

      // DOCTOR NAME
      const doctorFullName = [doctorUser?.firstName, doctorUser?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const doctorName =
        doctor?.displayName?.trim() ||
        doctorFullName ||
        doctorUser?.name ||
        "Unknown Doctor";

      // PATIENT NAME
      const snapshotName = [
        appointment.patientDetails?.firstName,
        appointment.patientDetails?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const patientName = snapshotName || getPatientName(appointment.patient);

      return {
        _id: appointment._id,

        // DOCTOR INFORMATION
        doctor: doctor || null,
        doctorName,
        speciality: doctor?.speciality || "—",

        // PATIENT INFORMATION
        patient: appointment.patient,
        patientName,

        // APPOINTMENT INFORMATION
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        appointmentType: appointment.appointmentType,

        // STATUS
        status: appointment.status,
        doctorStatus: appointment.doctorStatus,
        paymentStatus: appointment.paymentStatus,

        // FEES
        consultationFee: appointment.consultationFee,
        totalAmount: appointment.totalAmount,

        createdAt: appointment.createdAt,
      };
    });

    // ==========================================
    // 3. SEND RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Dashboard appointments fetched successfully",
      total: formattedAppointments.length,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard appointments",
    });
  }
};

// ======================================================
// 5. GET ADMIN DASHBOARD REVENUE
// GET /api/admin/dashboard/revenue
// ======================================================

const getDashboardRevenue = async (req, res) => {
  try {
    const revenue = await getRevenueSummary();

    return res.status(200).json({
      success: true,
      message: "Dashboard revenue fetched successfully",
      revenue,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD REVENUE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard revenue",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  getAdminDashboardStats,
  getDashboardDoctors,
  getDashboardPatients,
  getDashboardAppointments,
  getDashboardRevenue,
};
