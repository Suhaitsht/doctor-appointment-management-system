import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { toast } from "sonner";

// ======================================================
// COMPONENTS
// ======================================================

import DeleteSpecialityDialog from "@/components/admin/Specialities/DeleteSpecialityDialog";

import SpecialitiesTable from "@/components/admin/Specialities/SpecialitiesTable";

import SpecialitiesToolbar from "@/components/admin/Specialities/SpecialitiesToolbar";

import SpecialityFormDialog from "@/components/admin/Specialities/SpecialityFormDialog";

// ======================================================
// REDUX
// ======================================================

import {
  fetchSpecialities,
  createSpeciality,
  updateSpeciality,
  deleteSpeciality,
} from "@/redux/slices/specialitySlice";

// ======================================================
// EMPTY SPECIALITY
// ======================================================

const createEmptySpeciality = () => ({
  name: "",

  // New selected File
  image: null,

  // Existing backend image
  imagePreview: "",

  isActive: true,
});

// ======================================================
// ERROR MESSAGE
// ======================================================

const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (typeof error === "string") {
    return error;
  }

  return error?.response?.data?.message || error?.message || fallback;
};

// ======================================================
// ADMIN SPECIALITIES
// ======================================================

export default function AdminSpecialities() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const {
    specialities = [],

    loading = false,

    creating = false,

    updating = false,

    deleting = false,

    error = null,
  } = useSelector((state) => state.specialities || {});

  // ====================================================
  // LOCAL UI STATE
  // ====================================================

  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs

  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected speciality

  const [selectedSpeciality, setSelectedSpeciality] = useState(null);

  // Form

  const [formData, setFormData] = useState(createEmptySpeciality());

  // ====================================================
  // FETCH SPECIALITIES
  // ====================================================

  useEffect(() => {
    const loadSpecialities = async () => {
      try {
        await dispatch(fetchSpecialities()).unwrap();
      } catch (error) {
        console.error("FETCH SPECIALITIES ERROR:", error);

        toast.error(getErrorMessage(error, "Failed to load specialities."));
      }
    };

    loadSpecialities();
  }, [dispatch]);

  // ====================================================
  // RESET PAGE
  // ====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, entries]);

  // ====================================================
  // SEARCH
  // ====================================================

  const filteredSpecialities = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return specialities;
    }

    return specialities.filter((speciality) => {
      const name = speciality?.name?.toLowerCase() || "";

      const code = speciality?.specialityId?.toLowerCase() || "";

      return name.includes(value) || code.includes(value);
    });
  }, [specialities, search]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const totalPages = Math.max(
    1,

    Math.ceil(filteredSpecialities.length / entries),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * entries;

  const visibleSpecialities = filteredSpecialities.slice(
    startIndex,
    startIndex + entries,
  );

  // ====================================================
  // INPUT CHANGE
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

    // -----------------------------------------------
    // File type validation
    // -----------------------------------------------

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed.");

      event.target.value = "";

      return;
    }

    // -----------------------------------------------
    // 5MB validation
    // -----------------------------------------------

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Image must be smaller than 5MB.");

      event.target.value = "";

      return;
    }

    setFormData((previous) => ({
      ...previous,

      image: file,
    }));
  };

  // ====================================================
  // OPEN ADD
  // ====================================================

  const openAddSpeciality = () => {
    setSelectedSpeciality(null);

    setFormData(createEmptySpeciality());

    setAddOpen(true);
  };

  // ====================================================
  // VALIDATE
  // ====================================================

  const validateSpeciality = () => {
    if (!formData.name?.trim()) {
      toast.error("Speciality name is required.");

      return false;
    }

    if (formData.name.trim().length < 2) {
      toast.error("Speciality name must contain at least 2 characters.");

      return false;
    }

    return true;
  };

  // ====================================================
  // BUILD DATA
  // ====================================================

  const buildSpecialityData = () => {
    const specialityData = {
      name: formData.name.trim(),

      isActive: Boolean(formData.isActive),
    };

    // Only send actual File
    if (typeof File !== "undefined" && formData.image instanceof File) {
      specialityData.image = formData.image;
    }

    return specialityData;
  };

  // ====================================================
  // ADD SPECIALITY
  // ====================================================

  const handleAddSpeciality = async () => {
    if (!validateSpeciality()) {
      return;
    }

    const specialityData = buildSpecialityData();

    try {
      const result = await dispatch(createSpeciality(specialityData)).unwrap();

      console.log("SPECIALITY CREATED:", result);

      toast.success("Speciality added successfully.");

      setAddOpen(false);

      setFormData(createEmptySpeciality());

      setCurrentPage(1);
    } catch (error) {
      console.error("CREATE SPECIALITY ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to add speciality."));
    }
  };

  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEditSpeciality = (speciality) => {
    setSelectedSpeciality(speciality);

    setFormData({
      name: speciality?.name || "",

      // IMPORTANT:
      // No new File initially
      image: null,

      // Existing backend image
      imagePreview: speciality?.image || "",

      isActive: speciality?.isActive ?? true,
    });

    setEditOpen(true);
  };

  // ====================================================
  // UPDATE SPECIALITY
  // ====================================================

  const handleUpdateSpeciality = async () => {
    if (!selectedSpeciality) {
      return;
    }

    if (!validateSpeciality()) {
      return;
    }

    const id = selectedSpeciality._id;

    if (!id) {
      toast.error("Speciality ID is missing.");

      return;
    }

    const specialityData = buildSpecialityData();

    try {
      const result = await dispatch(
        updateSpeciality({
          id,

          specialityData,
        }),
      ).unwrap();

      console.log("SPECIALITY UPDATED:", result);

      toast.success("Speciality updated successfully.");

      setEditOpen(false);

      setSelectedSpeciality(null);

      setFormData(createEmptySpeciality());
    } catch (error) {
      console.error("UPDATE SPECIALITY ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to update speciality."));
    }
  };

  // ====================================================
  // OPEN DELETE
  // ====================================================

  const openDeleteSpeciality = (speciality) => {
    setSelectedSpeciality(speciality);

    setDeleteOpen(true);
  };

  // ====================================================
  // DELETE SPECIALITY
  // ====================================================

  const handleDeleteSpeciality = async () => {
    if (!selectedSpeciality) {
      return;
    }

    const id = selectedSpeciality._id;

    if (!id) {
      toast.error("Speciality ID is missing.");

      return;
    }

    try {
      await dispatch(deleteSpeciality(id)).unwrap();

      toast.success(`${selectedSpeciality.name} deleted successfully.`);

      setDeleteOpen(false);

      setSelectedSpeciality(null);
    } catch (error) {
      console.error("DELETE SPECIALITY ERROR:", error);

      toast.error(getErrorMessage(error, "Failed to delete speciality."));
    }
  };

  // ====================================================
  // ADD DIALOG CHANGE
  // ====================================================

  const handleAddOpenChange = (open) => {
    if (creating) {
      return;
    }

    setAddOpen(open);

    if (!open) {
      setFormData(createEmptySpeciality());
    }
  };

  // ====================================================
  // EDIT DIALOG CHANGE
  // ====================================================

  const handleEditOpenChange = (open) => {
    if (updating) {
      return;
    }

    setEditOpen(open);

    if (!open) {
      setSelectedSpeciality(null);

      setFormData(createEmptySpeciality());
    }
  };

  // ====================================================
  // DELETE DIALOG CHANGE
  // ====================================================

  const handleDeleteOpenChange = (open) => {
    if (deleting) {
      return;
    }

    setDeleteOpen(open);

    if (!open) {
      setSelectedSpeciality(null);
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full">
      {/* =============================================== */}
      {/* PAGE TITLE */}
      {/* =============================================== */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Specialities</h1>

        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-slate-900">Dashboard</span>

          <span className="text-slate-400">/</span>

          <span className="text-slate-500">Specialities</span>
        </div>
      </div>

      {/* =============================================== */}
      {/* ERROR */}
      {/* =============================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            {typeof error === "string" ? error : "Something went wrong."}
          </p>
        </div>
      )}

      {/* =============================================== */}
      {/* TOOLBAR */}
      {/* =============================================== */}

      <SpecialitiesToolbar
        search={search}
        setSearch={setSearch}
        entries={entries}
        setEntries={setEntries}
        setCurrentPage={setCurrentPage}
        onAdd={openAddSpeciality}
      />

      {/* =============================================== */}
      {/* LOADING / TABLE */}
      {/* =============================================== */}

      {loading && specialities.length === 0 ? (
        <div className="mt-5 rounded-xl border bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

          <p className="mt-4 text-sm text-slate-500">Loading specialities...</p>
        </div>
      ) : (
        <SpecialitiesTable
          specialities={visibleSpecialities}
          filteredCount={filteredSpecialities.length}
          entries={entries}
          startIndex={startIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onEdit={openEditSpeciality}
          onDelete={openDeleteSpeciality}
        />
      )}

      {/* =============================================== */}
      {/* ADD */}
      {/* =============================================== */}

      <SpecialityFormDialog
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        title="Add Speciality"
        description="Enter the speciality information."
        formData={formData}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        onSubmit={handleAddSpeciality}
        submitText="Add Speciality"
        loading={creating}
        isEdit={false}
      />

      {/* =============================================== */}
      {/* EDIT */}
      {/* =============================================== */}

      <SpecialityFormDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit Speciality"
        description="Update the speciality information."
        formData={formData}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        onSubmit={handleUpdateSpeciality}
        submitText="Save Changes"
        loading={updating}
        isEdit={true}
      />

      {/* =============================================== */}
      {/* DELETE */}
      {/* =============================================== */}

      <DeleteSpecialityDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        speciality={selectedSpeciality}
        onDelete={handleDeleteSpeciality}
        loading={deleting}
      />
    </div>
  );
}
