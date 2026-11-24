const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);

    console.log(`Mongoose Connected : ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection error : `, error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
