import React from "react";

import { FaLocationDot, FaPen } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminProfileHeader({ profile, onEdit }) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        {/* LEFT */}
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <img
            src={profile.image}
            alt={profile.name}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
          />

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-900">
              {profile.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-600 sm:justify-start">
              <FaLocationDot className="text-cyan-500" />

              {profile.location}
            </div>

            <p className="mt-3 max-w-[650px] text-sm leading-6 text-slate-500">
              {profile.description}
            </p>
          </div>
        </div>

        {/* EDIT */}
        <Button
          type="button"
          onClick={onEdit}
          className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
        >
          <FaPen />
          Edit
        </Button>
      </div>
    </Card>
  );
}
