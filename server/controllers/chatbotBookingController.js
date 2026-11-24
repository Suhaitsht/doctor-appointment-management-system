const { getDoctorFreeSlots } = require("../services/chatbotBookingService");

const checkFreeSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const result = await getDoctorFreeSlots(doctorId, date);

    return res.status(200).json({
      success: true,
      message: "Available slots retrieved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("CHATBOT FREE SLOTS ERROR:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to retrieve available slots.",
    });
  }
};

module.exports = {
  checkFreeSlots,
};
