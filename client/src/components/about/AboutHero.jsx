import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaHeartPulse, FaUserDoctor } from "react-icons/fa6";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-white via-blue-50/60 to-sky-100 pt-16 pb-20 md:pt-24">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-blue-600">About Us</span>
          </div>

          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
            About Doccure
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            We Are Always Here for
            <span className="text-blue-600"> Your Health</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
            At Doccure, we believe everyone deserves access to compassionate,
            convenient and reliable healthcare. Our platform helps patients
            connect with doctors and manage appointments easily.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#our-story"
              className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Our Story
              <FaArrowRight />
            </a>

            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-7 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Find a Doctor
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px]">
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-200 to-cyan-100 blur-2xl" />

          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-100 to-sky-200">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&auto=format&fit=crop"
              alt="Healthcare professional"
              className="h-[420px] w-full object-cover object-top sm:h-[500px]"
            />
          </div>

          <div className="absolute -left-3 top-16 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl sm:-left-8">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FaHeartPulse className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Quality Care</p>
              <p className="text-xs text-slate-500">Patient First</p>
            </div>
          </div>

          <div className="absolute -right-2 bottom-12 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl sm:-right-6">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <FaUserDoctor className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Expert Doctors</p>
              <p className="text-xs text-slate-500">Trusted Healthcare</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
