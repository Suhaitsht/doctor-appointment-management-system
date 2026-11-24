import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FaUsers,
  FaUserCheck,
  FaCalendarCheck,
  FaUserPlus,
  FaArrowRotateRight,
  FaChevronRight,
  FaUserXmark,
} from "react-icons/fa6";

import DeletePatientDialog from "@/components/admin/patients/DeletePatientDialog";
import PatientFormDialog from "@/components/admin/patients/PatientFormDialog";
import PatientsTable from "@/components/admin/patients/PatientsTable";
import PatientsToolbar from "@/components/admin/patients/PatientsToolbar";
import PatientViewDialog from "@/components/admin/patients/PatientViewDialog";

import {
  fetchAdminPatients,
  createAdminPatient,
  updateAdminPatient,
  deleteAdminPatient,
  selectAdminPatients,
  selectAdminPatientsLoading,
  selectAdminPatientsError,
  selectAdminPatientsTotal,
  selectAdminPatientsPagination,
  selectAdminPatientCreateLoading,
  selectAdminPatientUpdateLoading,
  selectAdminPatientDeleteLoading,
} from "@/redux/slices/adminPatientSlice";

// ============================================
// CONFIG
// ============================================

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

// ============================================
// EMPTY PATIENT FORM
// ============================================

const emptyPatient = {
  name: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  bloodGroup: "",
  email: "",
  phone: "",
  address: "",
  lastAppointment: "",
  image: "",
  imageFile: null,
  password: "",
  isActive: true,
};

// ============================================
// VALIDATION
// ============================================

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDERS = ["", "Male", "Female", "Other"];

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ============================================
// AGE CALCULATION
// ============================================

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const date = String(dateOfBirth).slice(0, 10);
  const dob = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const getPart = (type) =>
    Number(todayParts.find((part) => part.type === type)?.value);

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");

  let age = year - dob.getUTCFullYear();

  const birthdayPassed =
    month > dob.getUTCMonth() + 1 ||
    (month === dob.getUTCMonth() + 1 && day >= dob.getUTCDate());

  if (!birthdayPassed) {
    age--;
  }

  return age >= 0 && age <= 120 ? age : null;
};

// ============================================
// IMAGE URL HELPER
// ============================================

const resolveImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
};

// ============================================
// MAP BACKEND PATIENT
// ============================================

const mapPatient = (patient) => ({
  ...patient,

  id: patient._id,

  age: getAge(patient.dateOfBirth),

  gender: patient.gender || "",

  dateOfBirth: patient.dateOfBirth
    ? String(patient.dateOfBirth).slice(0, 10)
    : "",

  bloodGroup: patient.bloodGroup || "",

  address:
    typeof patient.address === "string"
      ? patient.address
      : patient.address?.addressLine || "",

  lastAppointment: patient.lastAppointment || "",

  image: resolveImageUrl(patient.image),

  isActive: patient.isActive !== false,
});

