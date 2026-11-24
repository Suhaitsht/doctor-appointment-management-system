import React from "react";

export default function AdminProfileTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mt-4 flex gap-2 border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        onClick={() => setActiveTab("about")}
        className={`border-b-2 px-5 py-3 text-sm font-medium transition ${
          activeTab === "about"
            ? "border-cyan-500 text-cyan-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
        }`}
      >
        About
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("password")}
        className={`border-b-2 px-5 py-3 text-sm font-medium transition ${
          activeTab === "password"
            ? "border-cyan-500 text-cyan-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
        }`}
      >
        Password
      </button>
    </div>
  );
}
