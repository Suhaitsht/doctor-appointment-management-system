import AdminSidebar from "@/components/admin/AdminSidebar/AdminSidebar";
import AdminHeader from "@/components/admin/Header";
import React from "react";

import { Outlet } from "react-router-dom";

export default function AdminRootLayout() {
  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Common Admin Sidebar */}
      <AdminSidebar />

      {/* Right Content */}
      <div className="min-w-0 flex-1">
        {/* Common Admin Header */}
        <AdminHeader />

        {/* Child Admin Pages */}
        <main className="p-4 md:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
