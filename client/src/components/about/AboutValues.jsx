import React from "react";
import {
  FaHeartPulse,
  FaShieldHeart,
  FaLightbulb,
  FaPeopleGroup,
} from "react-icons/fa6";

const values = [
  {
    icon: FaHeartPulse,
    title: "Compassion",
    description: "We put patient wellbeing at the heart of care.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FaShieldHeart,
    title: "Integrity",
    description: "We value honesty, trust and responsible care.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: FaLightbulb,
    title: "Innovation",
    description: "We use technology to improve healthcare access.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: FaPeopleGroup,
    title: "Accessibility",
    description: "We aim to make healthcare easier to access.",
    color: "bg-violet-50 text-violet-600",
  },
];

export default function AboutValues() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            Our Values
          </span>

          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 md:text-4xl">
            Driven by a{" "}
            <span className="text-blue-600">Strong Set of Values</span>
          </h2>

          <p className="mt-4 text-slate-500">
            The principles guiding our healthcare platform.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${color}`}
              >
                <Icon />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
