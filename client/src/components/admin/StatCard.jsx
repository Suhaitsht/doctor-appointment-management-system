import React from "react";

import { Card } from "@/components/ui/card";

export default function StatCard({
  title,
  value,
  icon,
  progress = 60,
  iconClass = "text-blue-500",
  progressClass = "bg-blue-500",
}) {
  return (
    <Card className="border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg ${iconClass}`}
        >
          {icon}
        </div>

        <h3 className="text-xl font-semibold text-slate-700">{value}</h3>
      </div>

      <p className="mt-3 text-xs text-slate-500">{title}</p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${progressClass}`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </Card>
  );
}
