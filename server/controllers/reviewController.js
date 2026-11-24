"use strict";

const mongoose = require("mongoose");

const Review = require("../models/Review");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

// ======================================================
// COMMON HELPERS
// ======================================================

const validId = (id) => mongoose.isValidObjectId(id);

const fail = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const validateReviewInput = (rating, comment) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Rating must be an integer between 1 and 5.";
  }

  if (
    typeof comment !== "string" ||
    comment.trim().length < 10 ||
    comment.trim().length > 1000
  ) {
    return "Review must contain 10 to 1000 characters.";
  }

  return null;
};

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const patientPopulate = {
  path: "patient",
  select: "name firstName lastName email image",
};

const doctorPopulate = {
  path: "doctor",
  select: "displayName speciality user image",
  populate: {
    path: "user",
    select: "name firstName lastName image",
  },
};

// Match public reviews consistently.
// Legacy reviews without isVisible are considered visible.
const publicVisibilityFilter = {
  isVisible: { $ne: false },
};

const getRatingDistribution = (ratings = []) => {
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((rating) => Number(rating) === star).length,
  }));
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ======================================================
// 1. CREATE REVIEW
// POST /api/reviews
// PATIENT ONLY
// ======================================================

exports.createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body || {};

    if (!validId(appointmentId)) {
      return fail(res, 400, "Valid appointment ID is required.");
    }

    const inputError = validateReviewInput(rating, comment);

    if (inputError) {
      return fail(res, 400, inputError);
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return fail(res, 404, "Appointment not found.");
    }

    // Check appointment ownership
    if (String(appointment.patient) !== String(req.user._id)) {
      return fail(res, 403, "You cannot review this appointment.");
    }

    // Appointment must be completed and paid
    if (
      appointment.status !== "completed" ||
      appointment.paymentStatus !== "paid" ||
      appointment.doctorStatus !== "accepted"
    ) {
      return fail(
        res,
        400,
        "Only completed, paid and doctor-accepted appointments can be reviewed.",
      );
    }

    // Consultation must have ended
    if (typeof appointment.hasEnded !== "function" || !appointment.hasEnded()) {
      return fail(res, 400, "You can review after the consultation has ended.");
    }

    const doctor = await Doctor.findById(appointment.doctor);

    if (!doctor) {
      return fail(res, 404, "Doctor not found.");
    }

    // Prevent duplicate reviews
    const existingReview = await Review.exists({
      appointment: appointment._id,
    });

    if (existingReview) {
      return fail(res, 409, "You have already reviewed this appointment.");
    }

    const review = await Review.create({
      patient: req.user._id,
      doctor: appointment.doctor,
      appointment: appointment._id,
      rating,
      comment: comment.trim(),
      isVisible: true,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, "This appointment already has a review.");
    }

    if (error.name === "ValidationError") {
      return fail(res, 400, error.message);
    }

    console.error("CREATE REVIEW ERROR:", error);

    return fail(res, 500, "Unable to submit review.");
  }
};

// ======================================================
// 2. GET PUBLIC DOCTOR REVIEWS
// GET /api/reviews/doctor/:doctorId
//
// FEATURES:
// - Public visible reviews
// - Patient details
// - Average rating
// - Total reviews
// - Rating distribution
// - Pagination
// ======================================================

exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!validId(doctorId)) {
      return fail(res, 400, "Invalid doctor ID.");
    }

    const doctorExists = await Doctor.exists({
      _id: doctorId,
    });

    if (!doctorExists) {
      return fail(res, 404, "Doctor not found.");
    }

    const { page, limit, skip } = getPagination(req.query);

    const filter = {
      doctor: new mongoose.Types.ObjectId(doctorId),
      ...publicVisibilityFilter,
    };

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .populate(patientPopulate)
        .select("patient rating comment createdAt updatedAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Review.countDocuments(filter),

      Review.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,

            averageRating: {
              $avg: "$rating",
            },

            totalReviews: {
              $sum: 1,
            },

            ratingDistribution: {
              $push: "$rating",
            },
          },
        },
      ]),
    ]);

    const summary = stats[0] || {};

    const averageRating = Number((summary.averageRating || 0).toFixed(1));

    const totalReviews = summary.totalReviews || 0;

    const ratingDistribution = getRatingDistribution(
      summary.ratingDistribution || [],
    );

    return res.status(200).json({
      success: true,

      doctorId,

      averageRating,

      totalReviews,

      ratingDistribution,

      reviews,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET DOCTOR REVIEWS ERROR:", error);

    return fail(res, 500, "Unable to fetch doctor reviews.");
  }
};

