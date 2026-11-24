import PatientAppointments from "@/components/Paitent/Appointment/PatientAppointments";
import PatientSidebar from "@/components/Paitent/Sidebar/Sidebar";
import React from "react";

export default function PatientAppointmentsPage() {
  return (
    <div className="container mx-auto mt-25 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* Existing Sidebar */}
        <PatientSidebar />

        {/* Appointment Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            <PatientAppointments />
          </div>
        </main>
      </div>
    </div>
  );
}
