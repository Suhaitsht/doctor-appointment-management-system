import React from "react";

export default function SpecialityTabs({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: "specialities",
      label: "Specialities",
    },
  ];

  return (
    <div className="flex justify-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`rounded-md border px-5 py-2 text-xs font-medium transition ${
            activeTab === tab.id
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