// ======================================================
// 3. GET MY REVIEWS
// GET /api/reviews/my
// PATIENT ONLY
// ======================================================

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      patient: req.user._id,
    })
      .populate(doctorPopulate)
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("GET MY REVIEWS ERROR:", error);

    return fail(res, 500, "Unable to fetch your reviews.");
  }
};

// ======================================================
// 4. UPDATE REVIEW
// PUT /api/reviews/:reviewId
// PATIENT CAN EDIT OWN REVIEW
// ======================================================

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body || {};

    if (!validId(reviewId)) {
      return fail(res, 400, "Invalid review ID.");
    }

    const inputError = validateReviewInput(rating, comment);

    if (inputError) {
      return fail(res, 400, inputError);
    }

    const review = await Review.findOneAndUpdate(
      {
        _id: reviewId,
        patient: req.user._id,
      },
      {
        $set: {
          rating,
          comment: comment.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!review) {
      return fail(res, 404, "Review not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return fail(res, 400, error.message);
    }

    console.error("UPDATE REVIEW ERROR:", error);

    return fail(res, 500, "Unable to update review.");
  }
};

// ======================================================
// 5. DELETE REVIEW
// DELETE /api/reviews/:reviewId
// PATIENT CAN DELETE OWN REVIEW
// ======================================================

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!validId(reviewId)) {
      return fail(res, 400, "Invalid review ID.");
    }

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      patient: req.user._id,
    });

    if (!review) {
      return fail(res, 404, "Review not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);

    return fail(res, 500, "Unable to delete review.");
  }
};

// ======================================================
// 6. GET ALL REVIEWS - ADMIN
// GET /api/reviews/admin/all
//
// FEATURES:
// - Search
// - Rating filter
// - Visibility filter
// - Sorting
// - Pagination
// - Admin statistics
// - Doctor profile image population
// ======================================================

exports.getAllReviews = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const search = String(req.query.search || "")
      .trim()
      .slice(0, 100);

    const rating = String(req.query.rating || "all");

    const status = String(req.query.status || "all");

    const sort = String(req.query.sort || "newest");

    const filter = {};

    // ==================================================
    // RATING FILTER
    // ==================================================

    if (rating !== "all") {
      const parsedRating = Number(rating);

      if (
        !Number.isInteger(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return fail(res, 400, "Rating must be between 1 and 5.");
      }

      filter.rating = parsedRating;
    }

    // ==================================================
    // VISIBILITY FILTER
    // ==================================================

    if (!["all", "visible", "hidden"].includes(status)) {
      return fail(res, 400, "Invalid status filter.");
    }

    if (status === "visible") {
      filter.isVisible = { $ne: false };
    }

    if (status === "hidden") {
      filter.isVisible = false;
    }

    // ==================================================
    // SEARCH
    // ==================================================

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      const [users, doctors] = await Promise.all([
        User.find({
          $or: [{ name: regex }, { firstName: regex }, { lastName: regex }],
        })
          .select("_id")
          .lean(),

        Doctor.find({
          displayName: regex,
        })
          .select("_id")
          .lean(),
      ]);

      const userIds = users.map((user) => user._id);

      const doctorIds = doctors.map((doctor) => doctor._id);

      const doctorsByUser = userIds.length
        ? await Doctor.find({
            user: { $in: userIds },
          })
            .select("_id")
            .lean()
        : [];

      const allDoctorIds = [
        ...doctorIds,
        ...doctorsByUser.map((doctor) => doctor._id),
      ];

      filter.$or = [
        { comment: regex },
        { patient: { $in: userIds } },
        { doctor: { $in: allDoctorIds } },
      ];
    }

    // ==================================================
    // SORT OPTIONS
    // ==================================================

    const sortOptions = {
      newest: {
        createdAt: -1,
        _id: -1,
      },

      oldest: {
        createdAt: 1,
        _id: 1,
      },

      highest: {
        rating: -1,
        createdAt: -1,
        _id: -1,
      },

      lowest: {
        rating: 1,
        createdAt: -1,
        _id: -1,
      },
    };

    if (!sortOptions[sort]) {
      return fail(res, 400, "Invalid sorting option.");
    }

    // ==================================================
    // DATABASE QUERIES
    // ==================================================

    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .populate(patientPopulate)
        .populate(doctorPopulate)
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limit)
        .lean(),

      Review.countDocuments(filter),

      Review.aggregate([
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            visible: {
              $sum: {
                $cond: [
                  {
                    $ne: ["$isVisible", false],
                  },
                  1,
                  0,
                ],
              },
            },

            average: {
              $avg: "$rating",
            },
          },
        },
      ]),
    ]);

    const overall = summary[0] || {};

    const totalAll = overall.total || 0;
    const visible = overall.visible || 0;

    return res.status(200).json({
      success: true,

      reviews,

      stats: {
        total: totalAll,
        visible,
        hidden: totalAll - visible,
        average: Number((overall.average || 0).toFixed(1)),
      },

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("ADMIN REVIEWS ERROR:", error);

    return fail(res, 500, "Unable to fetch reviews.");
  }
};

