const express = require("express");

const {
  checkDoctorAvailability,
} = require("../controllers/chatbotAvailabilityController");

const { checkFreeSlots } = require("../controllers/chatbotBookingController");

const router = express.Router();

router.get("/doctors/:doctorId/availability", checkDoctorAvailability);
router.get("/doctors/:doctorId/free-slots", checkFreeSlots);

module.exports = router;