// ============================================
// STAT CARD
// ============================================

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const themes = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            themes[color] || themes.blue
          }`}
        >
          <Icon className="text-xl" />
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
          Overview
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>

        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPatients() {
  const dispatch = useDispatch();

  // ==========================================
  // REDUX STATE
  // ==========================================

  const rawPatients = useSelector(selectAdminPatients);

  const loading = useSelector(selectAdminPatientsLoading);

  const error = useSelector(selectAdminPatientsError);

  const totalPatients = useSelector(selectAdminPatientsTotal);

  const pagination = useSelector(selectAdminPatientsPagination);

  const createLoading = useSelector(selectAdminPatientCreateLoading);

  const updateLoading = useSelector(selectAdminPatientUpdateLoading);

  const deleteLoading = useSelector(selectAdminPatientDeleteLoading);

  // ==========================================
  // LOCAL STATE
  // ==========================================

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formData, setFormData] = useState({
    ...emptyPatient,
  });

  const [notification, setNotification] = useState(null);

  // ==========================================
  // FETCH PATIENTS
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(
      () => {
        dispatch(
          fetchAdminPatients({
            page: currentPage,
            limit: entries,
            search,
            status: "all",
          }),
        );
      },
      search.trim() ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, entries, search]);

  // ==========================================
  // MAP PATIENT DATA
  // ==========================================

  const patients = useMemo(
    () => (rawPatients || []).map(mapPatient),
    [rawPatients],
  );

  const visiblePatients = patients;

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1);

  const safeCurrentPage = Math.max(
    1,
    Number(pagination?.currentPage) || currentPage,
  );

  const startIndex = (safeCurrentPage - 1) * entries;

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    const active = patients.filter((patient) => patient.isActive).length;

    const withAppointments = patients.filter((patient) =>
      Boolean(patient.lastAppointment),
    ).length;

    return {
      total: totalPatients,
      active,
      inactive: patients.length - active,
      withAppointments,
    };
  }, [patients, totalPatients]);

  // ==========================================
  // NOTIFICATION
  // ==========================================

  const notify = (message, type = "success") => {
    setNotification({ message, type });
  };

  // ==========================================
  // REFRESH PATIENTS
  // ==========================================

  const refreshPatients = async (page = currentPage) => {
    return dispatch(
      fetchAdminPatients({
        page,
        limit: entries,
        search,
        status: "all",
      }),
    );
  };

  // ==========================================
  // INPUT CHANGE HANDLER
  // ==========================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validatePatient = (isEdit = false) => {
    if (!formData.name?.trim()) {
      notify("Patient name is required.", "error");
      return false;
    }

    if (!formData.email?.trim()) {
      notify("Patient email is required.", "error");
      return false;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      notify("Invalid email address.", "error");
      return false;
    }

    if (!formData.phone?.trim()) {
      notify("Patient phone is required.", "error");
      return false;
    }

    if (!isEdit && !formData.password) {
      notify("Password is required.", "error");
      return false;
    }

    if (formData.password && !PASSWORD_REGEX.test(formData.password)) {
      notify(
        "Password must contain at least 8 characters, uppercase, lowercase and a number.",
        "error",
      );
      return false;
    }

    if (!GENDERS.includes(formData.gender || "")) {
      notify("Please select a valid gender.", "error");
      return false;
    }

    if (!BLOOD_GROUPS.includes(formData.bloodGroup || "")) {
      notify("Invalid blood group.", "error");
      return false;
    }

    if (formData.dateOfBirth) {
      const age = getAge(formData.dateOfBirth);

      if (age === null) {
        notify("Invalid date of birth.", "error");
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // BUILD BACKEND PAYLOAD
  // ==========================================

  const buildPayload = () => {
    const payload = {
      name: formData.name.trim(),

      email: formData.email.trim().toLowerCase(),

      phone: formData.phone.trim(),

      firstName: formData.firstName || "",

      lastName: formData.lastName || "",

      dateOfBirth: formData.dateOfBirth || "",

      // IMPORTANT: GENDER ADDED
      gender: formData.gender || "",

      bloodGroup: formData.bloodGroup || "",

      address: formData.address || "",

      isActive: formData.isActive,

      imageFile: formData.imageFile,
    };

    // Password required when creating.
    // Optional when editing.
    if (formData.password) {
      payload.password = formData.password;
    }

    return payload;
  };

  // ==========================================
  // ADD PATIENT
  // ==========================================

  const openAddPatient = () => {
    setNotification(null);

    setFormData({
      ...emptyPatient,
    });

    setAddOpen(true);
  };

  const handleAddPatient = async () => {
    if (!validatePatient(false)) {
      return;
    }

    try {
      const payload = buildPayload();

      await dispatch(createAdminPatient(payload)).unwrap();

      setAddOpen(false);

      setFormData({
        ...emptyPatient,
      });

      notify("Patient created successfully.");

      setCurrentPage(1);

      await refreshPatients(1);
    } catch (error) {
      notify(String(error), "error");
    }
  };

  // ==========================================
  // VIEW PATIENT
  // ==========================================

  const openViewPatient = (patient) => {
    setSelectedPatient(patient);
    setViewOpen(true);
  };

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  const openEditPatient = (patient) => {
    setNotification(null);

    setSelectedPatient(patient);

    setFormData({
      ...emptyPatient,

      name: patient.name || "",

      firstName: patient.firstName || "",

      lastName: patient.lastName || "",

      email: patient.email || "",

      phone: patient.phone || "",

      // IMPORTANT: POPULATE GENDER
      gender: patient.gender || "",

      dateOfBirth: patient.dateOfBirth
        ? String(patient.dateOfBirth).slice(0, 10)
        : "",

      bloodGroup: patient.bloodGroup || "",

      address:
        typeof patient.address === "string"
          ? patient.address
          : patient.address?.addressLine || "",

      lastAppointment: patient.lastAppointment || "",

      image: patient.image || "",

      imageFile: null,

      password: "",

      isActive: patient.isActive !== false,
    });

    setEditOpen(true);
  };

  // ==========================================
  // UPDATE PATIENT
  // ==========================================

  const handleUpdatePatient = async () => {
    if (!selectedPatient) {
      return;
    }

    if (!validatePatient(true)) {
      return;
    }

    try {
      const payload = buildPayload();

      await dispatch(
        updateAdminPatient({
          patientId: selectedPatient._id,
          patientData: payload,
        }),
      ).unwrap();

      setEditOpen(false);

      setSelectedPatient(null);

      setFormData({
        ...emptyPatient,
      });

      notify("Patient updated successfully.");

      await refreshPatients();
    } catch (error) {
      notify(String(error), "error");
    }
  };

  // ==========================================
  // DELETE PATIENT
  // ==========================================

  const openDeletePatient = (patient) => {
    setSelectedPatient(patient);
    setDeleteOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) {
      return;
    }

    try {
      await dispatch(deleteAdminPatient(selectedPatient._id)).unwrap();

      setDeleteOpen(false);

      setSelectedPatient(null);

      notify("Patient deleted successfully.");

      const nextPage =
        patients.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      setCurrentPage(nextPage);

      await refreshPatients(nextPage);
    } catch (error) {
      notify(String(error), "error");
    }
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const handleReset = () => {
    setSearch("");
    setEntries(10);
    setCurrentPage(1);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen w-full bg-slate-50/50 pb-10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Dashboard</span>
              <FaChevronRight className="text-[9px]" />
              <span>Users</span>
              <FaChevronRight className="text-[9px]" />
              <span className="text-blue-600">Patients</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Patient Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage registered patients, profiles and records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <FaArrowRotateRight />
              Reset Filters
            </button>

            <button
              type="button"
              onClick={openAddPatient}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <FaUserPlus />
              Add Patient
            </button>
          </div>
        </div>

        {/* NOTIFICATION */}
        {notification && (
          <div
            role="alert"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              notification.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <span>{notification.message}</span>

            <button
              type="button"
              onClick={() => setNotification(null)}
              className="font-semibold"
            >
              Close
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Patients"
            value={stats.total}
            icon={FaUsers}
            color="blue"
            subtitle="All matching patient records"
          />

          <StatCard
            title="Active Patients"
            value={stats.active}
            icon={FaUserCheck}
            color="green"
            subtitle="Active accounts on this page"
          />

          <StatCard
            title="Inactive Patients"
            value={stats.inactive}
            icon={FaUserXmark}
            color="orange"
            subtitle="Inactive accounts on this page"
          />

          <StatCard
            title="Patients With Appointments"
            value={stats.withAppointments}
            icon={FaCalendarCheck}
            color="purple"
            subtitle="Requires appointment data integration"
          />
        </div>

        {/* PATIENT DIRECTORY */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Patient Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Search, view and manage patient information
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {totalPatients} Records
            </span>
          </div>

          {/* TOOLBAR */}
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <PatientsToolbar
              search={search}
              setSearch={setSearch}
              entries={entries}
              setEntries={setEntries}
              setCurrentPage={setCurrentPage}
              onAddPatient={openAddPatient}
              showAddButton={false}
            />
          </div>

          {/* API ERROR */}
          {error && (
            <div
              role="alert"
              className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}

              <button
                type="button"
                onClick={() => refreshPatients()}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="px-5 py-3 text-sm text-blue-600">
              Loading patients...
            </div>
          )}

          {/* TABLE */}
          <PatientsTable
            patients={visiblePatients}
            filteredCount={totalPatients}
            entries={entries}
            startIndex={startIndex}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            onView={openViewPatient}
            onEdit={openEditPatient}
            onDelete={openDeletePatient}
          />
        </div>

        {/* ADD PATIENT */}
        <PatientFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          title="Add New Patient"
          formData={formData}
          handleInputChange={handleInputChange}
          onSubmit={handleAddPatient}
          submitText="Add Patient"
          loading={createLoading}
        />

        {/* EDIT PATIENT */}
        <PatientFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Edit Patient"
          formData={formData}
          handleInputChange={handleInputChange}
          onSubmit={handleUpdatePatient}
          submitText="Save Changes"
          loading={updateLoading}
        />

        {/* VIEW PATIENT */}
        <PatientViewDialog
          open={viewOpen}
          onOpenChange={setViewOpen}
          patient={selectedPatient}
        />

        {/* DELETE PATIENT */}
        <DeletePatientDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          patient={selectedPatient}
          onDelete={handleDeletePatient}
        />

        {deleteLoading && (
          <p className="text-sm text-slate-500">Deleting patient...</p>
        )}
      </div>
    </div>
  );
}
