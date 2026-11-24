import React, { useEffect, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { FaHeartbeat } from "react-icons/fa";

import {
  FaTemperatureHalf,
  FaDroplet,
  FaWeightScale,
  FaArrowRight,
} from "react-icons/fa6";

import { MdBloodtype } from "react-icons/md";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  fetchPatientConsultations,
  selectPatientConsultations,
  selectPatientConsultationsLoading,
  selectPatientConsultationsError,
} from "@/redux/slices/consultationSlice";

// ======================================================
// DATE FORMATTER
// ======================================================

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "N/A";
  }

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
// CHECK VALUE
// ======================================================

const hasValue = (value) => {
  return value !== null && value !== undefined && value !== "";
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function HealthRecords() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  // ====================================================
  // REDUX
  // ====================================================

  const consultations = useSelector(selectPatientConsultations);

  const loading = useSelector(selectPatientConsultationsLoading);

  const error = useSelector(selectPatientConsultationsError);

  // ====================================================
  // FETCH CONSULTATIONS
  // ====================================================

  useEffect(() => {
    /*
     * Medical Records page may already have fetched this
     * data, but Dashboard must also work when opened directly.
     */

    dispatch(fetchPatientConsultations());
  }, [dispatch]);

  // ====================================================
  // GET LATEST COMPLETED CONSULTATION
  // ====================================================

  const latestConsultation = useMemo(() => {
    if (!Array.isArray(consultations) || consultations.length === 0) {
      return null;
    }

    const completedConsultations = consultations.filter(
      (consultation) => consultation?.status === "completed",
    );

    if (completedConsultations.length === 0) {
      return null;
    }

    return [...completedConsultations].sort((a, b) => {
      const dateA = new Date(a?.completedAt || a?.createdAt || 0).getTime();

      const dateB = new Date(b?.completedAt || b?.createdAt || 0).getTime();

      return dateB - dateA;
    })[0];
  }, [consultations]);

  // ====================================================
  // VITALS
  // ====================================================

  const vitals = latestConsultation?.vitals || {};

  // ====================================================
  // VALUES
  // ====================================================

  const heartRate = hasValue(vitals?.pulse) ? `${vitals.pulse} Bpm` : "N/A";

  const temperature = hasValue(vitals?.temperature)
    ? `${vitals.temperature} °C`
    : "N/A";

  const spo2 = hasValue(vitals?.spo2) ? `${vitals.spo2}%` : "N/A";

  const bmi = hasValue(vitals?.bmi) ? `${vitals.bmi} kg/m²` : "N/A";

  /*
   * These fields are NOT currently available
   * in the Consultation vitals schema.
   *
   * Do not display fake medical data.
   */

  const glucose = hasValue(vitals?.glucoseLevel)
    ? `${vitals.glucoseLevel} mg/dl`
    : "N/A";

  const bloodPressure = hasValue(vitals?.bloodPressure)
    ? vitals.bloodPressure
    : "N/A";

  // ====================================================
  // LAST VISIT
  // ====================================================

  const lastVisit = formatDate(
    latestConsultation?.completedAt ||
      latestConsultation?.appointment?.appointmentDate ||
      latestConsultation?.createdAt,
  );

  // ====================================================
  // VIEW DETAILS
  // ====================================================

  const handleViewDetails = () => {
    navigate("/patient/medical-records");
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading && !latestConsultation) {
    return (
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Health Records
          </h2>
        </div>

        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading health records...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error && !latestConsultation) {
    return (
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Health Records
          </h2>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-700">
              Unable to load health records
            </p>

            <p className="mt-1 text-xs text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => dispatch(fetchPatientConsultations())}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Health Records</h2>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="grid gap-6 p-5 lg:grid-cols-[2fr_1fr]">
        {/* =================================================
            HEALTH METRICS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* HEART RATE */}

          <HealthItem
            icon={<FaHeartbeat />}
            title="Heart Rate"
            value={heartRate}
            iconColor="text-red-500"
          />

          {/* TEMPERATURE */}

          <HealthItem
            icon={<FaTemperatureHalf />}
            title="Body Temperature"
            value={temperature}
            iconColor="text-orange-500"
          />

          {/* GLUCOSE */}

          <HealthItem
            icon={<FaDroplet />}
            title="Glucose Level"
            value={glucose}
            iconColor="text-blue-500"
          />

          {/* SPO2 */}

          <HealthItem
            icon={<MdBloodtype />}
            title="SpO₂"
            value={spo2}
            iconColor="text-indigo-500"
          />

          {/* BLOOD PRESSURE */}

          <HealthItem
            icon={<FaHeartbeat />}
            title="Blood Pressure"
            value={bloodPressure}
            iconColor="text-pink-500"
          />

          {/* BMI */}

          <HealthItem
            icon={<FaWeightScale />}
            title="BMI"
            value={bmi}
            iconColor="text-violet-500"
          />
        </div>

        {/* =================================================
            OVERALL REPORT
        ================================================= */}

        <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h3 className="text-sm font-semibold text-slate-900">
            Overall Report
          </h3>

          <div className="mt-5 flex flex-col items-center">
            {/* LAST VISIT CIRCLE */}

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-green-500">
              <div className="px-2 text-center">
                <p className="text-[11px] text-slate-400">Last Visit</p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {lastVisit}
                </p>
              </div>
            </div>

            {/* STATUS */}

            {latestConsultation ? (
              <>
                <p className="mt-4 text-sm text-slate-500">
                  Latest consultation
                </p>

                <p className="font-semibold text-green-600">Completed</p>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-slate-500">Health record</p>

                <p className="font-semibold text-slate-400">
                  No data available
                </p>
              </>
            )}

            {/* VIEW DETAILS */}

            <Button
              type="button"
              onClick={handleViewDetails}
              className="mt-4 rounded-full bg-slate-900 px-6 hover:bg-slate-800"
            >
              View Details
              <FaArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-400">
          {latestConsultation
            ? `Report generated on last visit : ${lastVisit}`
            : "No completed consultation records available yet."}
        </p>
      </div>
    </Card>
  );
}

// ======================================================
// HEALTH ITEM
// ======================================================

function HealthItem({ icon, title, value, iconColor }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`text-lg ${iconColor}`}>{icon}</span>

        <p className="text-xs text-slate-500">{title}</p>
      </div>

      <p
        className={`mt-2 text-xl font-semibold ${
          value === "N/A" ? "text-slate-400" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
