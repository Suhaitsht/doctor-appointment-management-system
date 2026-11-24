const tabs = [
  {
    id: "basic",
    label: "Basic Details",
  },
  {
    id: "experience",
    label: "Experience",
  },
  {
    id: "education",
    label: "Education",
  },
];

export default function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2 rounded-lg border bg-white p-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`rounded-md px-4 py-2 text-sm ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "border bg-white text-slate-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
