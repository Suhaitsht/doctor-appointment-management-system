import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, percentage, icon, negative }) {
  return (
    <Card className="border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{title}</p>

          <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>

          <p
            className={`mt-1 text-[10px] font-medium ${
              negative ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {percentage} From Last Week
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
          {icon}
        </div>
      </div>
    </Card>
  );
}
