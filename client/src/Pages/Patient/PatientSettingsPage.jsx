import PatientSettings from "@/components/Paitent/Profile/PatientSettings";
import PatientSidebar from "@/components/Paitent/Sidebar/Sidebar";
import React from "react";

export default function PatientSettingsPage() {
  return (
    <div className="container mt-25 mx-auto min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <PatientSidebar />

        {/* Settings Content */}
        <main className="min-w-0 flex-1">
          <PatientSettings />
        </main>
      </div>
    </div>
  );
}
