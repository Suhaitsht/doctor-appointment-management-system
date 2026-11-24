import React from "react";
import {
  FaCircleCheck,
  FaHeartPulse,
  FaShieldHeart,
  FaLaptopMedical,
} from "react-icons/fa6";

const features = [
  {
    icon: FaCircleCheck,
    title: "Experienced Doctors",
    description: "Connect with qualified healthcare professionals.",
  },
  {
    icon: FaShieldHeart,
    title: "Patient-Centered Care",
    description: "Your comfort and healthcare needs come first.",
  },
  {
    icon: FaLaptopMedical,
    title: "Modern Technology",
    description:
      "Manage healthcare appointments through a convenient digital platform.",
  },
];

export default function AboutStory() {
  return (
    <section id="our-story" className="overflow-hidden py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&auto=format&fit=crop"
              alt="Doctor discussing healthcare"
              className="h-80 w-full rounded-3xl object-cover"
            />

            <div className="space-y-4 pt-12">
              <div className="flex h-36 flex-col items-center justify-center rounded-3xl bg-blue-50 p-5 text-center">
                <FaHeartPulse className="mb-3 text-4xl text-pink-500" />
                <p className="font-bold text-slate-900">Your Health</p>
                <p className="font-bold text-blue-600">Our Priority</p>
              </div>

              <img
                src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=700&auto=format&fit=crop"
                alt="Healthcare team"
                className="h-48 w-full rounded-3xl object-cover"
              />
            </div>
          </div>

          <div className="absolute -bottom-8 -left-8 -z-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
        </div>

        <div>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            Who We Are
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            Providing Comprehensive Healthcare For A{" "}
            <span className="text-blue-600">Better Tomorrow</span>
          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            We are dedicated to making medical care accessible and convenient.
            Our online appointment platform helps patients discover doctors,
            review availability and manage their bookings in one place.
          </p>

          <div className="mt-8 space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
                  <Icon className="text-lg" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
