import React, { useState } from "react";

import ProfileTabs from "./ProfileTabs";
import BasicDetails from "./BasicDetails";
import Experience from "./Experience";
import Education from "./Education";

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("basic");

  const tabs = {
    basic: <BasicDetails />,
    experience: <Experience />,
    education: <Education />,
  };

  return (
    <div className="w-full px-4 py-6 md:px-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Profile Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your personal and professional information.
        </p>
      </div>

      {/* Profile Navigation */}
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active Tab Content */}
      <div className="mt-6">{tabs[activeTab] ?? <BasicDetails />}</div>
    </div>
  );
}
