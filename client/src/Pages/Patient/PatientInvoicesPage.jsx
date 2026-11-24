import React from "react";

import PatientSidebar from "@/components/Paitent/Sidebar/Sidebar";
import PatientInvoices from "@/components/Paitent/invoices/PatientInvoices";

export default function PatientInvoicesPage() {
  return (
    <div className="container mx-auto mt-25 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex flex-col lg:flex-row">
        <PatientSidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 md:px-8">
            <PatientInvoices />
          </div>
        </main>
      </div>
    </div>
  );
}
