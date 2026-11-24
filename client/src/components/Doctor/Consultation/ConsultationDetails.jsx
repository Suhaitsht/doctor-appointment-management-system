import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchConsultationByAppointment,
  selectConsultation,
  selectConsultationLoading,
  selectConsultationError,
  clearConsultation,
} from "@/redux/slices/consultationSlice";

import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHeart,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";

export default function ConsultationDetails({ appointmentId }) {
  const dispatch = useDispatch();

  const consultation = useSelector(selectConsultation);

  const loading = useSelector(selectConsultationLoading);

  const error = useSelector(selectConsultationError);

  /* ================================================
     FETCH CONSULTATION
  ================================================= */

  useEffect(() => {
    if (!appointmentId) {
      return;
    }

    dispatch(fetchConsultationByAppointment(appointmentId));

    return () => {
      dispatch(clearConsultation());
    };
  }, [dispatch, appointmentId]);

  /* ================================================
     LOADING
  ================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <FiRefreshCw className="mx-auto animate-spin text-3xl text-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading medical record...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while we retrieve the consultation.
          </p>
        </div>
      </div>
    );
  }

  /* ================================================
     ERROR
  ================================================= */

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-red-600" />

          <div>
            <h3 className="font-bold text-red-800">
              Unable to load medical record
            </h3>

            <p className="mt-1 text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() =>
                dispatch(fetchConsultationByAppointment(appointmentId))
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <FiRefreshCw />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================
     EMPTY
  ================================================= */

  if (!consultation) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <FiFileText className="mx-auto text-4xl text-slate-300" />

        <h3 className="mt-4 font-bold text-slate-700">
          No medical record found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          This appointment does not have a completed consultation.
        </p>
      </div>
    );
  }

  /* ================================================
     DATA
  ================================================= */

  const {
    patient = {},
    doctor = {},
    appointment = {},
    vitals = {},
    diagnosis = {},
    medications = [],
    laboratoryTests = [],
    complaints = [],
    clinicalTags = [],
  } = consultation;

  const doctorName = doctor?.user?.name || doctor?.name || "Doctor";

  const patientName =
    patient?.name ||
    appointment?.patientDetails?.name ||
    appointment?.patientDetails?.firstName ||
    "Patient";

  const completedDate = formatDate(consultation?.completedAt);

  const appointmentDate = formatDate(appointment?.appointmentDate);

  return (
    <div className="space-y-5">
      {/* =============================================
          PATIENT SUMMARY
      ============================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 via-white to-white p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              {patient?.image ? (
                <img
                  src={patient.image}
                  alt={patientName}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white sm:h-16 sm:w-16">
                  {getInitials(patientName)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                    {patientName}
                  </h2>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <FiCheckCircle />
                    Completed
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Consultation Medical Record
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {patient?.email && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiMail />

                      {patient.email}
                    </span>
                  )}

                  {patient?.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FiPhone />

                      {patient.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <SummaryItem
                icon={<FiCalendar />}
                label="Appointment"
                value={appointmentDate}
              />

              <SummaryItem
                icon={<FiClock />}
                label="Completed"
                value={completedDate}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <InfoItem label="Doctor" value={doctorName} />

          <InfoItem label="Speciality" value={doctor?.speciality} />

          <InfoItem label="Hospital" value={doctor?.hospital} />

          <InfoItem
            label="Appointment Type"
            value={appointment?.appointmentType}
          />
        </div>
      </section>

      {/* =============================================
          VITALS
      ============================================== */}

      <SectionCard
        icon={<FiActivity />}
        title="Vitals"
        subtitle="Patient vital signs recorded during consultation."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <VitalCard label="Temperature" value={vitals.temperature} unit="°C" />

          <VitalCard label="Pulse" value={vitals.pulse} unit="bpm" />

          <VitalCard
            label="Resp. Rate"
            value={vitals.respiratoryRate}
            unit="/min"
          />

          <VitalCard label="SpO₂" value={vitals.spo2} unit="%" />

          <VitalCard label="Height" value={vitals.height} unit="cm" />

          <VitalCard label="Weight" value={vitals.weight} unit="kg" />

          <VitalCard label="BMI" value={vitals.bmi} />
        </div>
      </SectionCard>

      {/* =============================================
          MEDICAL HISTORY + DIAGNOSIS
      ============================================== */}

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard icon={<FiHeart />} title="Clinical Information">
          <TextRecord
            label="Previous Medical History"
            value={consultation?.previousMedicalHistory}
          />

          <TagList label="Patient Complaints" items={complaints} />

          <TagList label="Clinical Tags" items={clinicalTags} />
        </SectionCard>

        <SectionCard icon={<FiFileText />} title="Diagnosis">
          <DiagnosisItem
            number="01"
            label="Primary Diagnosis"
            value={diagnosis.primary}
          />

          <DiagnosisItem
            number="02"
            label="Secondary Diagnosis"
            value={diagnosis.secondary}
          />

          <DiagnosisItem
            number="03"
            label="Final Diagnosis"
            value={diagnosis.final}
          />
        </SectionCard>
      </div>

      {/* =============================================
          CLINICAL NOTES
      ============================================== */}

      <SectionCard icon={<FiFileText />} title="Clinical Notes">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
            {consultation?.clinicalNotes || "No clinical notes recorded."}
          </p>
        </div>
      </SectionCard>

      {/* =============================================
          LAB TESTS
      ============================================== */}

      <SectionCard icon={<FiActivity />} title="Laboratory Tests">
        {laboratoryTests.length === 0 ? (
          <EmptyText>No laboratory tests recommended.</EmptyText>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {laboratoryTests.map((test, index) => (
              <div
                key={`${test}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">
                  {index + 1}
                </div>

                <p className="text-sm font-semibold text-slate-700">{test}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* =============================================
          PRESCRIPTION
      ============================================== */}

      <SectionCard
        icon={<FiFileText />}
        title="Prescription"
        subtitle="Medication prescribed during this consultation."
      >
        {medications.length === 0 ? (
          <EmptyText>No medication prescribed.</EmptyText>
        ) : (
          <div className="space-y-3">
            {medications.map((medicine, index) => (
              <div
                key={medicine?._id || index}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-3 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-slate-800">
                      {medicine?.name || "Medication"}
                    </h4>

                    <p className="mt-0.5 text-xs capitalize text-slate-400">
                      {medicine?.type || "Medicine"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-3">
                  <InfoItem label="Dosage" value={medicine?.dosage} />

                  <InfoItem label="Duration" value={medicine?.duration} />

                  <InfoItem label="Type" value={medicine?.type} />
                </div>

                {medicine?.instruction && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Instructions
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {medicine.instruction}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* =============================================
          ADVICE + FOLLOW UP
      ============================================== */}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard icon={<FiCheckCircle />} title="Patient Advice">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
            {consultation?.advice || "No advice recorded."}
          </p>
        </SectionCard>

        <SectionCard icon={<FiClock />} title="Follow-up">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
            {consultation?.followUp || "No follow-up required."}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

/* ======================================================
   REUSABLE COMPONENTS
====================================================== */

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>

          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function VitalCard({ label, value, unit = "" }) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-800">
        {hasValue ? value : "--"}

        {hasValue && unit && (
          <span className="ml-1 text-[11px] font-medium text-slate-400">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
        {value || "N/A"}
      </p>
    </div>
  );
}

function TextRecord({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
        {value || "Not recorded"}
      </p>
    </div>
  );
}

function TagList({ label, items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="mt-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {safeItems.length === 0 ? (
        <p className="text-sm text-slate-500">Not recorded</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {safeItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DiagnosisItem({ number, label, value }) {
  return (
    <div className="mb-3 flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 last:mb-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-bold text-blue-600">
        {number}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          {value || "Not recorded"}
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="shrink-0 text-blue-600">{icon}</div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

/* ======================================================
   HELPERS
====================================================== */

function getInitials(name = "") {
  if (!name) {
    return "P";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
