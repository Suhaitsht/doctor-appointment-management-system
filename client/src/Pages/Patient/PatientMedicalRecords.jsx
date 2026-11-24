import React from "react";
import PatientSidebar from "@/components/Paitent/Sidebar/Sidebar";
import PatientMedicalRecords from "@/components/Paitent/PatientMedicalRecords/PatientMedicalRecords";

export default function PatientMedicalRecordsPage() {
  return (
    <div className="container mx-auto mt-25 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col lg:flex-row">
        {/* Existing Patient Sidebar */}
        <PatientSidebar />

        {/* Medical Records Content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            <PatientMedicalRecords />
          </div>
        </main>
      </div>
    </div>
  );
}
