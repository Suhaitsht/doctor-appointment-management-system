import { FaCalendarDays, FaLocationDot, FaClock } from "react-icons/fa6";

import { Card } from "@/components/ui/card";

export default function PatientCard({ patient }) {
  return (
    <Card className="border-slate-200 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Patient Details */}
      <div className="flex items-start gap-3">
        <img
          src={patient.image}
          alt={patient.name}
          className="h-12 w-12 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          {/* Appointment ID */}
          <p className="text-[10px] font-medium text-blue-600">{patient.id}</p>

          {/* Patient Name */}
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {patient.name}
          </h3>

          {/* Patient Information */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span>Age : {patient.age}</span>

            <span className="text-slate-300">|</span>

            <span>{patient.gender}</span>

            <span className="text-slate-300">|</span>

            <span>{patient.blood}</span>
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <FaClock className="shrink-0 text-slate-900" />

          <span>{patient.appointment}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          <FaLocationDot className="shrink-0 text-slate-900" />

          <span>{patient.location}</span>
        </div>
      </div>

      {/* Last Booking */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <FaCalendarDays />

          <span>
            Last Booking{" "}
            <span className="font-medium text-slate-800">
              {patient.lastBooking}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}
