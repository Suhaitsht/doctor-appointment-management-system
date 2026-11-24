import React, { useCallback, useEffect, useRef, useState } from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import { FaBell, FaArrowRotateRight, FaCheck } from "react-icons/fa6";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import { connectSocket } from "@/services/socket";

// ==========================================
// API CONFIGURATION
// ==========================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = RAW_API_URL.replace(/\/+$/, "").replace(/\/api$/, "");

// Match these with your existing backend routes.
const NOTIFICATION_API = `${API_URL}/api/notifications`;

// ==========================================
// AUTH HEADERS
// ==========================================

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    },
  };
};

// ==========================================
// DATE FORMAT
// ==========================================

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ==========================================
// ADMIN NOTIFICATION BELL
// ==========================================

export default function AdminNotificationBell() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const [markingId, setMarkingId] = useState(null);

  // Prevent older API responses overwriting newer ones.
  const requestIdRef = useRef(0);

  // ========================================
  // FETCH NOTIFICATIONS
  // ========================================

  const fetchNotifications = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(NOTIFICATION_API, getAuthHeaders());

      if (requestId !== requestIdRef.current) {
        return;
      }

      const data = response.data;

      setNotifications(
        Array.isArray(data?.notifications) ? data.notifications : [],
      );

      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        "ADMIN NOTIFICATION FETCH ERROR:",
        err.response?.data || err.message,
      );

      setError(err.response?.data?.message || "Unable to load notifications");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ========================================
  // FETCH ON COMPONENT MOUNT
  // ========================================

  useEffect(() => {
    fetchNotifications();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchNotifications]);

  // ========================================
  // SOCKET.IO REAL-TIME NOTIFICATIONS
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    // Reuse the existing authenticated socket.
    const adminSocket = connectSocket(token);

    if (!adminSocket) {
      return;
    }

    const handleNewNotification = (notification) => {
      console.log("ADMIN REAL-TIME NOTIFICATION:", notification);

      // Fetch from backend to keep unread count accurate.
      fetchNotifications();
    };

    const handleSocketConnect = () => {
      console.log("ADMIN SOCKET CONNECTED:", adminSocket.id);

      // Catch notifications missed while disconnected.
      fetchNotifications();
    };

    const handleSocketError = (err) => {
      console.error("ADMIN SOCKET ERROR:", err.message);
    };

    adminSocket.on("notification:new", handleNewNotification);

    adminSocket.on("connect", handleSocketConnect);

    adminSocket.on("connect_error", handleSocketError);

    // Existing socket may already be connected.
    if (adminSocket.connected) {
      console.log("ADMIN SOCKET ALREADY CONNECTED:", adminSocket.id);
    }

    return () => {
      adminSocket.off("notification:new", handleNewNotification);

      adminSocket.off("connect", handleSocketConnect);

      adminSocket.off("connect_error", handleSocketError);
    };
  }, [fetchNotifications]);

  // ========================================
  // OPEN / CLOSE DROPDOWN
  // ========================================

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);

    if (nextOpen) {
      fetchNotifications();
    }
  };

  // ========================================
  // MARK AS READ
  // ========================================

  const markAsRead = async (notification) => {
    if (!notification || notification.isRead) {
      return true;
    }

    try {
      setMarkingId(notification._id);

      // Assumes PATCH /api/notifications/:id/read
      await axios.patch(
        `${NOTIFICATION_API}/${notification._id}/read`,
        {},
        getAuthHeaders(),
      );

      // Refresh from backend after successful update.
      await fetchNotifications();

      return true;
    } catch (err) {
      console.error(
        "ADMIN MARK AS READ ERROR:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message || "Failed to mark notification as read",
      );

      return false;
    } finally {
      setMarkingId(null);
    }
  };

  // ========================================
  // NOTIFICATION CLICK
  // ========================================

  const handleNotificationClick = async (notification) => {
    if (markingId) return;

    const success = await markAsRead(notification);

    if (!success) {
      return;
    }

    setOpen(false);

    // Only navigate to admin routes.
    if (
      typeof notification.link === "string" &&
      notification.link.startsWith("/admin/")
    ) {
      navigate(notification.link);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      {/* NOTIFICATION BELL */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications, ${unreadCount} unread`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <FaBell className="text-sm" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      {/* NOTIFICATION DROPDOWN */}
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[350px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Notifications
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {unreadCount === 0
                ? "You're all caught up"
                : `${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              fetchNotifications();
            }}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            title="Refresh notifications"
          >
            <FaArrowRotateRight className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="max-h-[380px] overflow-y-auto">
          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600"
            >
              {error}
            </div>
          )}

          {/* LOADING */}
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
              <FaArrowRotateRight className="animate-spin text-slate-400" />

              <p className="text-xs text-slate-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <FaBell className="mb-3 text-2xl text-slate-300" />

              <p className="text-sm font-medium text-slate-700">
                No notifications
              </p>

              <p className="mt-1 text-xs text-slate-400">
                New appointment notifications will appear here.
              </p>
            </div>
          ) : (
            /* NOTIFICATION LIST */
            notifications.slice(0, 10).map((notification) => {
              const isMarking = markingId === notification._id;

              return (
                <button
                  key={notification._id}
                  type="button"
                  disabled={Boolean(markingId)}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-60 ${
                    !notification.isRead ? "bg-blue-50/60" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* ICON */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      {notification.isRead ? (
                        <FaCheck className="text-xs" />
                      ) : (
                        <FaBell className="text-xs" />
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">
                          {notification.title}
                        </p>

                        {!notification.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-[10px] text-slate-400">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isMarking && (
                    <p className="mt-2 text-right text-[10px] text-blue-500">
                      Updating...
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center">
          <p className="text-[11px] text-slate-400">
            Latest {Math.min(notifications.length, 10)} notifications
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
