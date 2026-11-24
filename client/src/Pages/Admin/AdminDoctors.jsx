import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { toast } from "sonner";

// ======================================================
// REDUX
// ======================================================

import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,
} from "@/redux/slices/doctorSlice";

// ======================================================
// COMPONENTS
// ======================================================

import DoctorsToolbar from "@/components/admin/Doctors/DoctorsToolbar";
import DoctorsTable from "@/components/admin/Doctors/DoctorsTable";
import DoctorFormDialog from "@/components/admin/Doctors/DoctorFormDialog";
import DeleteDoctorDialog from "@/components/admin/Doctors/DeleteDoctorDialog";

// ======================================================
// EMPTY EXPERIENCE
// ======================================================

const createEmptyExperience = () => ({
  id: crypto.randomUUID(),

  hospital: "",
  yearsOfExperience: "",
  jobDescription: "",

  startDate: "",
  endDate: "",
});

// ======================================================
// EMPTY EDUCATION
// ======================================================

const createEmptyEducation = () => ({
  id: crypto.randomUUID(),

  institutionName: "",
  course: "",

  startDate: "",
  endDate: "",

  numberOfYears: "",
  description: "",
  logo: "",
});

// ======================================================
// EMPTY DOCTOR
// ======================================================

const createEmptyDoctor = () => ({
  // User model
  name: "",
  email: "",
  phone: "",
  password: "",

  // Doctor model
  speciality: "",
  hospital: "",
  consultationFee: "",

  memberSince: "",
  memberTime: "",

  // New uploaded file
  image: null,

  // Existing backend image
  imagePreview: "",

  status: true,

  experiences: [createEmptyExperience()],

  education: [createEmptyEducation()],
});

// ======================================================
// FORMAT DATE FOR HTML INPUT
// ======================================================

const formatDateForInput = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};

// ======================================================
// ERROR MESSAGE HELPER
// ======================================================

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string") {
    return error;
  }

  return error?.message || error?.response?.data?.message || fallback;
};

// ======================================================
// ADMIN DOCTORS
// ======================================================

