import React from "react";
import doctorImg from "../../assets/about-01.webp";
import workImg from "../../assets/work-bg-01.png";

const steps = [
  {
    title: "Search Doctor",
    desc: "Search for a doctor based on specialization, location, or availability.",
    icon: "https://doccure.dreamstechnologies.com/html/template/assets/img/icons/search.svg",
  },
  {
    title: "Check Profile",
    desc: "Explore detailed doctor profiles on our platform to make informed healthcare.",
    icon: "https://doccure.dreamstechnologies.com/html/template/assets/img/icons/profile.svg",
  },
  {
    title: "Schedule Booking",
    desc: "After choose your preferred doctor, select a convenient time slot, & confirm.",
    icon: "https://doccure.dreamstechnologies.com/html/template/assets/img/icons/schedule.svg",
  },
  {
    title: "Get Your Solution",
    desc: "Search for a doctor based on specialization, location, or availability.",
    icon: "https://doccure.dreamstechnologies.com/html/template/assets/img/icons/solution.svg",
  },
];

export default function WorkSection() {
  return (
    <>
      <section
        className="relative mt-12 overflow-hidden py-16 lg:py-14"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(49, 109, 255, 0.1) 0%, rgba(31, 178, 87, 0.1) 100%)",
        }}
      >
        <div className="container-custom grid  gap-10 lg:grid-cols-2">
          {/* Left image area */}
          <div className=" hidden relative lg:flex min-h-130 items-end justify-center">
            <img
              src={workImg}
              alt="background shape"
              className="absolute left-10 top-1/2 z-0 max-w-[90%] -translate-y-1/2 opacity-90"
            />

            <img
              src={doctorImg}
              alt="doctor"
              className="relative z-10 h-120 w-auto object-contain lg:h-140"
            />

            <div className="absolute left-4 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full text-blue-500 lg:flex">
              <div className="h-16 w-16 rounded-full border border-blue-200" />
            </div>
          </div>

          {/* Right content area */}
          <div className="">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              ✦ How it Works
            </span>

            <h2 className="mt-5 max-w-[700px] text-3xl font-bold leading-tight text-slate-900 md:text-4xl xl:text-5xl">
              4 Easy Steps to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
                Get Your Solution
              </span>
            </h2>

            <div className="md:w-[45rem] mt-10 grid  gap-8 md:grid-cols-2">
              {steps.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className=" rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-gradient-to-r from-blue-600 to-green-500 ">
                        <img src={Icon} alt={item.title} className="w-7 h-7" />
                      </div>

                      <div>
                        <h3 className=" text-lg md:text-2xl font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-base leading-8 text-slate-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Decorative top-right circles */}
        <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-full border border-blue-100 lg:block" />
        <div className="absolute right-10 top-10 hidden h-28 w-28 rounded-full border border-blue-100 lg:block" />
        <div className="absolute right-14 top-14 hidden h-20 w-20 rounded-full border border-blue-100 lg:block" />
      </section>
    </>
  );
}
