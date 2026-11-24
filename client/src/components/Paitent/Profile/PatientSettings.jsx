import React, { useState } from "react";

import ProfileSettingsForm from "./ProfileSettingsForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";

// ======================================================
// SETTINGS TABS
// ======================================================

const tabs = [
  {
    id: "profile",
    label: "Profile",
  },
  {
    id: "password",
    label: "Change Password",
  },
  {
    id: "delete-account",
    label: "Delete Account",
  },
];

// ======================================================
// PATIENT SETTINGS COMPONENT
// ======================================================

export default function PatientSettings() {
  // ====================================================
  // ACTIVE TAB
  // ====================================================

  const [activeTab, setActiveTab] = useState("profile");

  // ====================================================
  // HANDLE TAB CHANGE
  // ====================================================

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-full px-4 py-6 md:px-6">
      {/* =================================================
          SETTINGS TABS
      ================================================== */}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          const isDeleteTab = tab.id === "delete-account";

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`
                rounded-md border px-4 py-2
                text-xs font-medium transition
                ${
                  isActive
                    ? isDeleteTab
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-blue-600 bg-blue-600 text-white"
                    : isDeleteTab
                      ? "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =================================================
          PROFILE TAB
      ================================================== */}

      {activeTab === "profile" && <ProfileSettingsForm />}

      {/* =================================================
          CHANGE PASSWORD TAB
      ================================================== */}

      {activeTab === "password" && <ChangePasswordForm />}

      {/* =================================================
          DELETE ACCOUNT TAB
      ================================================== */}

      {activeTab === "delete-account" && <DeleteAccountForm />}
    </div>
  );
}
