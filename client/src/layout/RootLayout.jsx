import Footer from "@/components/Footer/Footer";
import Navbar from "@/NavBar/Navbar";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import React from "react";
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <>
      <Navbar />
      <ChatbotWidget />
      <Outlet />

      <Footer />
    </>
  );
}
