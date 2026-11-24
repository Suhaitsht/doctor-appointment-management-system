const mongoose = require("mongoose");

const specialitySchema = new mongoose.Schema(
  {
    specialityId: {
      type: String,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Speciality name is required"],
      unique: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Speciality = mongoose.model("Speciality", specialitySchema);

module.exports = Speciality;
