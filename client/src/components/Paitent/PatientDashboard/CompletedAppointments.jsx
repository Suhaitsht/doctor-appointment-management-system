import React from "react";

import { FaCircleCheck } from "react-icons/fa6";

import { Card } from "@/components/ui/card";

export default function CompletedAppointments({ value = 234 }) {
  return (
    <Card className="border-slate-200 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl text-green-600">
          <FaCircleCheck />
        </div>

        <div>
          <p className="text-sm text-slate-500">Completed Appointments</p>

          <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
        </div>
      </div>
    </Card>
  );
}
