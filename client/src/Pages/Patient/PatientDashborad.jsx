import React from "react";

import PatientDashboardContent from "@/components/Paitent/PatientDashboard/PatientDashboardContent";
import PatientSidebar from "@/components/Paitent/Sidebar/Sidebar";

export default function PatientDashboard() {
  return (
    <div className="container mx-auto mt-25 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* Patient Sidebar */}
        <PatientSidebar />

        {/* Dashboard Main Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px]">
            <PatientDashboardContent />
          </div>
        </main>
      </div>
    </div>
  );
}
