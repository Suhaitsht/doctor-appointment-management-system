import React from "react";

import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ExperienceSection({ experiences, setFormData }) {
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,

      experiences: [
        ...prev.experiences,
        {
          id: Date.now(),
          hospital: "",
          yearOfExperience: "",
          jobDescription: "",
          startDate: "",
          endDate: "",
        },
      ],
    }));
  };

  const removeExperience = (id) => {
    setFormData((prev) => ({
      ...prev,

      experiences:
        prev.experiences.length === 1
          ? prev.experiences
          : prev.experiences.filter((item) => item.id !== id),
    }));
  };

  const handleExperienceChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,

      experiences: prev.experiences.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Experience Details
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Add the doctor's previous work experience.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExperience}
          className="gap-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
        >
          <FaPlus />
          Add Experience
        </Button>
      </div>

      {experiences.map((experience, index) => (
        <div
          key={experience.id}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Experience #{index + 1}
            </p>

            {experiences.length > 1 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeExperience(experience.id)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <FaTrash />
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">Hospital</Label>

              <Input
                value={experience.hospital}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    "hospital",
                    e.target.value,
                  )
                }
                placeholder="Hospital name"
              />
            </div>

            <div>
              <Label className="mb-2 block">Year of Experience</Label>

              <Input
                type="number"
                min="0"
                value={experience.yearOfExperience}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    "yearOfExperience",
                    e.target.value,
                  )
                }
                placeholder="Example: 5"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Job Description</Label>

              <Textarea
                value={experience.jobDescription}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    "jobDescription",
                    e.target.value,
                  )
                }
                placeholder="Enter job responsibilities..."
                rows={4}
              />
            </div>

            <div>
              <Label className="mb-2 block">
                Start Date
                <span className="ml-1 text-red-500">*</span>
              </Label>

              <Input
                type="date"
                value={experience.startDate}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    "startDate",
                    e.target.value,
                  )
                }
              />
            </div>

            <div>
              <Label className="mb-2 block">
                End Date
                <span className="ml-1 text-red-500">*</span>
              </Label>

              <Input
                type="date"
                value={experience.endDate}
                onChange={(e) =>
                  handleExperienceChange(
                    experience.id,
                    "endDate",
                    e.target.value,
                  )
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
