import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FiX,
  FiFileText,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiClock,
  FiActivity,
  FiHeart,
  FiClipboard,
  FiThermometer,
  FiCheckCircle,
  FiPrinter,
  FiDownload,
} from "react-icons/fi";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  fetchConsultationByAppointment,
  clearConsultationRecord,
  selectConsultation,
  selectConsultationLoading,
  selectConsultationError,
  selectConsultationFetchSuccess,
} from "@/redux/slices/consultationSlice";

// ======================================================
// MAIN MODAL
// ======================================================

export default function ConsultationRecordModal({
  open,
  appointmentId,
  appointment,
  onClose,
}) {
  const dispatch = useDispatch();

  const consultation = useSelector(selectConsultation);
  const loading = useSelector(selectConsultationLoading);
  const error = useSelector(selectConsultationError);
  const fetchSuccess = useSelector(selectConsultationFetchSuccess);

  // ====================================================
  // FETCH CONSULTATION
  // ====================================================

  useEffect(() => {
    if (!open || !appointmentId) return;

    console.log("====================================");
    console.log("FETCH CONSULTATION RECORD");
    console.log("Appointment ID:", appointmentId);
    console.log("====================================");

    dispatch(fetchConsultationByAppointment(appointmentId));
  }, [dispatch, open, appointmentId]);

  // ====================================================
  // ESCAPE KEY
  // ====================================================

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        dispatch(clearConsultationRecord());
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dispatch, open, onClose]);

  // ====================================================
  // BODY SCROLL LOCK
  // ====================================================

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // ====================================================
  // CLOSE
  // ====================================================

  const handleClose = () => {
    dispatch(clearConsultationRecord());
    onClose?.();
  };

  // ====================================================
  // RETRY
  // ====================================================

  const handleRetry = () => {
    if (!appointmentId) return;

    dispatch(fetchConsultationByAppointment(appointmentId));
  };

  // ====================================================
  // PRINT
  // ====================================================

  const handlePrint = () => {
    if (!consultation) return;

    const html = buildPrintableHTML({
      consultation,
      appointment,
      appointmentId,
    });

    const printWindow = window.open("", "_blank", "width=1100,height=850");

    if (!printWindow) {
      window.alert("Unable to open the print window. Please allow popups.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ====================================================
  // PDF DOWNLOAD
  // ====================================================

  const handleDownloadPDF = () => {
    if (!consultation) return;

    generateConsultationPDF({
      consultation,
      appointment,
      appointmentId,
    });
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-slate-950/50
        p-3 backdrop-blur-sm
        sm:p-5
      "
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-modal-title"
        className="
          relative flex
          max-h-[94vh]
          w-full max-w-6xl
          flex-col overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white shadow-2xl
          sm:rounded-3xl
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex shrink-0
            items-start justify-between
            gap-4
            border-b border-slate-200
            bg-white
            px-4 py-4
            sm:px-6
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl
                bg-emerald-50
                text-lg text-emerald-600
              "
            >
              <FiFileText />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="consultation-modal-title"
                  className="text-lg font-bold text-slate-900 sm:text-xl"
                >
                  Consultation Record
                </h2>

                {consultation?.status === "completed" && (
                  <span
                    className="
                      inline-flex items-center gap-1
                      rounded-full
                      bg-emerald-50
                      px-2.5 py-1
                      text-[10px] font-bold
                      uppercase tracking-wide
                      text-emerald-700
                    "
                  >
                    <FiCheckCircle />
                    Completed
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Patient medical consultation details
              </p>

              {appointmentId && (
                <p className="mt-1 truncate text-[10px] font-medium text-slate-400">
                  Appointment:{" "}
                  {appointment?.id ||
                    `#${appointmentId.slice(-8).toUpperCase()}`}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close consultation record"
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-full
              border border-transparent
              text-slate-500
              transition
              hover:border-slate-200
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
          {loading && <LoadingState />}

          {!loading && error && (
            <ErrorState error={error} onRetry={handleRetry} />
          )}

          {!loading && !error && consultation && (
            <ConsultationContent
              consultation={consultation}
              appointment={appointment}
            />
          )}

          {!loading && !error && !consultation && fetchSuccess && (
            <EmptyState />
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex shrink-0
            flex-col gap-3
            border-t border-slate-200
            bg-white
            px-4 py-3
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-600">
              Jayanthi Medical Centre
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Confidential medical consultation record
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {/* PRINT */}

            <button
              type="button"
              onClick={handlePrint}
              disabled={!consultation || loading}
              className="
                inline-flex w-full
                items-center justify-center
                gap-2
                rounded-xl
                border border-slate-200
                bg-white
                px-4 py-2.5
                text-sm font-semibold
                text-slate-700
                transition
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              <FiPrinter />
              Print
            </button>

            {/* DOWNLOAD PDF */}

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={!consultation || loading}
              className="
                inline-flex w-full
                items-center justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4 py-2.5
                text-sm font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              <FiDownload />
              Download PDF
            </button>

            {/* CLOSE */}

            <button
              type="button"
              onClick={handleClose}
              className="
                inline-flex w-full
                items-center justify-center
                rounded-xl
                bg-slate-900
                px-5 py-2.5
                text-sm font-semibold
                text-white
                transition
                hover:bg-slate-800
                sm:w-auto
              "
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// CONSULTATION CONTENT
// ======================================================

function ConsultationContent({ consultation, appointment }) {
  const patient = consultation?.patient || {};
  const doctor = consultation?.doctor || {};
  const vitals = consultation?.vitals || {};
  const diagnosis = consultation?.diagnosis || {};

  const medications = Array.isArray(consultation?.medications)
    ? consultation.medications
    : [];

  const laboratoryTests = Array.isArray(consultation?.laboratoryTests)
    ? consultation.laboratoryTests
    : [];

  const complaints = Array.isArray(consultation?.complaints)
    ? consultation.complaints
    : [];

  const clinicalTags = Array.isArray(consultation?.clinicalTags)
    ? consultation.clinicalTags
    : [];

  return (
    <div className="space-y-5">
      {/* =================================================
          PATIENT SUMMARY
      ================================================= */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white shadow-sm
        "
      >
        <div
          className="
            flex flex-col
            gap-5 p-5
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div className="flex min-w-0 items-center gap-4">
            <PatientAvatar
              name={patient?.name || appointment?.patientName}
              image={patient?.image || appointment?.patientImage}
            />

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Patient
              </p>

              <h3 className="truncate text-lg font-bold text-slate-900">
                {patient?.name || appointment?.patientName || "Patient"}
              </h3>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <SmallInfo
                  icon={<FiMail />}
                  value={patient?.email || appointment?.email}
                />

                <SmallInfo
                  icon={<FiPhone />}
                  value={patient?.phone || appointment?.phone}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryItem
              icon={<FiCalendar />}
              label="Date"
              value={
                formatDate(consultation?.appointment?.appointmentDate) ||
                appointment?.date
              }
            />

            <SummaryItem
              icon={<FiClock />}
              label="Time"
              value={
                appointment?.time ||
                getAppointmentTime(consultation?.appointment)
              }
            />

            <SummaryItem
              icon={<FiClipboard />}
              label="Type"
              value={
                consultation?.appointment?.appointmentType ||
                appointment?.appointmentType ||
                appointment?.visitType ||
                "Clinic"
              }
            />
          </div>
        </div>
      </section>

      {/* =================================================
          VITALS
      ================================================= */}

      <Section
        title="Patient Vitals"
        subtitle="Recorded during consultation"
        icon={<FiActivity />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <VitalCard
            label="Temperature"
            value={vitals?.temperature}
            unit="°C"
            icon={<FiThermometer />}
          />

          <VitalCard
            label="Pulse"
            value={vitals?.pulse}
            unit="bpm"
            icon={<FiHeart />}
          />

          <VitalCard
            label="Respiratory"
            value={vitals?.respiratoryRate}
            unit="/min"
            icon={<FiActivity />}
          />

          <VitalCard
            label="SpO₂"
            value={vitals?.spo2}
            unit="%"
            icon={<FiActivity />}
          />

          <VitalCard label="Height" value={vitals?.height} unit="cm" />

          <VitalCard label="Weight" value={vitals?.weight} unit="kg" />
        </div>

        {(vitals?.bloodPressure || vitals?.bmi) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {vitals?.bloodPressure && (
              <DetailCard label="Blood Pressure" value={vitals.bloodPressure} />
            )}

            {vitals?.bmi && <DetailCard label="BMI" value={vitals.bmi} />}
          </div>
        )}
      </Section>

      {/* =================================================
          COMPLAINTS
      ================================================= */}

      {complaints.length > 0 && (
        <Section title="Patient Complaints" icon={<FiFileText />}>
          <TagList items={complaints} />
        </Section>
      )}

      {/* =================================================
          PREVIOUS MEDICAL HISTORY
      ================================================= */}

      <Section title="Previous Medical History" icon={<FiHeart />}>
        <TextContent
          value={consultation?.previousMedicalHistory}
          fallback="No previous medical history recorded."
        />
      </Section>

      {/* =================================================
          CLINICAL NOTES
      ================================================= */}

      <Section title="Clinical Notes" icon={<FiFileText />}>
        <TextContent
          value={consultation?.clinicalNotes}
          fallback="No clinical notes recorded."
        />

        {clinicalTags.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Clinical Tags
            </p>

            <TagList items={clinicalTags} />
          </div>
        )}
      </Section>

      {/* =================================================
          DIAGNOSIS
      ================================================= */}

      <Section title="Diagnosis" icon={<FiClipboard />}>
        <div className="grid gap-3 md:grid-cols-3">
          <DetailCard label="Primary Diagnosis" value={diagnosis?.primary} />

          <DetailCard
            label="Secondary Diagnosis"
            value={diagnosis?.secondary}
          />

          <DetailCard
            label="Final Diagnosis"
            value={diagnosis?.final}
            highlight
          />
        </div>
      </Section>

      {/* =================================================
          LABORATORY TESTS
      ================================================= */}

      <Section title="Laboratory Tests" icon={<FiActivity />}>
        {laboratoryTests.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {laboratoryTests.map((test, index) => (
              <div
                key={`${String(test)}-${index}`}
                className="
                    flex items-center
                    gap-3
                    rounded-xl
                    border border-blue-100
                    bg-blue-50/60
                    px-4 py-3
                  "
              >
                <FiCheckCircle className="shrink-0 text-blue-600" />

                <span className="text-sm font-medium text-slate-700">
                  {typeof test === "string"
                    ? test
                    : test?.name || test?.testName || "Laboratory Test"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText>No laboratory tests prescribed.</EmptyText>
        )}
      </Section>

      {/* =================================================
          MEDICATIONS
      ================================================= */}

      <Section title="Prescription / Medications" icon={<FiFileText />}>
        {medications.length > 0 ? (
          <div className="space-y-3">
            {medications.map((medication, index) => (
              <MedicationCard
                key={medication?._id || `medication-${index}`}
                medication={medication}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyText>No medications prescribed.</EmptyText>
        )}
      </Section>

      {/* =================================================
          ADVICE / FOLLOW UP
      ================================================= */}

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Doctor Advice" icon={<FiFileText />}>
          <TextContent
            value={consultation?.advice}
            fallback="No advice recorded."
          />
        </Section>

        <Section title="Follow Up" icon={<FiCalendar />}>
          <TextContent
            value={consultation?.followUp}
            fallback="No follow-up instructions recorded."
          />
        </Section>
      </div>

      {/* =================================================
          DOCTOR
      ================================================= */}

      <Section title="Consulting Doctor" icon={<FiUser />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard
            label="Doctor"
            value={doctor?.user?.name || doctor?.name}
          />

          <DetailCard label="Speciality" value={doctor?.speciality} />

          <DetailCard label="Hospital" value={doctor?.hospital} />

          <DetailCard
            label="Consultation Fee"
            value={
              doctor?.consultationFee != null
                ? `Rs. ${Number(doctor.consultationFee).toLocaleString()}`
                : null
            }
          />
        </div>
      </Section>

      {consultation?.completedAt && (
        <div className="flex justify-end">
          <p className="text-xs text-slate-400">
            Consultation completed {formatDateTime(consultation.completedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ======================================================
// MEDICATION CARD
// ======================================================

function MedicationCard({ medication, index }) {
  const medicineName =
    medication?.medicine ||
    medication?.name ||
    medication?.medicineName ||
    `Medicine ${index + 1}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">{medicineName}</p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MedicineInfo label="Type" value={medication?.type} />

        <MedicineInfo label="Dosage" value={medication?.dosage} />

        <MedicineInfo label="Frequency" value={medication?.frequency} />

        <MedicineInfo label="Duration" value={medication?.duration} />
      </div>

      {(medication?.instruction || medication?.instructions) && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Instructions
          </p>

          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
            {medication?.instruction || medication?.instructions}
          </p>
        </div>
      )}
    </div>
  );
}

// ======================================================
// SECTION
// ======================================================

function Section({ title, subtitle, icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>

          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

// ======================================================
// VITAL CARD
// ======================================================

function VitalCard({ label, value, unit, icon }) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {hasValue ? value : "N/A"}

        {hasValue && unit && (
          <span className="ml-1 text-xs font-medium text-slate-400">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

// ======================================================
// DETAIL CARD
// ======================================================

function DetailCard({ label, value, highlight = false }) {
  return (
    <div
      className={`
        rounded-xl border p-4
        ${
          highlight
            ? "border-emerald-100 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50"
        }
      `}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`
          mt-1.5 text-sm font-semibold
          ${highlight ? "text-emerald-700" : "text-slate-800"}
        `}
      >
        {value || "N/A"}
      </p>
    </div>
  );
}

// ======================================================
// TEXT CONTENT
// ======================================================

function TextContent({ value, fallback }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
        {value || fallback}
      </p>
    </div>
  );
}

// ======================================================
// TAG LIST
// ======================================================

function TagList({ items = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const value =
          typeof item === "string"
            ? item
            : item?.name || item?.label || item?.title;

        if (!value) return null;

        return (
          <span
            key={`${value}-${index}`}
            className="
              rounded-full
              border border-blue-100
              bg-blue-50
              px-3 py-1.5
              text-xs font-semibold
              text-blue-700
            "
          >
            {value}
          </span>
        );
      })}
    </div>
  );
}

// ======================================================
// PATIENT AVATAR
// ======================================================

function PatientAvatar({ name, image }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name || "Patient"}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-base font-bold text-emerald-700">
      {getInitials(name)}
    </div>
  );
}

// ======================================================
// SUMMARY ITEM
// ======================================================

function SummaryItem({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-blue-600">{icon}</span>

        <span className="text-xs font-semibold text-slate-700">
          {value || "N/A"}
        </span>
      </div>
    </div>
  );
}

// ======================================================
// SMALL INFO
// ======================================================

function SmallInfo({ icon, value }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span>{icon}</span>

      <span className="break-all">{value}</span>
    </div>
  );
}

// ======================================================
// MEDICINE INFO
// ======================================================

function MedicineInfo({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value || "N/A"}
      </p>
    </div>
  );
}

// ======================================================
// LOADING
// ======================================================

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <FiLoader className="animate-spin text-2xl text-blue-600" />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading consultation record
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Please wait while we retrieve the medical record.
        </p>
      </div>
    </div>
  );
}

// ======================================================
// ERROR
// ======================================================

function ErrorState({ error, onRetry }) {
  const message =
    typeof error === "string"
      ? error
      : error?.message || "Unable to load consultation record.";

  return (
    <div className="flex min-h-[380px] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <FiAlertCircle className="text-xl" />
        </div>

        <h3 className="mt-4 font-bold text-red-800">
          Unable to load consultation
        </h3>

        <p className="mt-2 text-sm leading-6 text-red-600">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="
            mt-5 inline-flex
            items-center gap-2
            rounded-xl
            bg-red-600
            px-4 py-2.5
            text-sm font-semibold
            text-white
            transition
            hover:bg-red-700
          "
        >
          <FiRefreshCw />
          Try Again
        </button>
      </div>
    </div>
  );
}

// ======================================================
// EMPTY
// ======================================================

function EmptyState() {
  return (
    <div className="flex min-h-[350px] items-center justify-center">
      <div className="text-center">
        <FiFileText className="mx-auto text-3xl text-slate-300" />

        <h3 className="mt-3 font-bold text-slate-700">
          No consultation record
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          No medical record was found for this appointment.
        </p>
      </div>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

// ======================================================
// PDF GENERATOR
// ======================================================

function generateConsultationPDF({ consultation, appointment, appointmentId }) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const patient = consultation?.patient || {};

    const doctor = consultation?.doctor || {};

    const vitals = consultation?.vitals || {};

    const diagnosis = consultation?.diagnosis || {};

    const appointmentData = consultation?.appointment || {};

    const medications = Array.isArray(consultation?.medications)
      ? consultation.medications
      : [];

    const tests = Array.isArray(consultation?.laboratoryTests)
      ? consultation.laboratoryTests
      : [];

    const complaints = Array.isArray(consultation?.complaints)
      ? consultation.complaints
      : [];

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = 16;

    // ==================================================
    // HEADER
    // ==================================================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);

    doc.text("Jayanthi Medical Centre", pageWidth / 2, y, { align: "center" });

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text("Medical Consultation Record", pageWidth / 2, y, {
      align: "center",
    });

    y += 6;

    doc.setFontSize(8);

    doc.text(
      `Appointment ID: ${appointment?.id || appointmentId || "N/A"}`,
      pageWidth / 2,
      y,
      { align: "center" },
    );

    y += 6;

    doc.setDrawColor(210);

    doc.line(margin, y, pageWidth - margin, y);

    y += 9;

    // ==================================================
    // PATIENT
    // ==================================================

    addPDFSectionTitle(doc, "Patient Information", y);

    y += 5;

    autoTable(doc, {
      startY: y,

      body: [
        ["Patient", patient?.name || appointment?.patientName || "N/A"],

        ["Email", patient?.email || appointment?.email || "N/A"],

        ["Phone", patient?.phone || appointment?.phone || "N/A"],

        [
          "Date",
          formatDate(appointmentData?.appointmentDate) ||
            appointment?.date ||
            "N/A",
        ],

        [
          "Time",
          appointment?.time || getAppointmentTime(appointmentData) || "N/A",
        ],

        [
          "Type",
          appointmentData?.appointmentType ||
            appointment?.appointmentType ||
            appointment?.visitType ||
            "Clinic",
        ],
      ],

      theme: "grid",

      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },

      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 43,
        },
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    // ==================================================
    // VITALS
    // ==================================================

    y = ensurePDFSpace(doc, y, 35);

    addPDFSectionTitle(doc, "Patient Vitals", y);

    y += 5;

    autoTable(doc, {
      startY: y,

      head: [["Temp.", "Pulse", "Resp.", "SpO2", "Height", "Weight"]],

      body: [
        [
          formatUnit(vitals?.temperature, " C"),

          formatUnit(vitals?.pulse, " bpm"),

          formatUnit(vitals?.respiratoryRate, "/min"),

          formatUnit(vitals?.spo2, "%"),

          formatUnit(vitals?.height, " cm"),

          formatUnit(vitals?.weight, " kg"),
        ],
      ],

      theme: "grid",

      styles: {
        fontSize: 7.5,
        halign: "center",
        cellPadding: 2.5,
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    if (vitals?.bloodPressure || vitals?.bmi) {
      autoTable(doc, {
        startY: y,

        body: [
          [
            "Blood Pressure",
            vitals?.bloodPressure || "N/A",
            "BMI",
            vitals?.bmi || "N/A",
          ],
        ],

        theme: "grid",

        styles: {
          fontSize: 8,
        },

        columnStyles: {
          0: {
            fontStyle: "bold",
          },

          2: {
            fontStyle: "bold",
          },
        },

        margin: {
          left: margin,
          right: margin,
        },
      });

      y = doc.lastAutoTable.finalY + 9;
    }

    // ==================================================
    // COMPLAINTS
    // ==================================================

    if (complaints.length) {
      const complaintText = complaints
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.name || item?.label || item?.title,
        )
        .filter(Boolean)
        .join(", ");

      y = addPDFTextSection(doc, "Patient Complaints", complaintText, y);
    }

    // ==================================================
    // HISTORY
    // ==================================================

    y = addPDFTextSection(
      doc,
      "Previous Medical History",
      consultation?.previousMedicalHistory ||
        "No previous medical history recorded.",
      y,
    );

    // ==================================================
    // CLINICAL NOTES
    // ==================================================

    y = addPDFTextSection(
      doc,
      "Clinical Notes",
      consultation?.clinicalNotes || "No clinical notes recorded.",
      y,
    );

    // ==================================================
    // DIAGNOSIS
    // ==================================================

    y = ensurePDFSpace(doc, y, 35);

    addPDFSectionTitle(doc, "Diagnosis", y);

    y += 5;

    autoTable(doc, {
      startY: y,

      head: [["Primary", "Secondary", "Final"]],

      body: [
        [
          diagnosis?.primary || "N/A",

          diagnosis?.secondary || "N/A",

          diagnosis?.final || "N/A",
        ],
      ],

      theme: "grid",

      styles: {
        fontSize: 8,
        cellPadding: 3,
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    // ==================================================
    // LAB TESTS
    // ==================================================

    y = ensurePDFSpace(doc, y, 40);

    addPDFSectionTitle(doc, "Laboratory Tests", y);

    y += 5;

    const testRows =
      tests.length > 0
        ? tests.map((test, index) => [
            index + 1,

            typeof test === "string"
              ? test
              : test?.name || test?.testName || "Laboratory Test",
          ])
        : [["-", "No laboratory tests prescribed."]];

    autoTable(doc, {
      startY: y,

      head: [["#", "Laboratory Test"]],

      body: testRows,

      theme: "grid",

      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },

      columnStyles: {
        0: {
          cellWidth: 12,
          halign: "center",
        },
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    // ==================================================
    // PRESCRIPTION
    // ==================================================

    y = ensurePDFSpace(doc, y, 50);

    addPDFSectionTitle(doc, "Prescription / Medications", y);

    y += 5;

    const medicationRows =
      medications.length > 0
        ? medications.map((medication, index) => [
            index + 1,

            medication?.medicine ||
              medication?.name ||
              medication?.medicineName ||
              `Medicine ${index + 1}`,

            medication?.dosage || "N/A",

            medication?.frequency || "N/A",

            medication?.duration || "N/A",

            medication?.instruction || medication?.instructions || "N/A",
          ])
        : [["-", "No medications prescribed.", "-", "-", "-", "-"]];

    autoTable(doc, {
      startY: y,

      head: [
        ["#", "Medicine", "Dosage", "Frequency", "Duration", "Instructions"],
      ],

      body: medicationRows,

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "top",
      },

      columnStyles: {
        0: {
          cellWidth: 8,
        },

        1: {
          cellWidth: 30,
        },

        2: {
          cellWidth: 22,
        },

        3: {
          cellWidth: 28,
        },

        4: {
          cellWidth: 24,
        },

        5: {
          cellWidth: 54,
        },
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    y = doc.lastAutoTable.finalY + 9;

    // ==================================================
    // ADVICE
    // ==================================================

    y = addPDFTextSection(
      doc,
      "Doctor Advice",
      consultation?.advice || "No advice recorded.",
      y,
    );

    // ==================================================
    // FOLLOW UP
    // ==================================================

    y = addPDFTextSection(
      doc,
      "Follow Up",
      consultation?.followUp || "No follow-up instructions recorded.",
      y,
    );

    // ==================================================
    // DOCTOR
    // ==================================================

    y = ensurePDFSpace(doc, y, 55);

    addPDFSectionTitle(doc, "Consulting Doctor", y);

    y += 5;

    autoTable(doc, {
      startY: y,

      body: [
        ["Doctor", doctor?.user?.name || doctor?.name || "N/A"],

        ["Speciality", doctor?.speciality || "N/A"],

        ["Hospital", doctor?.hospital || "Jayanthi Medical Centre"],

        [
          "Consultation Fee",
          doctor?.consultationFee != null
            ? `Rs. ${Number(doctor.consultationFee).toLocaleString()}`
            : "N/A",
        ],

        ["Completed At", formatDateTime(consultation?.completedAt) || "N/A"],
      ],

      theme: "grid",

      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },

      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 43,
        },
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    // ==================================================
    // SIGNATURE
    // ==================================================

    y = doc.lastAutoTable.finalY + 18;

    y = ensurePDFSpace(doc, y, 25);

    doc.setDrawColor(130);

    doc.line(pageWidth - 75, y, pageWidth - 15, y);

    doc.setFontSize(8);

    doc.text("Doctor Signature", pageWidth - 45, y + 5, {
      align: "center",
    });

    // ==================================================
    // FOOTERS
    // ==================================================

    addPDFFooters(doc);

    // ==================================================
    // SAVE
    // ==================================================

    const patientName = sanitizeFileName(
      patient?.name || appointment?.patientName || "Patient",
    );

    const fileAppointmentId = sanitizeFileName(
      appointmentId || appointment?._id || "Consultation",
    );

    doc.save(`Consultation_${patientName}_${fileAppointmentId}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);

    window.alert("Unable to generate consultation PDF.");
  }
}

// ======================================================
// PRINT HTML
// ======================================================

function buildPrintableHTML({ consultation, appointment, appointmentId }) {
  const patient = consultation?.patient || {};

  const doctor = consultation?.doctor || {};

  const vitals = consultation?.vitals || {};

  const diagnosis = consultation?.diagnosis || {};

  const appointmentData = consultation?.appointment || {};

  const medications = Array.isArray(consultation?.medications)
    ? consultation.medications
    : [];

  const tests = Array.isArray(consultation?.laboratoryTests)
    ? consultation.laboratoryTests
    : [];

  const medicineRows = medications.length
    ? medications
        .map(
          (medicine, index) => `
              <tr>
                <td>${index + 1}</td>

                <td>
                  ${escapeHTML(
                    medicine?.medicine ||
                      medicine?.name ||
                      medicine?.medicineName ||
                      "N/A",
                  )}
                </td>

                <td>
                  ${escapeHTML(medicine?.dosage || "N/A")}
                </td>

                <td>
                  ${escapeHTML(medicine?.frequency || "N/A")}
                </td>

                <td>
                  ${escapeHTML(medicine?.duration || "N/A")}
                </td>

                <td>
                  ${escapeHTML(
                    medicine?.instruction || medicine?.instructions || "N/A",
                  )}
                </td>
              </tr>
            `,
        )
        .join("")
    : `
          <tr>
            <td colspan="6">
              No medications prescribed.
            </td>
          </tr>
        `;

  const testItems = tests.length
    ? tests
        .map(
          (test) => `
              <li>
                ${escapeHTML(
                  typeof test === "string"
                    ? test
                    : test?.name || test?.testName || "Laboratory Test",
                )}
              </li>
            `,
        )
        .join("")
    : `
          <li>
            No laboratory tests prescribed.
          </li>
        `;

  return `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />

  <title>
    Consultation Record
  </title>

  <style>
    @page {
      size: A4;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      background: white;
    }

    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 23px;
    }

    .header p {
      margin: 5px 0 0;
      color: #64748b;
    }

    .appointment-id {
      margin-top: 6px;
      color: #64748b;
      font-size: 10px;
    }

    section {
      margin-top: 20px;
      page-break-inside: avoid;
    }

    h2 {
      margin: 0 0 9px;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      font-size: 11px;
    }

    .label {
      width: 170px;
      background: #f8fafc;
      font-weight: bold;
    }

    .text-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      line-height: 1.65;
      white-space: pre-line;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }

    .signature {
      width: 230px;
      margin-top: 50px;
      margin-left: auto;
      border-top: 1px solid #64748b;
      padding-top: 7px;
      text-align: center;
    }

    .footer {
      margin-top: 35px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      color: #64748b;
      font-size: 9px;
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="header">
    <h1>
      Jayanthi Medical Centre
    </h1>

    <p>
      Medical Consultation Record
    </p>

    <div class="appointment-id">
      Appointment ID:
      ${escapeHTML(appointment?.id || appointmentId || "N/A")}
    </div>
  </div>

  <section>
    <h2>
      Patient Information
    </h2>

    <table>
      <tr>
        <td class="label">
          Patient
        </td>

        <td>
          ${escapeHTML(patient?.name || appointment?.patientName || "N/A")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Email
        </td>

        <td>
          ${escapeHTML(patient?.email || appointment?.email || "N/A")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Phone
        </td>

        <td>
          ${escapeHTML(patient?.phone || appointment?.phone || "N/A")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Date
        </td>

        <td>
          ${escapeHTML(
            formatDate(appointmentData?.appointmentDate) ||
              appointment?.date ||
              "N/A",
          )}
        </td>
      </tr>

      <tr>
        <td class="label">
          Time
        </td>

        <td>
          ${escapeHTML(
            appointment?.time || getAppointmentTime(appointmentData) || "N/A",
          )}
        </td>
      </tr>
    </table>
  </section>

  <section>
    <h2>
      Patient Vitals
    </h2>

    <table>
      <thead>
        <tr>
          <th>Temperature</th>
          <th>Pulse</th>
          <th>Resp.</th>
          <th>SpO2</th>
          <th>Height</th>
          <th>Weight</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            ${escapeHTML(formatUnit(vitals?.temperature, " °C"))}
          </td>

          <td>
            ${escapeHTML(formatUnit(vitals?.pulse, " bpm"))}
          </td>

          <td>
            ${escapeHTML(formatUnit(vitals?.respiratoryRate, "/min"))}
          </td>

          <td>
            ${escapeHTML(formatUnit(vitals?.spo2, "%"))}
          </td>

          <td>
            ${escapeHTML(formatUnit(vitals?.height, " cm"))}
          </td>

          <td>
            ${escapeHTML(formatUnit(vitals?.weight, " kg"))}
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  ${printTextSection(
    "Previous Medical History",
    consultation?.previousMedicalHistory ||
      "No previous medical history recorded.",
  )}

  ${printTextSection(
    "Clinical Notes",
    consultation?.clinicalNotes || "No clinical notes recorded.",
  )}

  <section>
    <h2>
      Diagnosis
    </h2>

    <table>
      <thead>
        <tr>
          <th>Primary</th>
          <th>Secondary</th>
          <th>Final</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            ${escapeHTML(diagnosis?.primary || "N/A")}
          </td>

          <td>
            ${escapeHTML(diagnosis?.secondary || "N/A")}
          </td>

          <td>
            ${escapeHTML(diagnosis?.final || "N/A")}
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>
      Laboratory Tests
    </h2>

    <ul>
      ${testItems}
    </ul>
  </section>

  <section>
    <h2>
      Prescription / Medications
    </h2>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>
        </tr>
      </thead>

      <tbody>
        ${medicineRows}
      </tbody>
    </table>
  </section>

  ${printTextSection(
    "Doctor Advice",
    consultation?.advice || "No advice recorded.",
  )}

  ${printTextSection(
    "Follow Up",
    consultation?.followUp || "No follow-up instructions recorded.",
  )}

  <section>
    <h2>
      Consulting Doctor
    </h2>

    <table>
      <tr>
        <td class="label">
          Doctor
        </td>

        <td>
          ${escapeHTML(doctor?.user?.name || doctor?.name || "N/A")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Speciality
        </td>

        <td>
          ${escapeHTML(doctor?.speciality || "N/A")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Hospital
        </td>

        <td>
          ${escapeHTML(doctor?.hospital || "Jayanthi Medical Centre")}
        </td>
      </tr>

      <tr>
        <td class="label">
          Completed At
        </td>

        <td>
          ${escapeHTML(formatDateTime(consultation?.completedAt) || "N/A")}
        </td>
      </tr>
    </table>
  </section>

  <div class="signature">
    Doctor Signature
  </div>

  <div class="footer">
    Jayanthi Medical Centre
    · Confidential Medical Record
  </div>
</body>
</html>
`;
}

// ======================================================
// PRINT TEXT SECTION
// ======================================================

function printTextSection(title, value) {
  return `
    <section>
      <h2>
        ${escapeHTML(title)}
      </h2>

      <div class="text-box">
        ${escapeHTML(value || "N/A")}
      </div>
    </section>
  `;
}

// ======================================================
// PDF HELPERS
// ======================================================

function addPDFSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");

  doc.setFontSize(11);

  doc.text(title, 15, y);

  doc.setFont("helvetica", "normal");
}

function ensurePDFSpace(doc, y, requiredSpace = 30) {
  if (y + requiredSpace > 275) {
    doc.addPage();

    return 20;
  }

  return y;
}

function addPDFTextSection(doc, title, value, y) {
  y = ensurePDFSpace(doc, y, 35);

  addPDFSectionTitle(doc, title, y);

  y += 6;

  doc.setFont("helvetica", "normal");

  doc.setFontSize(8.5);

  const paragraphs = String(value || "N/A").split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      y += 3;
      continue;
    }

    const lines = doc.splitTextToSize(paragraph, 180);

    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, 15, y);

      y += 4.5;
    }
  }

  return y + 6;
}

function addPDFFooters(doc) {
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(220);

    doc.line(15, 283, 195, 283);

    doc.setFont("helvetica", "normal");

    doc.setFontSize(7);

    doc.text("Jayanthi Medical Centre - Confidential Medical Record", 15, 288);

    doc.text(`Page ${page} of ${pages}`, 195, 288, {
      align: "right",
    });
  }
}

// ======================================================
// GENERAL HELPERS
// ======================================================

function formatUnit(value, unit = "") {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }

  return `${value}${unit}`;
}

function sanitizeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAppointmentTime(appointment) {
  return (
    appointment?.timeSlot?.startTime ||
    appointment?.timeSlot?.start ||
    appointment?.time ||
    null
  );
}
