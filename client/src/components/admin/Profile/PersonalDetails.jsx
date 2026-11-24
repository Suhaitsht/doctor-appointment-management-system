import React from "react";

import { FaPen } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PersonalDetails({ profile, onEdit }) {
  return (
    <Card className="border-slate-200 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Personal Details
        </h2>

        <Button
          type="button"
          variant="ghost"
          onClick={onEdit}
          className="gap-2 text-slate-600"
        >
          <FaPen />
          Edit
        </Button>
      </div>

      <div className="grid max-w-[800px] gap-y-5 md:grid-cols-[220px_1fr]">
        <Detail label="Name" value={profile.name} />

        <Detail label="Date of Birth" value={profile.dateOfBirth} />

        <Detail label="Email ID" value={profile.email} />

        <Detail label="Mobile" value={profile.mobile} />

        <Detail label="Address" value={profile.address} />
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <>
      <p className="text-sm text-slate-400">{label}</p>

      <p className="text-sm font-medium text-slate-800">{value || "-"}</p>
    </>
  );
}
