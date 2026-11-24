import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaHeartPulse } from "react-icons/fa6";

export default function AboutCTA() {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/20" />
          <div className="absolute right-24 top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative grid min-h-[320px] items-center lg:grid-cols-2">
            <div className="z-10 p-8 text-white sm:p-12 lg:p-14">
              <span className="inline-flex rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold">
                Your Healthcare Journey
              </span>

              <h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">
                Be on Your Way to Feeling Better
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-blue-50">
                Find a suitable doctor, explore appointment availability and
                take the next step toward better healthcare.
              </p>

              <Link
                to="/doctors"
                className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
              >
                Book an Appointment
                <FaArrowRight />
              </Link>
            </div>

            <div className="relative hidden h-full min-h-[320px] items-end justify-center lg:flex">
              <div className="absolute bottom-0 h-72 w-72 rounded-full bg-white/10" />

              <img
                src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=700&auto=format&fit=crop"
                alt="Medical professional"
                className="relative h-[330px] w-[340px] rounded-t-[120px] object-cover object-top"
              />

              <div className="absolute right-8 top-12 flex items-center gap-2 rounded-xl bg-white p-3 shadow-lg">
                <FaHeartPulse className="text-2xl text-pink-500" />
                <span className="text-xs font-bold text-slate-800">
                  Your Health Matters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
