import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchAppointmentById,
  completeConsultation,
  resetCompleteConsultation,
  selectSelectedAppointment,
  selectSelectedAppointmentLoading,
  selectSelectedAppointmentError,
  selectCompletingConsultation,
  selectCompleteConsultationError,
  selectCompleteConsultationSuccess,
} from "@/redux/slices/appointmentSlice";

import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUser,
  FiPhone,
  FiThermometer,
} from "react-icons/fi";

/* =========================================================
   INITIAL DATA
========================================================= */

const emptyMedication = {
  name: "",
  type: "tablet",
  dosage: "",
  duration: "",
  instruction: "",
};

const initialForm = {
  vitals: {
    temperature: "",
    pulse: "",
    respiratoryRate: "",
    spo2: "",
    height: "",
    weight: "",
    bmi: "",
  },

  diagnosis: {
    primary: "",
    secondary: "",
    final: "",
  },

  previousMedicalHistory: "",
  clinicalNotes: "",

  complaints: [],
  clinicalTags: [],
  laboratoryTests: [],

  medications: [{ ...emptyMedication }],

  advice: "",
  followUp: "",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AppointmentDetails({ appointmentId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* =======================================================
     REDUX
  ======================================================= */

  const appointment = useSelector(selectSelectedAppointment);
  const loading = useSelector(selectSelectedAppointmentLoading);
  const appointmentError = useSelector(selectSelectedAppointmentError);

  const completing = useSelector(selectCompletingConsultation);
  const completeError = useSelector(selectCompleteConsultationError);
  const completeSuccess = useSelector(selectCompleteConsultationSuccess);

  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [formData, setFormData] = useState(initialForm);

  const [complaintInput, setComplaintInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [labInput, setLabInput] = useState("");

  const [validationErrors, setValidationErrors] = useState({});

  /* =======================================================
     FETCH APPOINTMENT
  ======================================================= */

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(fetchAppointmentById(appointmentId));
  }, [dispatch, appointmentId]);

  /* =======================================================
     RESET COMPLETE STATE
  ======================================================= */

  useEffect(() => {
    dispatch(resetCompleteConsultation());

    return () => {
      dispatch(resetCompleteConsultation());
    };
  }, [dispatch]);

  /* =======================================================
     AUTO BMI
  ======================================================= */

  useEffect(() => {
    const height = Number(formData.vitals.height);
    const weight = Number(formData.vitals.weight);

    if (!height || !weight) {
      setFormData((previous) => {
        if (previous.vitals.bmi === "") {
          return previous;
        }

        return {
          ...previous,
          vitals: {
            ...previous.vitals,
            bmi: "",
          },
        };
      });

      return;
    }

    const heightInMeters = height / 100;

    if (heightInMeters <= 0) return;

    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    setFormData((previous) => {
      if (previous.vitals.bmi === bmi) {
        return previous;
      }

      return {
        ...previous,
        vitals: {
          ...previous.vitals,
          bmi,
        },
      };
    });
  }, [formData.vitals.height, formData.vitals.weight]);

  /* =======================================================
     APPOINTMENT DATA
  ======================================================= */

  const patient = appointment?.patient || {};
  const patientDetails = appointment?.patientDetails || {};

  const patientName = useMemo(() => {
    const bookingName = [patientDetails?.firstName, patientDetails?.lastName]
      .filter(Boolean)
      .join(" ");

    return bookingName || patient?.name || "Unknown Patient";
  }, [patient, patientDetails]);

  const initials = useMemo(() => {
    return patientName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }, [patientName]);

  const formattedDate = useMemo(() => {
    if (!appointment?.appointmentDate) {
      return "N/A";
    }

    return new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [appointment?.appointmentDate]);

  const appointmentTime = useMemo(() => {
    const startTime = appointment?.timeSlot?.startTime;
    const endTime = appointment?.timeSlot?.endTime;

    if (!startTime && !endTime) {
      return "N/A";
    }

    return `${startTime || ""}${endTime ? ` - ${endTime}` : ""}`;
  }, [appointment]);

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const handleVitalChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,

      vitals: {
        ...previous.vitals,
        [name]: value,
      },
    }));
  };

  const handleDiagnosisChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,

      diagnosis: {
        ...previous.diagnosis,
        [name]: value,
      },
    }));

    if (name === "primary") {
      setValidationErrors((previous) => ({
        ...previous,
        primary: "",
      }));
    }
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "clinicalNotes") {
      setValidationErrors((previous) => ({
        ...previous,
        clinicalNotes: "",
      }));
    }
  };

  /* =======================================================
     ARRAY HELPERS
  ======================================================= */

  const addArrayItem = (field, value, setInput) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    setFormData((previous) => {
      const exists = previous[field].some(
        (item) => item.toLowerCase() === cleanValue.toLowerCase(),
      );

      if (exists) {
        return previous;
      }

      return {
        ...previous,
        [field]: [...previous[field], cleanValue],
      };
    });

    setInput("");
  };

  const removeArrayItem = (field, index) => {
    setFormData((previous) => ({
      ...previous,

      [field]: previous[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  /* =======================================================
     MEDICATIONS
  ======================================================= */

  const addMedication = () => {
    setFormData((previous) => ({
      ...previous,

      medications: [...previous.medications, { ...emptyMedication }],
    }));
  };

  const updateMedication = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,

      medications: previous.medications.map((medication, medicationIndex) =>
        medicationIndex === index
          ? {
              ...medication,
              [field]: value,
            }
          : medication,
      ),
    }));
  };

  const removeMedication = (index) => {
    setFormData((previous) => {
      if (previous.medications.length === 1) {
        return previous;
      }

      return {
        ...previous,

        medications: previous.medications.filter(
          (_, medicationIndex) => medicationIndex !== index,
        ),
      };
    });
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    const errors = {};

    if (!formData.diagnosis.primary.trim()) {
      errors.primary = "Primary diagnosis is required.";
    }

    if (!formData.clinicalNotes.trim()) {
      errors.clinicalNotes = "Clinical notes are required.";
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  /* =======================================================
     COMPLETE CONSULTATION
  ======================================================= */

  const handleCompleteConsultation = async () => {
    if (!appointmentId || completing) return;

    const valid = validateForm();

    if (!valid) {
      window.scrollTo({
        top: 500,
        behavior: "smooth",
      });

      return;
    }

    const medications = formData.medications.filter(
      (medication) =>
        medication.name.trim() ||
        medication.dosage.trim() ||
        medication.duration.trim() ||
        medication.instruction.trim(),
    );

    const numberOrNull = (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      const number = Number(value);

      return Number.isNaN(number) ? null : number;
    };

    const consultationData = {
      vitals: {
        temperature: numberOrNull(formData.vitals.temperature),

        pulse: numberOrNull(formData.vitals.pulse),

        respiratoryRate: numberOrNull(formData.vitals.respiratoryRate),

        spo2: numberOrNull(formData.vitals.spo2),

        height: numberOrNull(formData.vitals.height),

        weight: numberOrNull(formData.vitals.weight),

        bmi: numberOrNull(formData.vitals.bmi),
      },

      diagnosis: {
        primary: formData.diagnosis.primary.trim(),

        secondary: formData.diagnosis.secondary.trim(),

        final: formData.diagnosis.final.trim(),
      },

      previousMedicalHistory: formData.previousMedicalHistory.trim(),

      clinicalNotes: formData.clinicalNotes.trim(),

      complaints: formData.complaints,

      clinicalTags: formData.clinicalTags,

      laboratoryTests: formData.laboratoryTests,

      medications: medications.map((medication) => ({
        name: medication.name.trim(),

        type: medication.type.trim() || "tablet",

        dosage: medication.dosage.trim(),

        duration: medication.duration.trim(),

        instruction: medication.instruction.trim(),
      })),

      advice: formData.advice.trim(),

      followUp: formData.followUp.trim(),
    };

    try {
      await dispatch(
        completeConsultation({
          appointmentId,
          consultationData,
        }),
      ).unwrap();

      await dispatch(fetchAppointmentById(appointmentId)).unwrap();

      setTimeout(() => {
        navigate("/doctor/appointments");
      }, 1200);
    } catch (error) {
      console.error("Complete Consultation Failed:", error);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <FiRefreshCw className="animate-spin text-2xl text-blue-600" />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            Loading consultation
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Retrieving appointment information...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     LOAD ERROR
  ======================================================= */

  if (appointmentError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <FiAlertCircle className="text-xl text-red-600" />
          </div>

          <div>
            <h3 className="font-bold text-red-800">
              Unable to load appointment
            </h3>

            <p className="mt-1 text-sm text-red-600">{appointmentError}</p>

            <button
              type="button"
              onClick={() => dispatch(fetchAppointmentById(appointmentId))}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <FiRefreshCw />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-5 pb-8">
      {/* =================================================
          PATIENT SUMMARY
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* PATIENT */}

            <div className="flex min-w-0 items-center gap-4">
              {patient?.image ? (
                <img
                  src={patient.image}
                  alt={patientName}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-600">
                  {initials || "PT"}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    #{appointmentId?.slice(-8).toUpperCase()}
                  </p>

                  <StatusBadge status={appointment.status} />
                </div>

                <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                  {patientName}
                </h2>

                <div className="mt-2 flex flex-wrap gap-2">
                  {patientDetails?.symptoms && (
                    <SmallBadge>{patientDetails.symptoms}</SmallBadge>
                  )}

                  <SmallBadge>
                    {appointment.appointmentType || "Appointment"}
                  </SmallBadge>
                </div>
              </div>
            </div>

            {/* APPOINTMENT META */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryMeta
                icon={<FiCalendar />}
                label="Appointment Date"
                value={formattedDate}
              />

              <SummaryMeta
                icon={<FiClock />}
                label="Appointment Time"
                value={appointmentTime}
              />

              <SummaryMeta
                icon={<FiActivity />}
                label="Consultation"
                value={appointment.appointmentType || "N/A"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTACT INFORMATION
      ================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ContactInfo icon={<FiUser />} label="Patient" value={patientName} />

          <ContactInfo
            icon={<FiPhone />}
            label="Phone"
            value={patientDetails?.phone || patient?.phone || "N/A"}
          />

          <ContactInfo
            icon={<FiMail />}
            label="Email"
            value={patientDetails?.email || patient?.email || "N/A"}
          />

          <ContactInfo
            icon={<FiMapPin />}
            label="Symptoms"
            value={patientDetails?.symptoms || "Not provided"}
          />
        </div>
      </section>

      {/* =================================================
          VITALS
      ================================================= */}

      <Section
        icon={<FiActivity />}
        title="Patient Vitals"
        description="Record the patient's current vital signs"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Temperature"
            name="temperature"
            type="number"
            step="0.1"
            value={formData.vitals.temperature}
            onChange={handleVitalChange}
            placeholder="37.5"
            suffix="°C"
          />

          <Input
            label="Pulse"
            name="pulse"
            type="number"
            value={formData.vitals.pulse}
            onChange={handleVitalChange}
            placeholder="78"
            suffix="bpm"
          />

          <Input
            label="Respiratory Rate"
            name="respiratoryRate"
            type="number"
            value={formData.vitals.respiratoryRate}
            onChange={handleVitalChange}
            placeholder="18"
            suffix="/min"
          />

          <Input
            label="SpO₂"
            name="spo2"
            type="number"
            value={formData.vitals.spo2}
            onChange={handleVitalChange}
            placeholder="98"
            suffix="%"
          />

          <Input
            label="Height"
            name="height"
            type="number"
            value={formData.vitals.height}
            onChange={handleVitalChange}
            placeholder="170"
            suffix="cm"
          />

          <Input
            label="Weight"
            name="weight"
            type="number"
            step="0.1"
            value={formData.vitals.weight}
            onChange={handleVitalChange}
            placeholder="70"
            suffix="kg"
          />

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              BMI
            </label>

            <div className="relative">
              <input
                value={formData.vitals.bmi}
                readOnly
                placeholder="Auto calculated"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none"
              />

              {formData.vitals.bmi && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                  AUTO
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* =================================================
          CLINICAL + DIAGNOSIS
      ================================================= */}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {/* CLINICAL */}

        <Section
          icon={<FiHeart />}
          title="Clinical Information"
          description="Complaints and medical history"
        >
          <Textarea
            label="Previous Medical History"
            name="previousMedicalHistory"
            value={formData.previousMedicalHistory}
            onChange={handleTextChange}
            placeholder="Previous diseases, surgeries, allergies, long-term medication..."
          />

          <div className="mt-5">
            <TagInput
              label="Patient Complaints"
              value={complaintInput}
              setValue={setComplaintInput}
              items={formData.complaints}
              onAdd={() =>
                addArrayItem("complaints", complaintInput, setComplaintInput)
              }
              onRemove={(index) => removeArrayItem("complaints", index)}
              placeholder="e.g. Fever"
            />
          </div>
        </Section>

        {/* DIAGNOSIS */}

        <Section
          icon={<FiFileText />}
          title="Diagnosis"
          description="Diagnosis and clinical assessment"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Primary Diagnosis"
              required
              name="primary"
              value={formData.diagnosis.primary}
              onChange={handleDiagnosisChange}
              placeholder="e.g. Viral fever"
              error={validationErrors.primary}
            />

            <Input
              label="Secondary Diagnosis"
              name="secondary"
              value={formData.diagnosis.secondary}
              onChange={handleDiagnosisChange}
              placeholder="Optional"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Final Diagnosis"
              name="final"
              value={formData.diagnosis.final}
              onChange={handleDiagnosisChange}
              placeholder="e.g. Acute viral infection"
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Clinical Notes"
              required
              name="clinicalNotes"
              value={formData.clinicalNotes}
              onChange={handleTextChange}
              placeholder="Examination findings, observations and clinical notes..."
              error={validationErrors.clinicalNotes}
            />
          </div>

          <div className="mt-4">
            <TagInput
              label="Clinical Tags"
              value={tagInput}
              setValue={setTagInput}
              items={formData.clinicalTags}
              onAdd={() => addArrayItem("clinicalTags", tagInput, setTagInput)}
              onRemove={(index) => removeArrayItem("clinicalTags", index)}
              placeholder="e.g. Headache"
            />
          </div>
        </Section>
      </div>

      {/* =================================================
          LABORATORY
      ================================================= */}

      <Section
        icon={<FiActivity />}
        title="Laboratory Tests"
        description="Tests recommended for this patient"
      >
        <TagInput
          label="Recommended Tests"
          value={labInput}
          setValue={setLabInput}
          items={formData.laboratoryTests}
          onAdd={() => addArrayItem("laboratoryTests", labInput, setLabInput)}
          onRemove={(index) => removeArrayItem("laboratoryTests", index)}
          placeholder="e.g. Full Blood Count"
        />
      </Section>

      {/* =================================================
          PRESCRIPTION
      ================================================= */}

      <Section
        icon={<FiFileText />}
        title="Prescription"
        description="Add medicines prescribed during this consultation"
      >
        <div className="space-y-4">
          {formData.medications.map((medication, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60"
            >
              {/* MEDICINE HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Medicine {index + 1}
                    </h4>

                    {medication.name && (
                      <p className="text-xs text-slate-400">
                        {medication.name}
                      </p>
                    )}
                  </div>
                </div>

                {formData.medications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                    title="Remove medication"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              {/* MEDICINE BODY */}

              <div className="p-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="Medicine"
                    value={medication.name}
                    onChange={(event) =>
                      updateMedication(index, "name", event.target.value)
                    }
                    placeholder="Paracetamol"
                  />

                  <Select
                    label="Type"
                    value={medication.type}
                    onChange={(event) =>
                      updateMedication(index, "type", event.target.value)
                    }
                  >
                    <option value="tablet">Tablet</option>

                    <option value="capsule">Capsule</option>

                    <option value="syrup">Syrup</option>

                    <option value="injection">Injection</option>

                    <option value="cream">Cream</option>

                    <option value="drops">Drops</option>

                    <option value="other">Other</option>
                  </Select>

                  <Input
                    label="Dosage"
                    value={medication.dosage}
                    onChange={(event) =>
                      updateMedication(index, "dosage", event.target.value)
                    }
                    placeholder="500mg"
                  />

                  <Input
                    label="Duration"
                    value={medication.duration}
                    onChange={(event) =>
                      updateMedication(index, "duration", event.target.value)
                    }
                    placeholder="3 days"
                  />
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Instructions"
                    value={medication.instruction}
                    onChange={(event) =>
                      updateMedication(index, "instruction", event.target.value)
                    }
                    rows={2}
                    placeholder="Take one tablet after meals, three times daily..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMedication}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <FiPlus />
          Add Medication
        </button>
      </Section>

      {/* =================================================
          ADVICE
      ================================================= */}

      <Section
        icon={<FiCheckCircle />}
        title="Advice & Follow-up"
        description="Final instructions and follow-up plan"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Textarea
            label="Patient Advice"
            name="advice"
            value={formData.advice}
            onChange={handleTextChange}
            placeholder="Drink plenty of water and take adequate rest..."
          />

          <Textarea
            label="Follow-up"
            name="followUp"
            value={formData.followUp}
            onChange={handleTextChange}
            placeholder="Return after 3 days if symptoms continue..."
          />
        </div>
      </Section>

      {/* =================================================
          VALIDATION SUMMARY
      ================================================= */}

      {Object.keys(validationErrors).length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg text-amber-600" />

          <div>
            <p className="text-sm font-bold text-amber-800">
              Please complete the required fields
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Primary diagnosis and clinical notes are required before
              completing the consultation.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          API ERROR
      ================================================= */}

      {completeError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg text-red-600" />

          <div>
            <p className="text-sm font-bold text-red-800">
              Consultation could not be completed
            </p>

            <p className="mt-1 text-xs text-red-600">{completeError}</p>
          </div>
        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {completeSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <FiCheck className="text-emerald-600" />
          </div>

          <div>
            <p className="text-sm font-bold text-emerald-800">
              Consultation completed successfully
            </p>

            <p className="text-xs text-emerald-600">
              Returning to appointments...
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          STICKY ACTION
      ================================================= */}

      <div className="sticky bottom-3 z-30">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_35px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:flex">
                <FiSave />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Complete Consultation
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  This will mark the appointment as completed.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={completing || appointment?.status === "completed"}
              onClick={handleCompleteConsultation}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {completing ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Completing...
                </>
              ) : appointment?.status === "completed" ? (
                <>
                  <FiCheckCircle />
                  Consultation Completed
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Complete Consultation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({ title, description, icon, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base text-blue-600">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/* =========================================================
   SUMMARY META
========================================================= */

function SummaryMeta({ icon, label, value }) {
  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   CONTACT INFO
========================================================= */

function ContactInfo({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase() || "";

  const styles = {
    completed: "bg-emerald-50 text-emerald-700",

    confirmed: "bg-blue-50 text-blue-700",

    upcoming: "bg-blue-50 text-blue-700",

    pending: "bg-amber-50 text-amber-700",

    cancelled: "bg-red-50 text-red-700",

    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
        styles[normalizedStatus] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

/* =========================================================
   SMALL BADGE
========================================================= */

function SmallBadge({ children }) {
  return (
    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  suffix,
  required = false,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="min-w-0">
      {label && (
        <label className="mb-2 block text-xs font-semibold text-slate-600">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...props}
          className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          } ${suffix ? "pr-14" : ""} ${className}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-semibold text-slate-600">
          {label}
        </label>
      )}

      <select
        {...props}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function Textarea({
  label,
  required = false,
  error,
  className = "",
  rows = 4,
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-semibold text-slate-600">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        {...props}
        rows={rows}
        className={`w-full resize-none rounded-xl border bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        } ${className}`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

/* =========================================================
   TAG INPUT
========================================================= */

function TagInput({
  label,
  value,
  setValue,
  items = [],
  onAdd,
  onRemove,
  placeholder,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      onAdd();
    }
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FiPlus />
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
            >
              {item}

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-blue-400 transition hover:bg-red-100 hover:text-red-500"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
