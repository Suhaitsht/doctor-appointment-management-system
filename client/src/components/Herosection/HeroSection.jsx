import React from "react";

import { Card, CardContent } from "../ui/card";

import { useNavigate } from "react-router-dom";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import bannerImg from "../../assets/banner-02.webp";
import bannerBack from "../../assets/banner-01.png";
import bannerSpin from "../../assets/banner-05.webp";
import bannerBac2 from "../../assets/banner-02.png";
import spin from "../../assets/download.svg";
import { MdLockOutline } from "react-icons/md";
import Slider from "../doctor category carousel/Slider";

const style = {
  backgroundImage:
    "radial-gradient(84.63% 354.2% at 71.21% 68.89%, #4edec1 0%, #316dff 41.35%, #316dff 80.92%, #31436d 99.99%, #fff 100%)",
};

const linerback = {
  background: "linear-gradient(90deg, #74FFA9 0%, #EBF1FF 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <>
      {/* Banner Section */}
      <div style={style} className="py-12 relative overflow-hidden ">
        {/* background image */}

        <img
          src={bannerBack}
          alt="banner"
          className="h-50 object-cover z-2 object-center absolute inset-y-36 left-0 animate-bounce [animation-duration:5000ms]"
        />
        <img
          src={bannerSpin}
          alt="banner"
          className="h-20 object-cover z-2 object-center absolute inset-y-66 left-[40%]  animate-spin [animation-duration:5000ms]"
        />
        <img
          src={bannerBac2}
          alt="banner"
          className="h-full object-cover z-10 object-center absolute inset-y-8 right-0  opacity-60"
        />
        {/* background image */}

        {/* Banner Section */}
        <div className="container-custom  grid  xl:grid-cols-2 space-x-6">
          <div className="py-12">
            <div className="flex-row lg:flex  justify-items-center  items-center  space-x-3   pl-2 lg:h-12 h-16 bg-[rgba(255,255,255,0.2)] rounded-full border-2   ">
              <p className="">
                <span className=" text-white  text-sm lg:text-md font-semibold  px-3 bg-green-500 rounded-full ">
                  Advanced Technology
                </span>
              </p>

              <p className="  text-white text-sm lg:text-md font-semibold">
                Comprehensive diagnosis by top specialists.
              </p>
            </div>
            <div className="">
              <h1 className="py-7  font-semibold text-center leading-tight lg:text-left  text-3xl lg:text-[54px] text-white [text-shadow:-2px_3px_0_rgba(255,255,255,0.4)]">
                Consult
                <span className="ml-3" style={linerback}>
                  Best Doctors
                </span>{" "}
                <span className="block md:inline">Your Nearby Location.</span>
              </h1>
              <p className="text-white text-md  text-center  lg:text-start">
                Embark on your healing journey with Doccure, where finding
                trusted doctors, booking appointments, and managing your health
              </p>
            </div>
            <div className="flex justify-center lg:justify-start">
              <button
                className="flex items-center gap-1 mt-6 py-3 px-2 bg-slate-100  text-md font-semibold rounded-md cursor-pointer hover:bg-slate-900 hover:text-white transition duration-300 ease-in-out delay-100 "
                onClick={() => navigate("/doctors")}
              >
                <MdLockOutline /> Book an Appointment
              </button>
            </div>
          </div>

          <div className="hidden xl:block">
            <img src={bannerImg} alt="bannerImage" />
          </div>
        </div>
        {/* Banner Section End */}
      </div>
      {/* End Banner Section */}

      {/* Slider */}
      <div className="relative w-full overflow-hidden bg-[#316dff] py-6">
        <div className="flex w-max animate-[slide_12s_linear_infinite]">
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-8">
                  <img src={spin} alt="spin" className="h-6 w-6" />
                  <h3 className="text-lg font-semibold text-white">
                    Certified Medical Professionals
                  </h3>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Slider End */}

      {/* Carousel Start */}
      <div className=" flex flex-col justify-center items-center space-y-2 py-8">
        <div
          className="lg:w-1/6  w-40 py-1 flex items-center justify-evenly rounded-full text-white capitalize font-medium"
          style={style}
        >
          <p className="font-bold">•</p>
          top specialist
          <p className="font-bold">• </p>
        </div>
        <h2 className=" text-2xl lg:text-4xl font-bold capitalize">
          Medical Support For
          <span className=" ml-1 lg:ml-3 text-[#316dff]">Every Need.</span>
        </h2>
      </div>
      <div className="flex justify-center ">
        <Slider />
      </div>

      {/* Carousel  End*/}
    </>
  );
}
