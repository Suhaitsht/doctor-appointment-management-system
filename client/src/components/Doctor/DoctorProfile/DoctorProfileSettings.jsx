import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ProfileTabs from "./ProfileTab";
import BasicDetails from "./BasicDetails";
import Experience from "./Experience";
import Education from "./Education";

import {
  fetchMyDoctorProfile,
  selectMyDoctorProfile,
  selectMyDoctorProfileLoading,
  selectMyDoctorProfileError,
} from "@/redux/slices/doctorSlice";

export default function DoctorProfileSettings() {
  const dispatch = useDispatch();

  // Active tab
  const [activeTab, setActiveTab] = useState("basic");

  // Redux doctor profile
  const profile = useSelector(selectMyDoctorProfile);
  const loading = useSelector(selectMyDoctorProfileLoading);
  const error = useSelector(selectMyDoctorProfileError);

  // Fetch doctor profile when page opens
  useEffect(() => {
    dispatch(fetchMyDoctorProfile());
  }, [dispatch]);

  return (
    <div className="w-full px-4 py-6 md:px-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-semibold text-slate-900">
          Profile Settings
        </h1>
      </div>

      {/* LOADING */}
      {loading && !profile && (
        <div className="py-10 text-center text-slate-500">
          Loading doctor profile...
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* PROFILE CONTENT */}
      {profile && (
        <>
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "basic" && <BasicDetails profileData={profile} />}

          {activeTab === "experience" && (
            <Experience experienceData={profile.experiences} />
          )}

          {activeTab === "education" && (
            <Education educationData={profile.education} />
          )}
        </>
      )}
    </div>
  );
}
