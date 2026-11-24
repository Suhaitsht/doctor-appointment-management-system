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

const EMPTY_EDUCATIONS = [];

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

// ======================================================
// HELPERS
// ======================================================

const createEmptyEducation = () => ({
  id: crypto.randomUUID(),
  institution: "",
  course: "",
  startDate: "",
  endDate: "",
  years: "",
  description: "",
  logo: "",
  open: true,
});

const formatDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const getLogoUrl = (logo) => {
  if (!logo || typeof logo !== "string") return "";

  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("data:")
  ) {
    return logo;
  }

  return `${API_ORIGIN}${logo.startsWith("/") ? "" : "/"}${logo}`;
};

const mapEducations = (data = EMPTY_EDUCATIONS) => {
  return data.map((item) => ({
    id: item._id || crypto.randomUUID(),
    institution: item.institutionName || "",
    course: item.course || "",
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    years: item.numberOfYears ?? "",
    description: item.description || "",
    logo: item.logo || "",
    open: true,
  }));
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Education({ educationData }) {
  const dispatch = useDispatch();

  // Redux State
  const reduxProfile = useSelector(selectMyDoctorProfile);
  const updating = useSelector(selectMyDoctorProfileUpdating);
  const apiError = useSelector(selectMyDoctorProfileError);

  // Stable backend data reference.
  // Avoid "?? []" here to prevent infinite useEffect loops.
  const savedEducations =
    educationData ?? reduxProfile?.education ?? EMPTY_EDUCATIONS;

  // Local form state
  const [educations, setEducations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ====================================================
  // LOAD MONGODB EDUCATION DATA
  // ====================================================

  useEffect(() => {
    setEducations(mapEducations(savedEducations));
  }, [savedEducations]);

  // ====================================================
  // ADD NEW EDUCATION
  // ====================================================

  const addEducation = () => {
    setEducations((prev) => [...prev, createEmptyEducation()]);

    setError("");
    setSuccess("");
  };

  // ====================================================
  // UPDATE EDUCATION FIELD
  // ====================================================

  const updateEducation = (id, field, value) => {
    setEducations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    setError("");
    setSuccess("");
  };

  // ====================================================
  // DELETE EDUCATION
  // ====================================================

  const removeEducation = (id) => {
    setEducations((prev) => prev.filter((item) => item.id !== id));

    setError("");
    setSuccess("");
  };

  // ====================================================
  // ACCORDION OPEN / CLOSE
  // ====================================================

  const toggleOpen = (id) => {
    setEducations((prev) =>
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
  // RESET SINGLE EDUCATION
  // ====================================================

  const resetEducation = (id) => {
    const original = savedEducations.find(
      (item) => String(item._id) === String(id),
    );

    const resetItem = original
      ? mapEducations([original])[0]
      : {
          ...createEmptyEducation(),
          id,
        };

    setEducations((prev) =>
      prev.map((item) => (item.id === id ? resetItem : item)),
    );

    setError("");
    setSuccess("");
  };

  // ====================================================
  // CANCEL ALL UNSAVED CHANGES
  // ====================================================

  const handleCancel = () => {
    setEducations(mapEducations(savedEducations));

    setError("");
    setSuccess("");

    dispatch(clearMyDoctorProfileError());
  };

  // ====================================================
  // VALIDATION
  // ====================================================

  const validateEducations = () => {
    for (const item of educations) {
      if (!item.institution.trim()) {
        return "Institution name is required.";
      }

      if (!item.course.trim()) {
        return "Course is required.";
      }

      if (
        item.years !== "" &&
        (!Number.isInteger(Number(item.years)) || Number(item.years) < 0)
      ) {
        return "Number of years must be a valid non-negative integer.";
      }

      if (item.startDate && item.endDate && item.endDate < item.startDate) {
        return "End Date cannot be before Start Date.";
      }
    }

    return "";
  };

  // ====================================================
  // SAVE EDUCATION TO MONGODB
  // ====================================================

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const validationError = validateEducations();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Map UI fields to Doctor.js educationSchema.
    const payload = educations.map((item) => ({
      institutionName: item.institution.trim(),
      course: item.course.trim(),
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      numberOfYears: item.years === "" ? 0 : Number(item.years),
      description: item.description.trim(),
      logo: item.logo,
    }));

    try {
      await dispatch(
        updateMyDoctorProfile({
          education: payload,
        }),
      ).unwrap();

      setSuccess("Education updated successfully.");
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to update education.",
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
        <h2 className="text-lg font-semibold text-slate-900">Education</h2>

        <Button
          type="button"
          onClick={addEducation}
          disabled={updating}
          className="rounded-full bg-blue-600 hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add New Education
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

      {/* EDUCATION LIST */}
      <div className="space-y-4">
        {educations.length === 0 && (
          <Card className="border-slate-200 p-6 text-center text-sm text-slate-500 shadow-none">
            No education records added yet.
          </Card>
        )}

        {educations.map((item, index) => (
          <Card
            key={item.id}
            className="overflow-hidden border-slate-200 shadow-none"
          >
            {/* CARD HEADER */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-sm font-semibold">Education {index + 1}</h3>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => removeEducation(item.id)}
                  disabled={updating}
                  className="text-xs text-red-500 disabled:opacity-50"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => toggleOpen(item.id)}
                  aria-label={
                    item.open ? "Collapse education" : "Expand education"
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
                {/* LOGO PREVIEW */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    {item.logo ? (
                      <img
                        src={getLogoUrl(item.logo)}
                        alt="Institution logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FaImage className="text-xl" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Logo</h4>

                    <p className="mt-1 text-xs text-slate-400">
                      Existing logo preview only. Upload requires backend
                      support.
                    </p>
                  </div>
                </div>

                {/* INSTITUTION & COURSE */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Name of the Institution"
                    required
                    value={item.institution}
                    onChange={(e) =>
                      updateEducation(item.id, "institution", e.target.value)
                    }
                  />

                  <Field
                    label="Course"
                    required
                    value={item.course}
                    onChange={(e) =>
                      updateEducation(item.id, "course", e.target.value)
                    }
                  />
                </div>

                {/* DATES AND YEARS */}
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field
                    label="Start Date"
                    type="date"
                    value={item.startDate}
                    onChange={(e) =>
                      updateEducation(item.id, "startDate", e.target.value)
                    }
                  />

                  <Field
                    label="End Date"
                    type="date"
                    value={item.endDate}
                    onChange={(e) =>
                      updateEducation(item.id, "endDate", e.target.value)
                    }
                  />

                  <Field
                    label="No of Years"
                    type="number"
                    min="0"
                    step="1"
                    value={item.years}
                    onChange={(e) =>
                      updateEducation(item.id, "years", e.target.value)
                    }
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-medium text-slate-700">
                    Description
                  </label>

                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateEducation(item.id, "description", e.target.value)
                    }
                    className="min-h-[110px]"
                  />
                </div>

                {/* RESET */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => resetEducation(item.id)}
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
