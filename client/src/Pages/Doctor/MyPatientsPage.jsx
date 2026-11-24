import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Existing Components
import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";
import PatientsToolbar from "@/components/Doctor/PatientCard/PaitentsToolbar";
import PatientCard from "@/components/Doctor/PatientCard/PaitentsCard";

// Shadcn UI
import { Button } from "@/components/ui/button";

// Icons
import {
  FaArrowsRotate,
  FaTriangleExclamation,
  FaUsers,
} from "react-icons/fa6";

// Redux
import {
  fetchDoctorMyPatients,
  selectDoctorMyPatients,
  selectDoctorMyPatientsStats,
  selectDoctorMyPatientsLoading,
  selectDoctorMyPatientsError,
} from "@/redux/slices/doctorSlice";

// ======================================================
// CONSTANTS
// ======================================================

const INITIAL_VISIBLE_COUNT = 6;
const LOAD_MORE_COUNT = 3;

const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
).replace(/\/$/, "");

// ======================================================
// HELPER - GET PATIENT IMAGE URL
// ======================================================

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${BACKEND_URL}/${image.replace(/^\/+/, "")}`;
};

// ======================================================
// HELPER - FORMAT DATE
// ======================================================

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(parsedDate);
};

// ======================================================
// HELPER - FORMAT TIME
// ======================================================

const formatTime = (time) => {
  if (!time || typeof time !== "string") {
    return "";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return time;
  }

  const hour = hours % 12 || 12;
  const period = hours >= 12 ? "PM" : "AM";

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
};

// ======================================================
// HELPER - FORMAT LOCATION
// ======================================================

const formatLocation = (address) => {
  if (!address) return "N/A";

  if (typeof address === "string") {
    return address.trim() || "N/A";
  }

  const locationParts = [address.city, address.state, address.country].filter(
    Boolean,
  );

  return locationParts.length ? locationParts.join(", ") : "N/A";
};

// ======================================================
// HELPER - MAP API PATIENT TO CARD PROPS
// ======================================================

const mapPatientToCard = (patient) => {
  const lastAppointment = patient.lastAppointment;

  const appointmentDate = formatDate(lastAppointment?.appointmentDate);

  const appointmentTime = formatTime(lastAppointment?.startTime);

  return {
    // Existing PatientCard fields
    id: patient.patientId,
    name: patient.name || "Unknown Patient",
    age: patient.age ?? "N/A",
    gender: patient.gender || "N/A",
    blood: patient.bloodGroup || "N/A",
    image: getImageUrl(patient.image),

    appointment: lastAppointment
      ? `${appointmentDate}${appointmentTime ? ` ${appointmentTime}` : ""}`
      : "N/A",

    location: formatLocation(patient.address),
    lastBooking: formatDate(patient.lastBooking),
    status: patient.status || "inactive",

    // Additional real backend fields
    patientId: patient.patientId,
    totalAppointments: patient.totalAppointments ?? 0,
    lastAppointment,
    address: patient.address,
  };
};

// ======================================================
// MY PATIENTS PAGE
// ======================================================

export default function MyPatientsPage() {
  const dispatch = useDispatch();

  // ====================================================
  // REDUX STATE
  // ====================================================

  const patients = useSelector(selectDoctorMyPatients);

  const patientStats = useSelector(selectDoctorMyPatientsStats);

  const loading = useSelector(selectDoctorMyPatientsLoading);

  const error = useSelector(selectDoctorMyPatientsError);

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [activeTab, setActiveTab] = useState("active");

  const [search, setSearch] = useState("");

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // ====================================================
  // FETCH REAL PATIENT DATA
  // ====================================================

  useEffect(() => {
    dispatch(fetchDoctorMyPatients());
  }, [dispatch]);

  // ====================================================
  // REFRESH PATIENT DATA
  // ====================================================

  const handleRefresh = () => {
    if (loading) return;

    dispatch(fetchDoctorMyPatients());
  };

  // ====================================================
  // NORMALIZE PATIENT DATA
  // ====================================================

  const patientList = useMemo(() => {
    if (!Array.isArray(patients)) {
      return [];
    }

    return patients.map(mapPatientToCard);
  }, [patients]);

  // ====================================================
  // ACTIVE / INACTIVE COUNTS
  // ====================================================

  const activeCount =
    patientStats?.activePatients ??
    patientList.filter((patient) => patient.status === "active").length;

  const inactiveCount =
    patientStats?.inactivePatients ??
    patientList.filter((patient) => patient.status === "inactive").length;

  // ====================================================
  // FILTER PATIENTS
  // ====================================================

  const filteredPatients = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return patientList.filter((patient) => {
      // Active / Inactive
      const matchesStatus = patient.status === activeTab;

      // Search by name or patient ID
      const matchesSearch =
        !searchTerm ||
        patient.name.toLowerCase().includes(searchTerm) ||
        String(patient.patientId || "")
          .toLowerCase()
          .includes(searchTerm);

      return matchesStatus && matchesSearch;
    });
  }, [patientList, activeTab, search]);

  // ====================================================
  // PAGINATION - LOAD MORE
  // ====================================================

  const visiblePatients = useMemo(() => {
    return filteredPatients.slice(0, visibleCount);
  }, [filteredPatients, visibleCount]);

  // ====================================================
  // CHANGE TAB
  // ====================================================

  const changeTab = (tab) => {
    setActiveTab(tab);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // ====================================================
  // SEARCH HANDLER
  // ====================================================

  const handleSearch = (value) => {
    setSearch(value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // ====================================================
  // LOADING STATES
  // ====================================================

  const initialLoading = loading && patientList.length === 0;

  const hasMorePatients = visibleCount < filteredPatients.length;

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="container mx-auto mt-20 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ==============================================
            EXISTING DOCTOR SIDEBAR
        ============================================== */}

        <DoctorSidebar />

        {/* ==============================================
            MAIN CONTENT
        ============================================== */}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            {/* ==========================================
                TOOLBAR + REFRESH
            ========================================== */}

            <div className="mb-4 flex flex-col gap-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="gap-2"
                >
                  <FaArrowsRotate className={loading ? "animate-spin" : ""} />

                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <PatientsToolbar
                search={search}
                setSearch={handleSearch}
                activeTab={activeTab}
                changeTab={changeTab}
                activeCount={activeCount}
                inactiveCount={inactiveCount}
              />
            </div>

            {/* ==========================================
                ERROR MESSAGE
            ========================================== */}

            {error && (
              <div
                role="alert"
                className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <FaTriangleExclamation className="mt-0.5 shrink-0 text-red-600" />

                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Failed to load patients
                    </p>

                    <p className="mt-1 text-xs text-red-600">{error}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* ==========================================
                LOADING STATE
            ========================================== */}

            {initialLoading ? (
              <div
                role="status"
                className="mt-5 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 shadow-sm"
              >
                <FaArrowsRotate className="mb-4 animate-spin text-3xl text-blue-600" />

                <h3 className="text-sm font-semibold text-slate-800">
                  Loading Patients...
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Fetching your patients from the database
                </p>
              </div>
            ) : (
              /* ========================================
                  REAL PATIENT CARDS
              ======================================== */

              <>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {visiblePatients.length > 0 ? (
                    visiblePatients.map((patient) => (
                      <PatientCard key={patient.patientId} patient={patient} />
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                      <FaUsers className="mb-3 text-3xl text-slate-300" />

                      <h3 className="text-sm font-semibold text-slate-700">
                        No Patients Found
                      </h3>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                        {search.trim()
                          ? "No patients match your search."
                          : activeTab === "active"
                            ? "No active patients found."
                            : "No inactive patients found."}
                      </p>
                    </div>
                  )}
                </div>

                {/* ======================================
                    LOAD MORE BUTTON
                ====================================== */}

                {hasMorePatients && (
                  <div className="mt-7 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setVisibleCount(
                          (previous) => previous + LOAD_MORE_COUNT,
                        )
                      }
                      className="px-6"
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {/* ======================================
                    PATIENT RECORD COUNT
                ====================================== */}

                {filteredPatients.length > 0 && (
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Showing {visiblePatients.length} of{" "}
                    {filteredPatients.length} patients
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
