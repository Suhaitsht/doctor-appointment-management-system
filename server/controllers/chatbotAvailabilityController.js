const {
  getDoctorAvailability,
} = require("../services/chatbotAvailabilityService");

const checkDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const result = await getDoctorAvailability(doctorId, date);

    return res.status(200).json({
      success: true,
      message: "Doctor schedule data retrieved.",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to retrieve doctor availability.",
    });
  }
};

module.exports = {
  checkDoctorAvailability,
};