// ======================================================
// 7. SHOW / HIDE REVIEW - ADMIN
// PATCH /api/reviews/admin/:reviewId/visibility
// ======================================================

exports.updateReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isVisible } = req.body || {};

    if (!validId(reviewId)) {
      return fail(res, 400, "Invalid review ID.");
    }

    if (typeof isVisible !== "boolean") {
      return fail(res, 400, "isVisible must be true or false.");
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          isVisible,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!review) {
      return fail(res, 404, "Review not found.");
    }

    return res.status(200).json({
      success: true,

      message: isVisible ? "Review is now visible." : "Review has been hidden.",

      review,
    });
  } catch (error) {
    console.error("REVIEW VISIBILITY ERROR:", error);

    return fail(res, 500, "Unable to update review visibility.");
  }
};

// ======================================================
// 8. PUBLIC DOCTOR RATINGS
// GET /api/reviews/ratings/doctors
//
// FEATURES:
// - Dynamic average rating
// - Total visible reviews
// - Rating distribution
// - All doctors with reviews
// ======================================================

exports.getPublicDoctorRatings = async (req, res) => {
  try {
    const ratings = await Review.aggregate([
      {
        $match: publicVisibilityFilter,
      },

      {
        $group: {
          _id: "$doctor",

          averageRating: {
            $avg: "$rating",
          },

          totalReviews: {
            $sum: 1,
          },

          ratingDistribution: {
            $push: "$rating",
          },
        },
      },

      {
        $project: {
          _id: 0,

          doctorId: {
            $toString: "$_id",
          },

          averageRating: {
            $round: ["$averageRating", 1],
          },

          totalReviews: 1,

          ratingDistribution: 1,
        },
      },
    ]);

    const formattedRatings = ratings.map((item) => ({
      doctorId: item.doctorId,

      averageRating: Number(item.averageRating) || 0,

      totalReviews: Number(item.totalReviews) || 0,

      ratingDistribution: getRatingDistribution(item.ratingDistribution || []),
    }));

    return res.status(200).json({
      success: true,
      ratings: formattedRatings,
    });
  } catch (error) {
    console.error("PUBLIC DOCTOR RATINGS ERROR:", error);

    return fail(res, 500, "Unable to fetch doctor ratings.");
  }
};

/* ======================================================
   9. GET PUBLIC REVIEWS - HOME PAGE TESTIMONIALS

   GET /api/reviews/public

   - No authentication required
   - Visible reviews only
   - Latest reviews first
   - Patient name and image
   - Limited results
====================================================== */

exports.getPublicReviews = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(12, Math.max(1, requestedLimit))
      : 6;

    // Reuse existing visibility rule.
    // Legacy reviews without isVisible remain visible.
    const filter = publicVisibilityFilter;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate({
          path: "patient",
          select: "name firstName lastName image",
        })
        .select("patient doctor rating comment createdAt")
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(limit)
        .lean(),

      Review.countDocuments(filter),
    ]);

    // Do not expose reviews whose patient record
    // is missing.
    const formattedReviews = reviews
      .filter((review) => review.patient)
      .map((review) => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,

        patient: {
          name:
            review.patient.name ||
            [review.patient.firstName, review.patient.lastName]
              .filter(Boolean)
              .join(" ") ||
            "Patient",

          image: review.patient.image || "",
        },
      }));

    return res.status(200).json({
      success: true,
      count: formattedReviews.length,
      total,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("GET PUBLIC REVIEWS ERROR:", error);

    return fail(res, 500, "Unable to fetch public reviews.");
  }
};
