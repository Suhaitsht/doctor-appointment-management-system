import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AdminProfileHeader from "@/components/admin/Profile/AdminProfileHeader";
import AdminProfileTabs from "@/components/admin/Profile/AdminProfileTabs";
import ChangePasswordForm from "@/components/admin/Profile/ChangePasswordForm";
import EditProfileDialog from "@/components/admin/Profile/EditProfileDialog";
import PersonalDetails from "@/components/admin/Profile/PersonalDetails";

import {
  getProfile,
  updateProfile,
  clearAuthMessage,
} from "@/redux/slices/authSlice";

import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

// ==========================================
// API URL
// ==========================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_ORIGIN = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (image) => {
  if (!image) return "";

  if (
    /^https?:\/\//i.test(image) ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${API_ORIGIN}/${String(image).replace(/^\/+/, "")}`;
};

// ==========================================
// ADDRESS FORMATTER
// ==========================================

const formatAddress = (address) => {
  if (!address) return "";

  if (typeof address === "string") {
    return address;
  }

  if (typeof address === "object") {
    return [
      address.addressLine,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

// ==========================================
// PROFILE FORMATTER
// ==========================================

const formatAdminProfile = (user) => {
  if (!user) return null;

  const address = user.address;

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const locationFromAddress =
    address && typeof address === "object"
      ? [address.city, address.country].filter(Boolean).join(", ")
      : "";

  return {
    ...user,

    id: user._id || user.id || "",

    name: user.name || fullName || "Administrator",

    email: user.email || "",

    role:
      user.role === "admin" ? "Administrator" : user.role || "Administrator",

    image: getImageUrl(user.image),

    phone: user.phone || "",

    mobile: user.phone || "",

    location: user.location || locationFromAddress,

    address: formatAddress(address),

    description: user.description || "",

    dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
  };
};

// ==========================================
// ADMIN PROFILE PAGE
// ==========================================

export default function AdminProfile() {
  const dispatch = useDispatch();

  // ==========================================
  // REDUX AUTH STATE
  // ==========================================

  const {
    user,
    loading,
    updateLoading,
    error,
    successMessage,
    isAuthenticated,
  } = useSelector((state) => state.auth);

  // ==========================================
  // LOCAL UI STATES
  // ==========================================

  const [activeTab, setActiveTab] = useState("about");

  const [editOpen, setEditOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // FORMAT PROFILE
  // ==========================================

  const profile = useMemo(() => {
    return formatAdminProfile(user);
  }, [user]);

  // ==========================================
  // FETCH PROFILE ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    if (!isAuthenticated) return;

    dispatch(getProfile());
  }, [dispatch, isAuthenticated]);

  // ==========================================
  // REFRESH PROFILE
  // ==========================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      dispatch(clearAuthMessage());

      await dispatch(getProfile()).unwrap();
    } catch (err) {
      console.error("ADMIN PROFILE REFRESH ERROR:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================
  // OPEN EDIT DIALOG
  // ==========================================

  const handleEdit = () => {
    dispatch(clearAuthMessage());
    setEditOpen(true);
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleUpdateProfile = async (data) => {
    // IMPORTANT:
    // Only send fields supported by your
    // existing User model and backend API.

    const payload = {};

    // NAME
    if (data.name !== undefined) {
      payload.name = String(data.name).trim();
    }

    // PHONE
    const phone = data.mobile ?? data.phone;

    if (phone !== undefined) {
      payload.phone = String(phone).trim();
    }

    // DATE OF BIRTH
    if (data.dateOfBirth !== undefined) {
      payload.dateOfBirth = data.dateOfBirth || null;
    }

    // ADDRESS
    if (data.address !== undefined) {
      const existingAddress =
        user?.address && typeof user.address === "object" ? user.address : {};

      if (typeof data.address === "object" && data.address !== null) {
        payload.address = {
          ...existingAddress,
          ...data.address,
        };
      } else if (typeof data.address === "string") {
        // The dialog currently edits address
        // as one text field.
        // Avoid copying the formatted full address
        // into addressLine when nothing changed.

        const originalAddress = formatAddress(user?.address);

        const newAddress = data.address.trim();

        if (newAddress !== originalAddress) {
          payload.address = {
            ...existingAddress,
            addressLine: newAddress,
          };
        }
      }
    }

    // ========================================
    // SEND UPDATE REQUEST
    // ========================================

    // unwrap() throws on failure.
    // Let the dialog handle the error and
    // close itself only after success.

    return await dispatch(updateProfile(payload)).unwrap();
  };

  // ==========================================
  // DIALOG OPEN/CLOSE
  // ==========================================

  const handleEditOpenChange = (open) => {
    if (updateLoading) return;

    setEditOpen(open);
  };

  // ==========================================
  // LOADING STATES
  // ==========================================

  const isInitialLoading = loading && !profile;

  const isRefreshing = refreshing || (loading && !!profile);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="w-full space-y-6">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>

          <p className="mt-1 text-sm text-slate-500">Dashboard / Profile</p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing || !isAuthenticated}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />

          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* =====================================
          INITIAL LOADING
      ===================================== */}

      {isInitialLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />

          <p className="text-sm text-slate-500">Loading admin profile...</p>
        </div>
      )}

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <p>{error}</p>
        </div>
      )}

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {/* =====================================
          PROFILE CONTENT
      ===================================== */}

      {profile && (
        <>
          {/* PROFILE HEADER */}

          <AdminProfileHeader profile={profile} onEdit={handleEdit} />

          {/* PROFILE TABS */}

          <AdminProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* TAB CONTENT */}

          <div className="mt-5">
            {activeTab === "about" && (
              <PersonalDetails profile={profile} onEdit={handleEdit} />
            )}

            {activeTab === "password" && <ChangePasswordForm />}
          </div>

          {/* EDIT PROFILE DIALOG */}

          <EditProfileDialog
            open={editOpen}
            onOpenChange={handleEditOpenChange}
            profile={profile}
            setProfile={handleUpdateProfile}
            updating={updateLoading}
          />
        </>
      )}

      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {!loading && !profile && (
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle className="h-9 w-9 text-slate-400" />

          <div>
            <h3 className="font-semibold text-slate-800">
              Unable to load admin profile
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Please try refreshing the page.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={!isAuthenticated}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
