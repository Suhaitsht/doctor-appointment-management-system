import React from "react";
import { useNavigate } from "react-router-dom";

import {
  FaCalendarDays,
  FaCheck,
  FaEnvelope,
  FaEye,
  FaPhone,
  FaPlay,
  FaUser,
  FaVideo,
  FaXmark,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DoctorAppointmentCard({
  appointment,
  onStatusChange,
  onViewMedicalRecord,
}) {
  const navigate = useNavigate();

  // ======================================================
  // START APPOINTMENT
  // ======================================================

  const startAppointment = () => {
    if (!appointment?._id) {
      console.error("Appointment MongoDB _id missing.");
      return;
    }

    console.log("Starting appointment:", appointment._id);

    navigate(`/doctor/appointments/${appointment._id}/start`);
  };

  // ======================================================
  // VIEW CONSULTATION RECORD
  // ======================================================

  const handleViewMedicalRecord = () => {
    console.log("====================================");
    console.log("🔥 EYE CLICKED");
    console.log("Appointment:", appointment);
    console.log("MongoDB Appointment ID:", appointment?._id);
    console.log("onViewMedicalRecord:", onViewMedicalRecord);
    console.log("====================================");

    if (!appointment) {
      console.error("Appointment not found.");
      return;
    }

    if (!appointment?._id) {
      console.error("MongoDB appointment _id missing.");

      return;
    }

    if (typeof onViewMedicalRecord !== "function") {
      console.error("❌ onViewMedicalRecord callback is not connected.");

      return;
    }

    onViewMedicalRecord(appointment);
  };

  // ======================================================
  // STATUS CHANGE
  // ======================================================

  const handleStatusChange = (status) => {
    if (typeof onStatusChange !== "function") {
      console.warn("onStatusChange callback is not connected.");

      return;
    }

    /*
     * Keep your current display ID behaviour.
     * If backend status API requires MongoDB ID,
     * change appointment.id -> appointment._id.
     */

    onStatusChange(appointment?.id, status);
  };

  // ======================================================
  // SAFE VALUES
  // ======================================================

  const patientName = appointment?.patientName || "Patient";

  const patientImage = appointment?.patientImage || "";

  const isUpcoming = appointment?.status === "upcoming";

  const isCompleted = appointment?.status === "completed";

  return (
    <Card className="border-slate-200 p-4 shadow-none transition hover:shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_240px_auto] lg:items-center">
        {/* =================================================
            PATIENT
        ================================================= */}

        <div className="flex min-w-0 items-center gap-3">
          {patientImage ? (
            <img
              src={patientImage}
              alt={patientName}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
              {getInitials(patientName)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-blue-500">
              #{appointment?.id || "N/A"}
            </p>

            <h3 className="truncate text-sm font-semibold text-slate-900">
              {patientName}
            </h3>
          </div>
        </div>

        {/* =================================================
            APPOINTMENT INFO
        ================================================= */}

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <FaCalendarDays className="shrink-0 text-slate-500" />

            <span>
              {appointment?.date || "N/A"} {appointment?.time || ""}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {appointment?.visitType && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 hover:bg-blue-50"
              >
                {appointment.visitType}
              </Badge>
            )}

            {appointment?.consultationType && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 hover:bg-slate-100"
              >
                {appointment.consultationType}
              </Badge>
            )}
          </div>
        </div>

        {/* =================================================
            CONTACT
        ================================================= */}

        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FaEnvelope className="shrink-0" />

            <span className="truncate">{appointment?.email || "No email"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FaPhone className="shrink-0" />

            <span>{appointment?.phone || "No phone"}</span>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {/* ===============================================
              EYE BUTTON
              
              Completed:
              Open ConsultationRecordModal
          =============================================== */}

          <Button
            type="button"
            variant="outline"
            size="icon"
            title={
              isCompleted ? "View consultation record" : "View appointment"
            }
            onClick={handleViewMedicalRecord}
            className={`
              h-8
              w-8
              rounded-full
              transition

              ${
                isCompleted
                  ? `
                    border-emerald-200
                    bg-emerald-50
                    text-emerald-600
                    hover:bg-emerald-100
                    hover:text-emerald-700
                  `
                  : `
                    border-slate-200
                    text-slate-600
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-600
                  `
              }
            `}
          >
            <FaEye className="text-xs" />
          </Button>

          {/* ===============================================
              PATIENT PROFILE
          =============================================== */}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Patient Profile"
          >
            <FaUser className="text-xs" />
          </Button>

          {/* ===============================================
              VIDEO
          =============================================== */}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Video"
          >
            <FaVideo className="text-xs" />
          </Button>

          {/* ===============================================
              UPCOMING STATUS ACTIONS
          =============================================== */}

          {isUpcoming && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Mark as completed"
                onClick={() => handleStatusChange("completed")}
                className="
                  h-8
                  w-8
                  rounded-full
                  border-green-200
                  text-green-500
                  hover:bg-green-50
                  hover:text-green-600
                "
              >
                <FaCheck className="text-xs" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Cancel appointment"
                onClick={() => handleStatusChange("cancelled")}
                className="
                  h-8
                  w-8
                  rounded-full
                  border-red-200
                  text-red-500
                  hover:bg-red-50
                  hover:text-red-600
                "
              >
                <FaXmark className="text-xs" />
              </Button>
            </>
          )}

          {/* ===============================================
              START NOW
          =============================================== */}

          {isUpcoming && (
            <Button
              type="button"
              variant="link"
              onClick={startAppointment}
              className="
                gap-2
                px-2
                text-xs
                font-semibold
                text-slate-900
                underline
              "
            >
              <FaPlay className="text-[10px]" />
              Start Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ======================================================
// INITIALS
// ======================================================

function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "P";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
