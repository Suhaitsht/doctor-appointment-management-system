import AvailableTimings from "@/components/Doctor/AvailableTimes/AvailableTimes";
import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";
import React from "react";

export default function AvailableTiming() {
  return (
    <div className=" container mx-auto min-h-screen bg-[#f8fafc] text-slate-900 mt-20">
      <div className="flex flex-col lg:flex-row">
        <DoctorSidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            {/* Page Heading */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-400">
                {/* <MdDashboard /> */}
                <span>Doctor</span>
                <span>/</span>
                <span className="text-blue-600">Dashboard</span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            </div>

            {/* Main Dashboard Grid */}
            <div className="min-w-0 flex-1">
              <AvailableTimings />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