export default function AdminDoctors() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const {
    doctors = [],
    loading = false,
    creating = false,
    updating = false,
    deleting = false,
    statusUpdating = false,
    error = null,
  } = useSelector((state) => state.doctors || {});

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected doctor
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form
  const [formData, setFormData] = useState(createEmptyDoctor());

  // ====================================================
  // FETCH DOCTORS
  // ====================================================

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        await dispatch(fetchDoctors()).unwrap();
      } catch (error) {
        console.error("FETCH DOCTORS ERROR:", error);

        toast.error(getErrorMessage(error, "Failed to load doctors."));
      }
    };

    loadDoctors();
  }, [dispatch]);

  // ====================================================
  // DEBUG REDUX ERROR
  // ====================================================

  useEffect(() => {
    if (error) {
      console.error("DOCTOR REDUX ERROR:", error);
    }
  }, [error]);

  // ====================================================
  // RESET PAGE WHEN SEARCH / ENTRIES CHANGE
  // ====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, entries]);

  // ====================================================
  // SEARCH
  // ====================================================

  const filteredDoctors = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      const name =
        doctor?.user?.name?.toLowerCase() || doctor?.name?.toLowerCase() || "";

      const email =
        doctor?.user?.email?.toLowerCase() ||
        doctor?.email?.toLowerCase() ||
        "";

      const phone = String(
        doctor?.user?.phone || doctor?.phone || "",
      ).toLowerCase();

      const speciality = doctor?.speciality?.toLowerCase() || "";

      const hospital = doctor?.hospital?.toLowerCase() || "";

      return (
        name.includes(value) ||
        email.includes(value) ||
        phone.includes(value) ||
        speciality.includes(value) ||
        hospital.includes(value)
      );
    });
  }, [doctors, search]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / entries));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * entries;

  const visibleDoctors = filteredDoctors.slice(
    startIndex,
    startIndex + entries,
  );

  // ====================================================
  // BASIC INPUT CHANGE
  // ====================================================

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ====================================================
  // IMAGE CHANGE
  // ====================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select JPG, PNG or WEBP image.");

      event.target.value = "";

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Profile image must be smaller than 5MB.");

      event.target.value = "";

      return;
    }

    // Store actual File object.
    // Do not replace imagePreview here.
    // DoctorFormDialog can use URL.createObjectURL(formData.image)
    // for new image preview.

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));

    console.log("SELECTED IMAGE:", file);
  };

  // ====================================================
  // EXPERIENCE CHANGE
  // ====================================================

  const handleExperienceChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const updatedExperiences = (previous.experiences || []).map(
        (experience, experienceIndex) =>
          experienceIndex === index
            ? {
                ...experience,

                [name]: value,
              }
            : experience,
      );

      return {
        ...previous,

        experiences: updatedExperiences,
      };
    });
  };

  // ====================================================
  // ADD EXPERIENCE
  // ====================================================

  const handleAddExperience = () => {
    setFormData((previous) => ({
      ...previous,

      experiences: [...(previous.experiences || []), createEmptyExperience()],
    }));
  };

  // ====================================================
  // REMOVE EXPERIENCE
  // ====================================================

  const handleRemoveExperience = (index) => {
    setFormData((previous) => {
      const updated = (previous.experiences || []).filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...previous,

        experiences: updated.length > 0 ? updated : [createEmptyExperience()],
      };
    });
  };

  // ====================================================
  // EDUCATION CHANGE
  // ====================================================

  const handleEducationChange = (index, event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const updatedEducation = (previous.education || []).map(
        (education, educationIndex) =>
          educationIndex === index
            ? {
                ...education,

                [name]: value,
              }
            : education,
      );

      return {
        ...previous,

        education: updatedEducation,
      };
    });
  };

  // ====================================================
  // ADD EDUCATION
  // ====================================================

  const handleAddEducation = () => {
    setFormData((previous) => ({
      ...previous,

      education: [...(previous.education || []), createEmptyEducation()],
    }));
  };

  // ====================================================
  // REMOVE EDUCATION
  // ====================================================

  const handleRemoveEducation = (index) => {
    setFormData((previous) => {
      const updated = (previous.education || []).filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...previous,

        education: updated.length > 0 ? updated : [createEmptyEducation()],
      };
    });
  };

  // ====================================================
  // OPEN ADD DOCTOR
  // ====================================================

  const openAddDoctor = () => {
    setSelectedDoctor(null);

    setFormData(createEmptyDoctor());

    setAddOpen(true);
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateDoctor = (isEdit = false) => {
    // NAME

    if (!formData.name?.trim()) {
      toast.error("Doctor name is required.");

      return false;
    }

    // EMAIL

    if (!formData.email?.trim()) {
      toast.error("Doctor email is required.");

      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address.");

      return false;
    }

    // PHONE

    if (!formData.phone?.trim()) {
      toast.error("Doctor phone number is required.");

      return false;
    }

    const phoneRegex = /^07\d{8}$/;

    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error(
        "Enter a valid Sri Lankan mobile number. Example: 0771234567",
      );

      return false;
    }

    // SPECIALITY

    if (!formData.speciality?.trim()) {
      toast.error("Doctor speciality is required.");

      return false;
    }

    // CONSULTATION FEE

    if (
      formData.consultationFee !== "" &&
      Number.isNaN(Number(formData.consultationFee))
    ) {
      toast.error("Consultation fee must be a valid number.");

      return false;
    }

    if (
      formData.consultationFee !== "" &&
      Number(formData.consultationFee) < 0
    ) {
      toast.error("Consultation fee cannot be negative.");

      return false;
    }

    // PASSWORD
    //
    // Create:
    // password required.
    //
    // Edit:
    // blank password means keep existing password.

    if (!isEdit && !formData.password?.trim()) {
      toast.error("Doctor password is required.");

      return false;
    }

    if (formData.password?.trim()) {
      // IMPORTANT:
      // Correct regex.
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

      if (!passwordRegex.test(formData.password)) {
        toast.error(
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter and one number.",
        );

        return false;
      }
    }

    return true;
  };

  // ====================================================
  // CLEAN EXPERIENCES
  // ====================================================

  const cleanExperiences = (experiences = []) => {
    return experiences
      .map(({ id, _id, ...experience }) => ({
        hospital: experience.hospital?.trim() || "",

        yearsOfExperience:
          experience.yearsOfExperience?.toString().trim() || "",

        jobDescription: experience.jobDescription?.trim() || "",

        startDate: experience.startDate || null,

        endDate: experience.endDate || null,
      }))
      .filter(
        (experience) =>
          experience.hospital ||
          experience.yearsOfExperience ||
          experience.jobDescription ||
          experience.startDate ||
          experience.endDate,
      );
  };

  // ====================================================
  // CLEAN EDUCATION
  // ====================================================

  const cleanEducation = (education = []) => {
    return education
      .map(({ id, _id, ...item }) => {
        let numberOfYears = 0;

        if (
          item.numberOfYears !== "" &&
          item.numberOfYears !== null &&
          item.numberOfYears !== undefined
        ) {
          const parsedYears = Number(item.numberOfYears);

          numberOfYears = Number.isNaN(parsedYears) ? 0 : parsedYears;
        }

        return {
          institutionName: item.institutionName?.trim() || "",

          course: item.course?.trim() || "",

          startDate: item.startDate || null,

          endDate: item.endDate || null,

          numberOfYears,

          description: item.description?.trim() || "",

          logo: item.logo?.trim() || "",
        };
      })
      .filter(
        (item) =>
          item.institutionName ||
          item.course ||
          item.startDate ||
          item.endDate ||
          item.numberOfYears ||
          item.description ||
          item.logo,
      );
  };

  // ====================================================
  // BUILD DOCTOR DATA
  // ====================================================

  const buildDoctorData = (isEdit = false) => {
    const doctorData = {
      // User
      name: formData.name?.trim() || "",

      email: formData.email?.trim().toLowerCase() || "",

      phone: formData.phone?.trim() || "",

      // Doctor
      speciality: formData.speciality?.trim() || "",

      hospital: formData.hospital?.trim() || "",

      consultationFee:
        formData.consultationFee === "" ? 0 : Number(formData.consultationFee),

      memberSince: formData.memberSince || "",

      memberTime: formData.memberTime || "",

      status: Boolean(formData.status),

      experiences: cleanExperiences(formData.experiences),

      education: cleanEducation(formData.education),
    };

    // ==================================================
    // IMAGE
    // ==================================================
    //
    // Only actual new File is sent.
    //
    // Existing backend image remains in imagePreview.
    // Therefore editing without selecting an image
    // will NOT remove/overwrite the old image.

    if (typeof File !== "undefined" && formData.image instanceof File) {
      doctorData.image = formData.image;
    }

    // ==================================================
    // PASSWORD
    // ==================================================
    //
    // Create:
    // always send password.
    //
    // Edit:
    // only send password if admin entered a new one.

    if (!isEdit || formData.password?.trim()) {
      doctorData.password = formData.password;
    }

    return doctorData;
  };

  // ====================================================
  // CREATE DOCTOR
  // ====================================================

  const handleAddDoctor = async () => {
    if (!validateDoctor(false)) {
      return;
    }

    const doctorData = buildDoctorData(false);

    console.log("CREATE DOCTOR DATA:", doctorData);

    console.log("CREATE IMAGE:", doctorData.image);

    try {
      const result = await dispatch(createDoctor(doctorData)).unwrap();

      console.log("DOCTOR CREATED:", result);

      toast.success("Doctor created successfully.");

      setAddOpen(false);

      setFormData(createEmptyDoctor());

      setCurrentPage(1);
    } catch (error) {
      console.error("CREATE DOCTOR ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to create doctor."));
    }
  };

  // ====================================================
  // OPEN EDIT DOCTOR
  // ====================================================

  const openEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);

    setFormData({
      // ==================================================
      // USER MODEL
      // ==================================================

      name: doctor?.user?.name || doctor?.name || "",

      email: doctor?.user?.email || doctor?.email || "",

      phone: doctor?.user?.phone || doctor?.phone || "",

      // Never load hashed/existing password
      password: "",

      // ==================================================
      // DOCTOR MODEL
      // ==================================================

      speciality: doctor?.speciality || "",

      hospital: doctor?.hospital || "",

      consultationFee: doctor?.consultationFee ?? "",

      memberSince: formatDateForInput(doctor?.memberSince),

      memberTime: doctor?.memberTime || "",

      // ==================================================
      // IMAGE
      // ==================================================

      // No new file selected.
      image: null,

      // Existing image from backend.
      imagePreview: doctor?.user?.image || doctor?.image || "",

      // ==================================================
      // STATUS
      // ==================================================

      status: doctor?.user?.isActive ?? doctor?.status ?? true,

      // ==================================================
      // EXPERIENCES
      // ==================================================

      experiences:
        doctor?.experiences?.length > 0
          ? doctor.experiences.map((experience) => ({
              id: experience._id || crypto.randomUUID(),

              hospital: experience.hospital || "",

              yearsOfExperience: experience.yearsOfExperience ?? "",

              jobDescription: experience.jobDescription || "",

              startDate: formatDateForInput(experience.startDate),

              endDate: formatDateForInput(experience.endDate),
            }))
          : [createEmptyExperience()],

      // ==================================================
      // EDUCATION
      // ==================================================

      education:
        doctor?.education?.length > 0
          ? doctor.education.map((education) => ({
              id: education._id || crypto.randomUUID(),

              institutionName: education.institutionName || "",

              course: education.course || "",

              startDate: formatDateForInput(education.startDate),

              endDate: formatDateForInput(education.endDate),

              numberOfYears: education.numberOfYears ?? "",

              description: education.description || "",

              logo: education.logo || "",
            }))
          : [createEmptyEducation()],
    });

    setEditOpen(true);
  };

  // ====================================================
  // UPDATE DOCTOR
  // ====================================================

  const handleUpdateDoctor = async () => {
    const id = selectedDoctor?._id || selectedDoctor?.id;

    if (!id) {
      toast.error("Doctor ID is missing.");

      return;
    }

    if (!validateDoctor(true)) {
      return;
    }

    const doctorData = buildDoctorData(true);

    console.log("UPDATE DOCTOR ID:", id);

    console.log("UPDATE DOCTOR DATA:", doctorData);

    console.log("NEW UPDATE IMAGE:", doctorData.image);

    try {
      const result = await dispatch(
        updateDoctor({
          id,
          doctorData,
        }),
      ).unwrap();

      console.log("DOCTOR UPDATED:", result);

      toast.success("Doctor updated successfully.");

      setEditOpen(false);

      setSelectedDoctor(null);

      setFormData(createEmptyDoctor());
    } catch (error) {
      console.error("UPDATE DOCTOR ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to update doctor."));
    }
  };

  // ====================================================
  // OPEN DELETE
  // ====================================================

  const openDeleteDoctor = (doctor) => {
    setSelectedDoctor(doctor);

    setDeleteOpen(true);
  };

  // ====================================================
  // DELETE DOCTOR
  // ====================================================

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) {
      toast.error("Doctor not selected.");

      return;
    }

    const id = selectedDoctor._id || selectedDoctor.id;

    if (!id) {
      toast.error("Doctor ID is missing.");

      return;
    }

    try {
      await dispatch(deleteDoctor(id)).unwrap();

      const doctorName =
        selectedDoctor?.user?.name || selectedDoctor?.name || "Doctor";

      toast.success(`${doctorName} deleted successfully.`);

      setDeleteOpen(false);

      setSelectedDoctor(null);
    } catch (error) {
      console.error("DELETE DOCTOR ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to delete doctor."));
    }
  };

  // ====================================================
  // STATUS CHANGE
  // ====================================================

  const handleStatusChange = async (id, checked) => {
    if (!id) {
      toast.error("Doctor ID is missing.");

      return;
    }

    try {
      await dispatch(
        updateDoctorStatus({
          id,
          status: checked,
        }),
      ).unwrap();

      toast.success(
        checked
          ? "Doctor activated successfully."
          : "Doctor deactivated successfully.",
      );
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to update doctor status."));

      // Reload actual backend state.
      dispatch(fetchDoctors());
    }
  };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = async () => {
    try {
      await dispatch(fetchDoctors()).unwrap();

      toast.success("Doctors refreshed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to refresh doctors."));
    }
  };

  // ====================================================
  // HANDLE ADD DIALOG CHANGE
  // ====================================================

  const handleAddOpenChange = (open) => {
    setAddOpen(open);

    if (!open) {
      setFormData(createEmptyDoctor());
    }
  };

  // ====================================================
  // HANDLE EDIT DIALOG CHANGE
  // ====================================================

  const handleEditOpenChange = (open) => {
    setEditOpen(open);

    if (!open) {
      setSelectedDoctor(null);

      setFormData(createEmptyDoctor());
    }
  };

  // ====================================================
  // HANDLE DELETE DIALOG CHANGE
  // ====================================================

  const handleDeleteOpenChange = (open) => {
    setDeleteOpen(open);

    if (!open) {
      setSelectedDoctor(null);
    }
  };

  // ====================================================
  // PAGE UI
  // ====================================================

  return (
    <div className="w-full">
      {/* =============================================== */}
      {/* PAGE HEADER */}
      {/* =============================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Doctors</h1>

          <p className="mt-1 text-sm text-slate-400">Dashboard / Doctors</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            rounded-lg
            border
            border-slate-200
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =============================================== */}
      {/* ERROR */}
      {/* =============================================== */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {typeof error === "string"
              ? error
              : "Something went wrong while loading doctors."}
          </p>
        </div>
      )}

      {/* =============================================== */}
      {/* TOOLBAR */}
      {/* =============================================== */}

      <DoctorsToolbar
        search={search}
        setSearch={setSearch}
        entries={entries}
        setEntries={setEntries}
        setCurrentPage={setCurrentPage}
        onAddDoctor={openAddDoctor}
      />

      {/* =============================================== */}
      {/* DOCTORS TABLE */}
      {/* =============================================== */}

      {loading && doctors.length === 0 ? (
        <div className="mt-5 rounded-xl border bg-white p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">Loading doctors...</p>
        </div>
      ) : (
        <DoctorsTable
          doctors={visibleDoctors}
          filteredCount={filteredDoctors.length}
          entries={entries}
          startIndex={startIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onEdit={openEditDoctor}
          onDelete={openDeleteDoctor}
          onStatusChange={handleStatusChange}
          statusUpdating={statusUpdating}
        />
      )}

      {/* =============================================== */}
      {/* ADD DOCTOR */}
      {/* =============================================== */}

      <DoctorFormDialog
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        title="Add Doctor"
        description="Enter doctor basic details, experience and education."
        formData={formData}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        handleExperienceChange={handleExperienceChange}
        handleAddExperience={handleAddExperience}
        handleRemoveExperience={handleRemoveExperience}
        handleEducationChange={handleEducationChange}
        handleAddEducation={handleAddEducation}
        handleRemoveEducation={handleRemoveEducation}
        onSubmit={handleAddDoctor}
        submitText="Add Doctor"
        loading={creating}
        isEdit={false}
      />

      {/* =============================================== */}
      {/* EDIT DOCTOR */}
      {/* =============================================== */}

      <DoctorFormDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit Doctor"
        description="Update doctor basic details, experience and education."
        formData={formData}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        handleExperienceChange={handleExperienceChange}
        handleAddExperience={handleAddExperience}
        handleRemoveExperience={handleRemoveExperience}
        handleEducationChange={handleEducationChange}
        handleAddEducation={handleAddEducation}
        handleRemoveEducation={handleRemoveEducation}
        onSubmit={handleUpdateDoctor}
        submitText="Save Changes"
        loading={updating}
        isEdit={true}
      />

      {/* =============================================== */}
      {/* DELETE DOCTOR */}
      {/* =============================================== */}

      <DeleteDoctorDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        doctor={selectedDoctor}
        onDelete={handleDeleteDoctor}
        loading={deleting}
      />
    </div>
  );
}
