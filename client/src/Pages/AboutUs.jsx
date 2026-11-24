import React from "react";
import AboutHero from "@/components/about/AboutHero";
import AboutStats from "@/components/about/AboutStats";
import AboutStory from "@/components/about/AboutStory";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import AboutCTA from "@/components/about/AboutCTA";
import AboutValues from "@/components/about/AboutValues";

// Adjust this import to your existing testimonial location.
import Testimonial from "@/components/Testimonials/Testimonial";

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-white">
      <AboutHero />
      <AboutStats />
      <AboutStory />
      <WhyChooseUs />
      <AboutCTA />
      <AboutValues />
      <Testimonial />
    </main>
  );
}
