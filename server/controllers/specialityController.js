const fs = require("fs");
const path = require("path");

const Speciality = require("../models/Speciality");

// ======================================================
// HELPER - IMAGE PATH
// ======================================================

const getImagePath = (file) => {
  if (!file) {
    return "";
  }

  return `/uploads/specialities/${file.filename}`;
};

// ======================================================
// HELPER - DELETE IMAGE
// ======================================================

const deleteImageFile = (imagePath) => {
  try {
    if (!imagePath) {
      return;
    }

    if (!imagePath.startsWith("/uploads/")) {
      return;
    }

    const relativePath = imagePath.replace(/^\/+/, "");

    const fullPath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("DELETE SPECIALITY IMAGE ERROR:", error.message);
  }
};

// ======================================================
// GENERATE SPECIALITY ID
// ======================================================

const generateSpecialityId = async () => {
  const lastSpeciality = await Speciality.findOne({
    specialityId: /^SP\d+$/,
  })
    .sort({
      specialityId: -1,
    })
    .select("specialityId")
    .lean();

  let nextNumber = 1;

  if (lastSpeciality?.specialityId) {
    const currentNumber = Number(lastSpeciality.specialityId.replace("SP", ""));

    if (!Number.isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `SP${String(nextNumber).padStart(3, "0")}`;
};

// ======================================================
// CREATE SPECIALITY
// POST /api/specialities
// ADMIN
// ======================================================

const createSpeciality = async (req, res) => {
  try {
    let { name, isActive } = req.body;

    // --------------------------------------------------
    // VALIDATE NAME
    // --------------------------------------------------

    if (!name || !name.trim()) {
      if (req.file) {
        deleteImageFile(getImagePath(req.file));
      }

      return res.status(400).json({
        success: false,
        message: "Speciality name is required",
      });
    }

    name = name.trim();

    // --------------------------------------------------
    // CHECK DUPLICATE
    // --------------------------------------------------

    const existingSpeciality = await Speciality.findOne({
      name: {
        $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingSpeciality) {
      if (req.file) {
        deleteImageFile(getImagePath(req.file));
      }

      return res.status(400).json({
        success: false,
        message: "Speciality already exists",
      });
    }

    // --------------------------------------------------
    // GENERATE ID
    // --------------------------------------------------

    const specialityId = await generateSpecialityId();

    // --------------------------------------------------
    // IMAGE
    // --------------------------------------------------

    const image = getImagePath(req.file);

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    const speciality = await Speciality.create({
      specialityId,

      name,

      image,

      isActive: isActive === undefined ? true : String(isActive) === "true",
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,

      message: "Speciality created successfully",

      speciality,
    });
  } catch (error) {
    console.error("CREATE SPECIALITY ERROR:", error);

    if (req.file) {
      deleteImageFile(getImagePath(req.file));
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Speciality already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create speciality",
    });
  }
};

// ======================================================
// GET ALL SPECIALITIES
// GET /api/specialities
// ADMIN
// ======================================================

const getAllSpecialities = async (req, res) => {
  try {
    const specialities = await Speciality.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,

      count: specialities.length,

      specialities,
    });
  } catch (error) {
    console.error("GET SPECIALITIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch specialities",
    });
  }
};

// ======================================================
// GET PUBLIC SPECIALITIES
// GET /api/specialities/public
// ======================================================

const getPublicSpecialities = async (req, res) => {
  try {
    const specialities = await Speciality.find({
      isActive: true,
    })
      .select("specialityId name image")
      .sort({
        name: 1,
      });

    return res.status(200).json({
      success: true,

      count: specialities.length,

      specialities,
    });
  } catch (error) {
    console.error("PUBLIC SPECIALITIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch specialities",
    });
  }
};

// ======================================================
// GET SINGLE SPECIALITY
// GET /api/specialities/:id
// ADMIN
// ======================================================

const getSingleSpeciality = async (req, res) => {
  try {
    const speciality = await Speciality.findById(req.params.id);

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    return res.status(200).json({
      success: true,

      speciality,
    });
  } catch (error) {
    console.error("GET SPECIALITY ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid speciality ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch speciality",
    });
  }
};

// ======================================================
// UPDATE SPECIALITY
// PUT /api/specialities/:id
// ADMIN
// ======================================================

const updateSpeciality = async (req, res) => {
  try {
    const speciality = await Speciality.findById(req.params.id);

    if (!speciality) {
      if (req.file) {
        deleteImageFile(getImagePath(req.file));
      }

      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    const { name, isActive } = req.body;

    // --------------------------------------------------
    // UPDATE NAME
    // --------------------------------------------------

    if (name !== undefined) {
      const cleanName = name.trim();

      if (!cleanName) {
        if (req.file) {
          deleteImageFile(getImagePath(req.file));
        }

        return res.status(400).json({
          success: false,
          message: "Speciality name cannot be empty",
        });
      }

      // Check duplicate excluding current record
      const duplicate = await Speciality.findOne({
        _id: {
          $ne: speciality._id,
        },

        name: {
          $regex: `^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,

          $options: "i",
        },
      });

      if (duplicate) {
        if (req.file) {
          deleteImageFile(getImagePath(req.file));
        }

        return res.status(400).json({
          success: false,
          message: "Speciality already exists",
        });
      }

      speciality.name = cleanName;
    }

    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    if (isActive !== undefined) {
      speciality.isActive = String(isActive) === "true";
    }

    // --------------------------------------------------
    // UPDATE IMAGE
    // --------------------------------------------------

    if (req.file) {
      const oldImage = speciality.image;

      speciality.image = getImagePath(req.file);

      await speciality.save();

      // Delete old image only after successful save
      deleteImageFile(oldImage);

      return res.status(200).json({
        success: true,

        message: "Speciality updated successfully",

        speciality,
      });
    }

    // --------------------------------------------------
    // SAVE WITHOUT NEW IMAGE
    // --------------------------------------------------

    await speciality.save();

    return res.status(200).json({
      success: true,

      message: "Speciality updated successfully",

      speciality,
    });
  } catch (error) {
    console.error("UPDATE SPECIALITY ERROR:", error);

    if (req.file) {
      deleteImageFile(getImagePath(req.file));
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid speciality ID",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Speciality already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update speciality",
    });
  }
};

// ======================================================
// DELETE SPECIALITY
// DELETE /api/specialities/:id
// ADMIN
// ======================================================

const deleteSpeciality = async (req, res) => {
  try {
    const speciality = await Speciality.findById(req.params.id);

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    const image = speciality.image;

    await speciality.deleteOne();

    // Delete image after DB deletion
    deleteImageFile(image);

    return res.status(200).json({
      success: true,

      message: "Speciality deleted successfully",

      id: req.params.id,
    });
  } catch (error) {
    console.error("DELETE SPECIALITY ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid speciality ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete speciality",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createSpeciality,
  getAllSpecialities,
  getPublicSpecialities,
  getSingleSpeciality,
  updateSpeciality,
  deleteSpeciality,
};
