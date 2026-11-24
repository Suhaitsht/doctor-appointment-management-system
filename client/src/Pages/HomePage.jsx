import About from "@/About/About";
import ArticlesSection from "@/components/Articles/ArticlesSection";
import DoctorSlider from "@/components/doctor category carousel/DoctorSlider";
import HeroSection from "@/components/Herosection/HeroSection";
import Testimonial from "@/components/Testimonials/Testimonial";
import WorkSection from "@/components/WorkSection/WorkSection";
import React from "react";

export default function Home() {
  return (
    <>
      <HeroSection />
      <About />
      <DoctorSlider />
      <WorkSection />
      <Testimonial />
      <ArticlesSection />
    </>
  );
}
