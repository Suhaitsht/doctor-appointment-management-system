import {
  FaCalendarDays,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaVideo,
  FaLocationDot,
  FaEye,
} from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppointmentCard({ appointment, onView }) {
  if (!appointment) {
    return null;
  }
  return (
    <Card className="border-slate-200 p-4 shadow-none transition hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Doctor */}
        <div className="flex min-w-[190px] items-center gap-3">
          <img
            src={appointment.image}
            alt={appointment.doctor}
            className="h-12 w-12 rounded-lg object-cover"
          />

          <div>
            <p className="text-[10px] font-medium text-blue-600">
              {appointment.id}
            </p>

            <h3 className="text-sm font-semibold text-slate-900">
              {appointment.doctor}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {appointment.speciality}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="min-w-[160px]">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
            <FaClock className="text-slate-600" />
            {appointment.date}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {appointment.visitType}
            </span>

            {appointment.mode === "Video Call" ? (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <FaVideo />
                Video Call
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <FaLocationDot />
                Direct Visit
              </Badge>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="min-w-[190px] space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <FaEnvelope />
            <span>{appointment.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <FaPhone />
            <span>{appointment.phone}</span>
          </div>
        </div>

        {/* View Button */}
        <Button
          type="button"
          onClick={() => onView?.(appointment)}
          className="gap-2 rounded-full bg-blue-600 px-6 hover:bg-blue-700"
        >
          <FaEye />
          View
        </Button>
      </div>
    </Card>
  );
}
