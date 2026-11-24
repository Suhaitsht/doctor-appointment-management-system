import React from "react";
import {
  FaUserDoctor,
  FaCalendarCheck,
  FaShieldHeart,
  FaHeartPulse,
} from "react-icons/fa6";

const stats = [
  {
    title: "Expert Doctors",
    subtitle: "Professional medical care",
    icon: FaUserDoctor,
  },
  {
    title: "Easy Booking",
    subtitle: "Simple appointment process",
    icon: FaCalendarCheck,
  },
  {
    title: "Secure Platform",
    subtitle: "Privacy-focused services",
    icon: FaShieldHeart,
  },
  {
    title: "Patient First",
    subtitle: "Care at every step",
    icon: FaHeartPulse,
  },
];

export default function AboutStats() {
  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-5 lg:px-8">
      <div className="grid gap-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/40 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, subtitle, icon: Icon }) => (
          <div key={title} className="flex items-center gap-4 rounded-2xl p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon className="text-2xl" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
