import React from "react";

import { FaCalendarCheck } from "react-icons/fa6";

import { Card } from "@/components/ui/card";

export default function TotalAppointments({ value = 248 }) {
  return (
    <Card className="border-slate-200 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          <FaCalendarCheck />
        </div>

        <div>
          <p className="text-sm text-slate-500">Total Appointments</p>

          <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
        </div>
      </div>
    </Card>
  );
}
