import Footer from "@/components/Footer/Footer";
import Navbar from "@/NavBar/Navbar";
import React from "react";
import { Outlet } from "react-router-dom";

export default function DoctorLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
