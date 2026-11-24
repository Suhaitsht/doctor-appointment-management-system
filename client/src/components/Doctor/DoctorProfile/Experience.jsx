import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FaImage, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa6";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  selectMyDoctorProfile,
  selectMyDoctorProfileUpdating,
  selectMyDoctorProfileError,
  updateMyDoctorProfile,
  clearMyDoctorProfileError,
} from "@/redux/slices/doctorSlice";

// ======================================================
// CONSTANTS
// ======================================================

// Stable reference prevents infinite useEffect loops.
const EMPTY_EXPERIENCES = [];

// ======================================================
// HELPERS
// ======================================================

const createEmptyExperience = () => ({
  id: crypto.randomUUID(),
  hospital: "",
  years: "",
  employment: "Full Time",
  description: "",
  startDate: "",
  endDate: "",
  current: false,
  open: true,
});

const formatDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const mapExperiences = (data = EMPTY_EXPERIENCES) => {
  return data.map((item) => ({
    id: item._id || crypto.randomUUID(),
    hospital: item.hospital || "",
    years: item.yearsOfExperience ?? "",
    employment: item.employment || "Full Time",
    description: item.jobDescription || "",
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    current: item.current ?? false,
    open: true,
  }));
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Experience({ experienceData }) {
  const dispatch = useDispatch();

  // Redux state
  const reduxProfile = useSelector(selectMyDoctorProfile);
  const updating = useSelector(selectMyDoctorProfileUpdating);
  const apiError = useSelector(selectMyDoctorProfileError);

  // Stable backend data reference
  const savedExperiences =
    experienceData ?? reduxProfile?.experiences ?? EMPTY_EXPERIENCES;

  // Local form state
  const [experiences, setExperiences] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ====================================================
  // LOAD EXPERIENCE DATA FROM REDUX
  // ====================================================

  useEffect(() => {
    setExperiences(mapExperiences(savedExperiences));
  }, [savedExperiences]);

  // ====================================================
  // ADD NEW EXPERIENCE
  // ====================================================

  const addExperience = () => {
    setExperiences((prev) => [...prev, createEmptyExperience()]);

    setError("");
    setSuccess("");
  };

  // ====================================================
  // UPDATE EXPERIENCE FIELD
  // ====================================================

  const updateExperience = (id, field, value) => {
    setExperiences((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "current") {
          return {
            ...item,
            current: value,
            endDate: value ? "" : item.endDate,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );

    setError("");
    setSuccess("");
  };

  // ====================================================
  // DELETE EXPERIENCE
  // ====================================================

  const removeExperience = (id) => {
    setExperiences((prev) => prev.filter((item) => item.id !== id));

    setError("");
    setSuccess("");
  };

  // ====================================================
  // ACCORDION OPEN / CLOSE
  // ====================================================

  const toggleOpen = (id) => {
    setExperiences((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              open: !item.open,
            }
          : item,
      ),
    );
  };

  // ====================================================
  // RESET SINGLE EXPERIENCE
  // ====================================================

  const resetExperience = (id) => {
    const original = savedExperiences.find(
      (item) => String(item._id) === String(id),
    );

    const resetItem = original
      ? mapExperiences([original])[0]
      : {
          ...createEmptyExperience(),
          id,
        };

    setExperiences((prev) =>
      prev.map((item) => (item.id === id ? resetItem : item)),
    );

    setError("");
    setSuccess("");
  };

  // ====================================================
  // CANCEL ALL UNSAVED CHANGES
  // ====================================================

  const handleCancel = () => {
    setExperiences(mapExperiences(savedExperiences));

    setError("");
    setSuccess("");

    dispatch(clearMyDoctorProfileError());
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateExperiences = () => {
    for (const item of experiences) {
      if (!item.hospital.trim()) {
        return "Hospital name is required.";
      }

      if (
        item.years !== "" &&
        (!Number.isInteger(Number(item.years)) || Number(item.years) < 0)
      ) {
        return "Years of experience must be a valid non-negative integer.";
      }

      if (item.startDate && item.endDate && item.endDate < item.startDate) {
        return "End Date cannot be before Start Date.";
      }
    }

    return "";
  };

  // ====================================================
  // SAVE EXPERIENCES TO MONGODB
  // ====================================================

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const validationError = validateExperiences();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Fields supported by current Doctor.js experienceSchema.
    const payload = experiences.map((item) => ({
      hospital: item.hospital.trim(),
      yearsOfExperience: item.years === "" ? 0 : Number(item.years),
      jobDescription: item.description.trim(),
      startDate: item.startDate || null,
      endDate: item.current ? null : item.endDate || null,
    }));

    try {
      await dispatch(
        updateMyDoctorProfile({
          experiences: payload,
        }),
      ).unwrap();

      setSuccess("Experience updated successfully.");
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to update experience.",
      );
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="mt-6">
      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Experience</h2>

        <Button
          type="button"
          onClick={addExperience}
          disabled={updating}
          className="rounded-full bg-blue-600 hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add New Experience
        </Button>
      </div>

      {/* ERROR */}
      {(error || apiError) && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error || apiError}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* EXPERIENCE LIST */}
      <div className="space-y-4">
        {experiences.length === 0 && (
          <Card className="border-slate-200 p-6 text-center text-sm text-slate-500 shadow-none">
            No experience records added yet.
          </Card>
        )}

        {experiences.map((item, index) => (
          <Card
            key={item.id}
            className="overflow-hidden border-slate-200 shadow-none"
          >
            {/* CARD HEADER */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-sm font-semibold">Experience {index + 1}</h3>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => removeExperience(item.id)}
                  disabled={updating}
                  className="text-xs text-red-500 disabled:opacity-50"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => toggleOpen(item.id)}
                  aria-label={
                    item.open ? "Collapse experience" : "Expand experience"
                  }
                  className="text-slate-600"
                >
                  {item.open ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>

            {/* ACCORDION CONTENT */}
            {item.open && (
              <div className="p-5">
                {/* HOSPITAL LOGO */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <FaImage className="text-xl" />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Hospital Logo</h4>

                    <p className="mt-1 text-xs text-slate-400">
                      Logo upload requires backend schema support.
                    </p>
                  </div>
                </div>

                {/* INFORMATION - TITLE AND LOCATION REMOVED */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {/* HOSPITAL */}
                  <Field
                    label="Hospital"
                    required
                    value={item.hospital}
                    onChange={(e) =>
                      updateExperience(item.id, "hospital", e.target.value)
                    }
                  />

                  {/* YEARS OF EXPERIENCE */}
                  <Field
                    label="Year of Experience"
                    type="number"
                    min="0"
                    step="1"
                    value={item.years}
                    onChange={(e) =>
                      updateExperience(item.id, "years", e.target.value)
                    }
                  />

                  {/* EMPLOYMENT */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-700">
                      Employment
                    </label>

                    <select
                      value={item.employment}
                      onChange={(e) =>
                        updateExperience(item.id, "employment", e.target.value)
                      }
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option>Full Time</option>
                      <option>Part Time</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>

                {/* JOB DESCRIPTION */}
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-medium text-slate-700">
                    Job Description
                  </label>

                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateExperience(item.id, "description", e.target.value)
                    }
                    className="min-h-[110px]"
                  />
                </div>

                {/* DATES */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Start Date"
                    type="date"
                    value={item.startDate}
                    onChange={(e) =>
                      updateExperience(item.id, "startDate", e.target.value)
                    }
                  />

                  <Field
                    label="End Date"
                    type="date"
                    value={item.endDate}
                    disabled={item.current}
                    onChange={(e) =>
                      updateExperience(item.id, "endDate", e.target.value)
                    }
                  />
                </div>

                {/* CURRENT WORKING */}
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(e) =>
                      updateExperience(item.id, "current", e.target.checked)
                    }
                  />
                  I Currently Working Here
                </label>

                {/* RESET */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => resetExperience(item.id)}
                    disabled={updating}
                    className="text-xs text-red-500"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={updating}
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {updating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ======================================================
// REUSABLE FIELD
// ======================================================

function Field({ label, required = false, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <Input {...props} />
    </div>
  );
}
