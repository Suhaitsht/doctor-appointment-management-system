import React from "react";
import {
  FaUserDoctor,
  FaShieldHeart,
  FaClock,
  FaHeadset,
} from "react-icons/fa6";

const benefits = [
  {
    icon: FaUserDoctor,
    title: "Qualified Doctors",
    description: "Explore doctors across different medical specialties.",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    icon: FaShieldHeart,
    title: "Secure Experience",
    description: "A platform designed with patient account security in mind.",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
  },
  {
    icon: FaClock,
    title: "Convenient Booking",
    description: "Choose an appointment time that works for your schedule.",
    bg: "bg-violet-50",
    color: "text-violet-600",
  },
  {
    icon: FaHeadset,
    title: "Booking Assistance",
    description: "Find guidance for navigating the appointment process.",
    bg: "bg-orange-50",
    color: "text-orange-600",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-gradient-to-b from-sky-50/70 to-white py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600">
            Why Choose Us
          </span>

          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 md:text-4xl">
            Exceptional Care for a{" "}
            <span className="text-blue-600">Healthier You</span>
          </h2>

          <p className="mt-4 text-slate-500">
            Combining medical expertise with technology to simplify your
            healthcare experience.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`group rounded-3xl border border-white p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${item.bg}`}
              >
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ${item.color}`}
                >
                  <Icon />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
