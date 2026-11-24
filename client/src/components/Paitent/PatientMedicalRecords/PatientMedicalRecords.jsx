import React, { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  FiAlertCircle,
  FiCalendar,
  FiEye,
  FiFileText,
  FiHome,
  FiLoader,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  fetchPatientConsultations,
  selectPatientConsultations,
  selectPatientConsultationsTotal,
  selectPatientConsultationsLoading,
  selectPatientConsultationsError,
} from "@/redux/slices/consultationSlice";

import ConsultationRecordModal from "../../../components/Doctor/Consultation/ConsultationRecordModal";

// ======================================================
// DATE FORMATTER
// ======================================================

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function PatientMedicalRecords() {
  const dispatch = useDispatch();

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // ====================================================
  // REDUX
  // ====================================================

  const consultations = useSelector(selectPatientConsultations);

  const total = useSelector(selectPatientConsultationsTotal);

  const loading = useSelector(selectPatientConsultationsLoading);

  const error = useSelector(selectPatientConsultationsError);

  // ====================================================
  // FETCH DATA
  // ====================================================

  useEffect(() => {
    dispatch(fetchPatientConsultations());
  }, [dispatch]);

  // ====================================================
  // NORMALIZE CONSULTATIONS
  // ====================================================

  const records = useMemo(() => {
    if (!Array.isArray(consultations)) {
      return [];
    }

    return consultations.map((consultation) => {
      const doctor = consultation?.doctor;
      const doctorUser = doctor?.user;
      const appointment = consultation?.appointment;

      let appointmentId = "";

      if (typeof appointment === "string") {
        appointmentId = appointment;
      } else if (appointment?._id) {
        appointmentId = appointment._id;
      }

      return {
        id: consultation?._id || "",

        appointmentId,

        displayId: consultation?._id
          ? `MR${consultation._id.slice(-6).toUpperCase()}`
          : "N/A",

        date: formatDate(
          consultation?.completedAt ||
            appointment?.appointmentDate ||
            consultation?.createdAt,
        ),

        doctor: doctorUser?.name || "Doctor",

        speciality: doctor?.speciality || "General Medicine",

        diagnosis:
          consultation?.diagnosis?.final ||
          consultation?.diagnosis?.primary ||
          "Not specified",

        type: "Consultation",

        status: consultation?.status || "completed",

        medications: Array.isArray(consultation?.medications)
          ? consultation.medications
          : [],

        advice: consultation?.advice || "",

        followUp: consultation?.followUp || "",

        original: consultation,
      };
    });
  }, [consultations]);

  // ====================================================
  // BUILD PRESCRIPTIONS
  // ====================================================

  const prescriptions = useMemo(() => {
    return records
      .filter((record) => record.medications.length > 0)
      .map((record) => ({
        ...record,

        displayId: record.id ? `RX${record.id.slice(-6).toUpperCase()}` : "N/A",

        type: "Prescription",
      }));
  }, [records]);

  // ====================================================
  // SEARCH CONSULTATIONS
  // ====================================================

  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return records;
    }

    return records.filter((record) => {
      return (
        record.displayId.toLowerCase().includes(searchValue) ||
        record.doctor.toLowerCase().includes(searchValue) ||
        record.speciality.toLowerCase().includes(searchValue) ||
        record.diagnosis.toLowerCase().includes(searchValue)
      );
    });
  }, [records, search]);

  // ====================================================
  // SEARCH PRESCRIPTIONS
  // ====================================================

  const filteredPrescriptions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return prescriptions;
    }

    return prescriptions.filter((prescription) => {
      const medicationText = prescription.medications
        .map((medicine) => {
          return [
            medicine?.name,
            medicine?.type,
            medicine?.dosage,
            medicine?.duration,
            medicine?.instruction,
          ]
            .filter(Boolean)
            .join(" ");
        })
        .join(" ")
        .toLowerCase();

      return (
        prescription.displayId.toLowerCase().includes(searchValue) ||
        prescription.doctor.toLowerCase().includes(searchValue) ||
        prescription.speciality.toLowerCase().includes(searchValue) ||
        prescription.diagnosis.toLowerCase().includes(searchValue) ||
        medicationText.includes(searchValue)
      );
    });
  }, [prescriptions, search]);

  // ====================================================
  // OPEN RECORD
  // ====================================================

  const handleView = (record) => {
    const appointmentId = record?.appointmentId;

    if (!appointmentId) {
      console.error("Appointment ID missing from medical record:", record);

      return;
    }

    setSelectedAppointmentId(appointmentId);

    setRecordModalOpen(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const handleCloseRecordModal = () => {
    setRecordModalOpen(false);

    setSelectedAppointmentId(null);
  };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = () => {
    dispatch(fetchPatientConsultations());
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const consultationCount = records.length;
  const prescriptionCount = prescriptions.length;

  // ====================================================
  // UI
  // ====================================================

  return (
    <>
      <div className="w-full">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FiHome />

            <span>Patient</span>

            <span>/</span>

            <span className="font-medium text-blue-600">Medical Records</span>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Medical Records
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View your consultation history and prescriptions.
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* =================================================
              HEADER + TABS
          ================================================= */}

          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiFileText className="text-xl" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Medical Records
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Your previous consultations and prescriptions
                  </p>
                </div>
              </div>

              {/* TABS */}

              <div className="flex w-fit max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
                <TabButton
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                >
                  All
                </TabButton>

                <TabButton
                  active={activeTab === "consultations"}
                  onClick={() => setActiveTab("consultations")}
                >
                  Consultations ({consultationCount})
                </TabButton>

                <TabButton
                  active={activeTab === "prescriptions"}
                  onClick={() => setActiveTab("prescriptions")}
                >
                  Prescriptions ({prescriptionCount})
                </TabButton>
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeTab === "prescriptions"
                      ? "Search medicine, doctor or diagnosis..."
                      : "Search doctor, diagnosis or record..."
                  }
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    pl-10
                    pr-4
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-blue-400
                    focus:ring-4
                    focus:ring-blue-50
                  "
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {activeTab === "prescriptions"
                    ? `${prescriptionCount} ${
                        prescriptionCount === 1
                          ? "prescription"
                          : "prescriptions"
                      }`
                    : `${total} medical ${total === 1 ? "record" : "records"}`}
                </span>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    text-slate-500
                    transition
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-600
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <FiLoader className="mx-auto animate-spin text-3xl text-blue-600" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading medical records...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait a moment.
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="p-5">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-red-500" />

                  <div>
                    <h3 className="text-sm font-semibold text-red-700">
                      Unable to load medical records
                    </h3>

                    <p className="mt-1 text-xs text-red-600">{error}</p>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ALL / CONSULTATIONS TABLE
          ================================================= */}

          {!loading &&
            !error &&
            activeTab !== "prescriptions" &&
            filteredRecords.length > 0 && (
              <>
                {/* DESKTOP */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <TableHeading>Record ID</TableHeading>

                        <TableHeading>Date</TableHeading>

                        <TableHeading>Doctor</TableHeading>

                        <TableHeading>Diagnosis</TableHeading>

                        <TableHeading>Type</TableHeading>

                        <TableHeading>Status</TableHeading>

                        <TableHeading className="text-right">
                          Action
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="text-xs font-semibold text-blue-600">
                              #{record.displayId}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FiCalendar className="text-slate-400" />

                              {record.date}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {record.doctor}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {record.speciality}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-slate-700">
                              {record.diagnosis}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                              {record.type}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-600">
                              {record.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <ActionButton
                                title="View Consultation"
                                onClick={() => handleView(record)}
                              >
                                <FiEye />
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div className="space-y-3 p-4 md:hidden">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-600">
                            #{record.displayId}
                          </p>

                          <h3 className="mt-1 font-semibold text-slate-900">
                            {record.diagnosis}
                          </h3>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold capitalize text-emerald-600">
                          {record.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-500">
                        <p>
                          <span className="font-medium text-slate-700">
                            Doctor:
                          </span>{" "}
                          {record.doctor}
                        </p>

                        <p>
                          <span className="font-medium text-slate-700">
                            Speciality:
                          </span>{" "}
                          {record.speciality}
                        </p>

                        <p>
                          <span className="font-medium text-slate-700">
                            Date:
                          </span>{" "}
                          {record.date}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleView(record)}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                        >
                          <FiEye />
                          View Record
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          {/* =================================================
              PRESCRIPTIONS
          ================================================= */}

          {!loading &&
            !error &&
            activeTab === "prescriptions" &&
            filteredPrescriptions.length > 0 && (
              <div className="space-y-5 p-4 sm:p-5">
                {filteredPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    {/* HEADER */}

                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">
                            #{prescription.displayId}
                          </span>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-emerald-600">
                            {prescription.status}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Prescription Date:{" "}
                          <span className="font-medium text-slate-700">
                            {prescription.date}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleView(prescription)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        <FiEye />
                        View Full Record
                      </button>
                    </div>

                    {/* DOCTOR + DIAGNOSIS */}

                    <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2">
                      <InfoItem
                        label="Prescribed By"
                        value={prescription.doctor}
                        subValue={prescription.speciality}
                      />

                      <InfoItem
                        label="Diagnosis"
                        value={prescription.diagnosis}
                      />
                    </div>

                    {/* MEDICATIONS */}

                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-900">
                          Prescribed Medications
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Follow the dosage, duration and instructions provided
                          by your doctor.
                        </p>
                      </div>

                      {/* DESKTOP MEDICATION TABLE */}

                      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <PrescriptionHeading>
                                Medicine
                              </PrescriptionHeading>

                              <PrescriptionHeading>Type</PrescriptionHeading>

                              <PrescriptionHeading>Dosage</PrescriptionHeading>

                              <PrescriptionHeading>
                                Duration
                              </PrescriptionHeading>

                              <PrescriptionHeading>
                                Instruction
                              </PrescriptionHeading>
                            </tr>
                          </thead>

                          <tbody>
                            {prescription.medications.map((medicine, index) => (
                              <tr
                                key={
                                  medicine?._id || `${prescription.id}-${index}`
                                }
                                className="border-t border-slate-100"
                              >
                                <PrescriptionCell>
                                  <span className="font-semibold text-slate-800">
                                    {medicine?.name || "Medicine"}
                                  </span>
                                </PrescriptionCell>

                                <PrescriptionCell>
                                  <span className="capitalize">
                                    {medicine?.type || "—"}
                                  </span>
                                </PrescriptionCell>

                                <PrescriptionCell>
                                  {medicine?.dosage || "—"}
                                </PrescriptionCell>

                                <PrescriptionCell>
                                  {medicine?.duration || "—"}
                                </PrescriptionCell>

                                <PrescriptionCell>
                                  {medicine?.instruction || "—"}
                                </PrescriptionCell>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE MEDICATION CARDS */}

                      <div className="space-y-3 md:hidden">
                        {prescription.medications.map((medicine, index) => (
                          <div
                            key={
                              medicine?._id ||
                              `${prescription.id}-mobile-${index}`
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="font-semibold text-slate-900">
                                {medicine?.name || "Medicine"}
                              </h4>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-blue-600">
                                {medicine?.type || "Medicine"}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-slate-400">Dosage</p>

                                <p className="mt-1 font-medium text-slate-700">
                                  {medicine?.dosage || "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-slate-400">Duration</p>

                                <p className="mt-1 font-medium text-slate-700">
                                  {medicine?.duration || "—"}
                                </p>
                              </div>
                            </div>

                            {medicine?.instruction && (
                              <div className="mt-3 border-t border-slate-100 pt-3">
                                <p className="text-[11px] text-slate-400">
                                  Instruction
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {medicine.instruction}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ADVICE + FOLLOW UP */}

                    {(prescription.advice || prescription.followUp) && (
                      <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-5 md:grid-cols-2">
                        {prescription.advice && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Doctor Advice
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {prescription.advice}
                            </p>
                          </div>
                        )}

                        {prescription.followUp && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              Follow Up
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {prescription.followUp}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* =================================================
              CONSULTATION EMPTY STATE
          ================================================= */}

          {!loading &&
            !error &&
            activeTab !== "prescriptions" &&
            filteredRecords.length === 0 && (
              <EmptyState
                title="No medical records found"
                description={
                  records.length === 0
                    ? "Your completed consultations will appear here."
                    : "Try changing your search."
                }
              />
            )}

          {/* =================================================
              PRESCRIPTION EMPTY STATE
          ================================================= */}

          {!loading &&
            !error &&
            activeTab === "prescriptions" &&
            filteredPrescriptions.length === 0 && (
              <EmptyState
                title="No prescriptions found"
                description={
                  prescriptions.length === 0
                    ? "Your prescribed medications will appear here after your doctor completes a consultation."
                    : "No prescription matches your search."
                }
              />
            )}

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading && !error && (
            <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              {activeTab === "prescriptions" ? (
                <>
                  <p className="text-xs text-slate-500">
                    Showing {filteredPrescriptions.length} of{" "}
                    {prescriptions.length} prescriptions
                  </p>

                  <p className="text-xs text-slate-400">
                    {prescriptions.reduce(
                      (count, item) => count + item.medications.length,
                      0,
                    )}{" "}
                    prescribed medicines
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Showing {filteredRecords.length} of {records.length} records
                  </p>

                  <p className="text-xs text-slate-400">
                    Backend total: {total}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          EXISTING CONSULTATION MODAL
      ================================================= */}

      <ConsultationRecordModal
        open={recordModalOpen}
        appointmentId={selectedAppointmentId}
        onClose={handleCloseRecordModal}
      />
    </>
  );
}

// ======================================================
// TAB BUTTON
// ======================================================

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        whitespace-nowrap
        rounded-lg
        px-4
        py-2
        text-xs
        font-semibold
        transition
        ${
          active
            ? "bg-white text-blue-600 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }
      `}
    >
      {children}
    </button>
  );
}

// ======================================================
// TABLE HEADING
// ======================================================

function TableHeading({ children, className = "" }) {
  return (
    <th
      className={`
        whitespace-nowrap
        px-5
        py-3
        text-left
        text-[11px]
        font-semibold
        uppercase
        tracking-wide
        text-slate-500
        ${className}
      `}
    >
      {children}
    </th>
  );
}

// ======================================================
// ACTION BUTTON
// ======================================================

function ActionButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="
        flex
        h-8
        w-8
        items-center
        justify-center
        rounded-full
        border
        border-slate-200
        bg-white
        text-xs
        text-slate-500
        transition
        hover:border-blue-200
        hover:bg-blue-50
        hover:text-blue-600
      "
    >
      {children}
    </button>
  );
}

// ======================================================
// PRESCRIPTION HEADING
// ======================================================

function PrescriptionHeading({ children }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

// ======================================================
// PRESCRIPTION CELL
// ======================================================

function PrescriptionCell({ children }) {
  return <td className="px-4 py-3 text-sm text-slate-600">{children}</td>;
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({ label, value, subValue }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "N/A"}
      </p>

      {subValue && <p className="mt-0.5 text-xs text-slate-500">{subValue}</p>}
    </div>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FiFileText className="text-xl" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}
