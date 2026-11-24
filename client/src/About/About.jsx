import React from "react";
import AboutPng from "../assets/about.png";
import SectionSpin from "../assets/section-icon.svg";
import missonIcon from "../assets/mission.svg";
import visonIcon from "../assets/vision.svg";

const style = {
  background:
    "radial-gradient(84.63% 354.2% at 71.21% 68.89%, #4EDEC1 0%, #316DFF 41.35%, #316DFF 80.92%, #31436D 99.99%, #FFFFFF 100%)",
};

const linerback = {
  background: "linear-gradient(90deg, #316DFF 0%, #1FB257 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export default function About() {
  return (
    <>
      <div className="bg-slate-100 py-16 lg:mt-14 mt-10">
        <div className=" container-custom grid grid-cols-1 lg:grid-cols-2 space-x-9">
          <div>
            <img src={AboutPng} alt="img" className="block" />
          </div>
          <div className="mt-5 lg:mt-0">
            <div
              className=" rounded-full h-7 w-32  flex items-center justify-center gap-2 "
              style={style}
            >
              <img
                src={SectionSpin}
                alt="img"
                className="block  animate-[spin_2s_linear_infinite] "
              />
              <h4 className="text-center text-white font-bold">About Us</h4>
            </div>
            <h3 className="py-3 font-bold text-2xl  lg:text-3xl">
              We Understand That Each One Is Unique & Their{" "}
              <span className=" " style={linerback}>
                Health Journey.
              </span>
            </h3>
            <p className="text-slate-400 font-md">
              We aim to provide faster diagnosis, clearer insights, and more
              accurate treatment decisions ensuring every patient receives safe,
              precise, and personalized care.
            </p>

            <div className="grid  grid-cols-1 md:grid-cols-2 gap-5 py-5 lg:py-10 ">
              <div className="bg-slate-100 flex flex-col   shadow-lg rounded-md p-3 group relative ">
                <div className="flex items-center space-x-2 p-4">
                  <img src={missonIcon} alt="" className=" bg-primary p-2 " />
                  <h3 className="font-semibold text-lg">Our Mission</h3>
                </div>
                <p className="pl-3 text-md ">
                  To deliver compassionate, patient-first healthcare by
                  combining expert clinical judgment with technology.
                </p>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-right scale-x-0 bg-blue-500 transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100"></span>
              </div>
              <div className="bg-slate-100 flex flex-col   shadow-lg rounded-md p-3  group relative">
                <div className="flex items-center space-x-2 p-4">
                  <img src={visonIcon} alt="" className=" bg-green-600 p-2 " />
                  <h3 className="font-semibold text-lg">Our Mission</h3>
                </div>
                <p className="pl-3 text-md ">
                  Empower doctors to detect conditions earlier, improve
                  outcomes, and redefine the future of modern healthcare.
                </p>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-right scale-x-0 bg-blue-500 transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
