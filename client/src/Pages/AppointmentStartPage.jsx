import React from "react";
import { Link, useParams } from "react-router-dom";
import { FiHome, FiChevronRight, FiCalendar } from "react-icons/fi";

import AppointmentDetails from "@/components/Doctor/AppointmentDetails/AppointmentDetails";
import DoctorSidebar from "@/components/Doctor/DoctorSidebar/DoctorSidebar";

export default function AppointmentStartPage() {
  const { appointmentId } = useParams();

  console.log("URL appointmentId:", appointmentId);
  return (
    <div className="mt-20 min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-[260px]">
            <DoctorSidebar />
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1450px] py-5 sm:py-6 lg:px-4">
              {/* Breadcrumb */}
              <div className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <Link
                    to="/doctor"
                    className="flex items-center gap-1 transition hover:text-blue-600"
                  >
                    <FiHome />
                    Doctor
                  </Link>

                  <FiChevronRight />

                  <Link
                    to="/doctor/appointments"
                    className="transition hover:text-blue-600"
                  >
                    Appointments
                  </Link>

                  <FiChevronRight />

                  <span className="font-medium text-blue-600">
                    Consultation
                  </span>
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FiCalendar className="text-xl" />
                    </div>

                    <div>
                      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        Appointment Consultation
                      </h1>

                      <p className="mt-1 text-sm text-slate-500">
                        Review patient information and complete the
                        consultation.
                      </p>
                    </div>
                  </div>

                  {appointmentId && (
                    <div className="w-fit rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Appointment ID
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-blue-600">
                        #{appointmentId.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation */}
              <AppointmentDetails appointmentId={appointmentId} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
