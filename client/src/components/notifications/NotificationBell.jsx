import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaCalendarCheck,
  FaCreditCard,
  FaCircleInfo,
} from "react-icons/fa6";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import useNotifications from "../../hooks/useNotifications";

// ======================================================
// NOTIFICATION ICON
// ======================================================

const getNotificationIcon = (type) => {
  switch (type) {
    case "payment_success":
      return <FaCreditCard className="h-4 w-4 text-green-600" />;

    case "payment_failed":
      return <FaCreditCard className="h-4 w-4 text-red-600" />;

    case "appointment_booked":
    case "appointment_approved":
    case "appointment_confirmed":
    case "appointment_rescheduled":
    case "appointment_reminder":
    case "appointment_completed":
      return <FaCalendarCheck className="h-4 w-4 text-blue-600" />;

    case "appointment_cancelled":
    case "appointment_rejected":
      return <FaCalendarCheck className="h-4 w-4 text-red-500" />;

    default:
      return <FaCircleInfo className="h-4 w-4 text-slate-500" />;
  }
};

// ======================================================
// FORMAT NOTIFICATION TIME
// ======================================================

const formatTime = (date) => {
  if (!date) return "";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ======================================================
// SAFE INTERNAL ROUTE VALIDATION
// ======================================================

const isSafeInternalRoute = (link) => {
  if (typeof link !== "string") {
    return false;
  }

  if (!link.startsWith("/")) {
    return false;
  }

  if (link.startsWith("//")) {
    return false;
  }

  if (link.includes("\\")) {
    return false;
  }

  if (/[\u0000-\u001F\u007F]/.test(link)) {
    return false;
  }

  return true;
};

// ======================================================
// NOTIFICATION BELL COMPONENT
// ======================================================

export default function NotificationBell() {
  const navigate = useNavigate();

  // ====================================================
  // REDUX AUTHENTICATION
  // ====================================================

  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // ====================================================
  // LOCAL UI STATE
  // ====================================================

  const [open, setOpen] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  // ====================================================
  // SHARED NOTIFICATION CONTEXT
  // ====================================================

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // ====================================================
  // CLOSE POPOVER AFTER LOGOUT
  // ====================================================

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setOpen(false);
      setProcessingId(null);
      setMarkingAll(false);
    }
  }, [isAuthenticated, token]);

  // ====================================================
  // HANDLE NOTIFICATION CLICK
  // ====================================================

  const handleNotificationClick = async (notification) => {
    if (!notification?._id || processingId || markingAll) {
      return;
    }

    setProcessingId(notification._id);

    try {
      // Mark notification as read first.
      if (!notification.isRead) {
        const success = await markAsRead(notification._id);

        if (!success) {
          return;
        }
      }

      // Close notification dropdown.
      setOpen(false);

      // Navigate only to trusted internal routes.
      if (isSafeInternalRoute(notification.link)) {
        navigate(notification.link);
      }
    } catch (err) {
      console.error("Notification click error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // ====================================================
  // HANDLE MARK ALL AS READ
  // ====================================================

  const handleMarkAllRead = async () => {
    if (markingAll || processingId) {
      return;
    }

    setMarkingAll(true);

    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Mark all notifications error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ====================================================
  // HANDLE RETRY
  // ====================================================

  const handleRetry = () => {
    fetchNotifications();
  };

  // ====================================================
  // HIDE WHEN NOT AUTHENTICATED
  // ====================================================

  if (!isAuthenticated || !token) {
    return null;
  }

  // ====================================================
  // COMPONENT UI
  // ====================================================

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ================================================
          NOTIFICATION BELL TRIGGER
      ================================================= */}

      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="
            relative h-10 w-10
            rounded-full
            transition-colors
            hover:bg-blue-50
          "
          aria-label={`Notifications, ${unreadCount} unread`}
          aria-haspopup="dialog"
        >
          <FaBell
            className="
              h-5 w-5
              text-slate-700
              transition-colors
              hover:text-blue-600
            "
          />

          {/* UNREAD COUNT BADGE */}

          {unreadCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5
                items-center justify-center
                rounded-full
                bg-red-500 px-1
                text-[10px] font-semibold
                text-white shadow-sm
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ================================================
          NOTIFICATION DROPDOWN
      ================================================= */}

      <PopoverContent
        align="end"
        sideOffset={10}
        className="
          w-[calc(100vw-24px)]
          max-w-[390px]
          overflow-hidden
          rounded-xl
          border border-slate-200
          bg-white p-0
          shadow-xl
        "
      >
        {/* ==============================================
            HEADER
        =============================================== */}

        <div
          className="
            flex items-center
            justify-between gap-3
            bg-white p-4
          "
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900">
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

          {/* MARK ALL READ BUTTON */}

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markingAll || Boolean(processingId)}
              onClick={handleMarkAllRead}
              className="
                gap-2 whitespace-nowrap
                text-xs font-medium
                text-blue-600
                hover:bg-blue-50
                hover:text-blue-700
              "
            >
              <FaCheckDouble className="h-3.5 w-3.5" />

              {markingAll ? "Updating..." : "Mark all read"}
            </Button>
          )}
        </div>

        <Separator />

        {/* ==============================================
            NOTIFICATION CONTENT
        =============================================== */}

        <ScrollArea className="h-[350px]">
          {/* LOADING STATE */}

          {loading && notifications.length === 0 ? (
            <div
              className="
                flex flex-col items-center
                justify-center gap-3
                px-6 py-12
              "
            >
              <div
                className="
                  h-7 w-7 animate-spin
                  rounded-full
                  border-2 border-slate-200
                  border-t-blue-600
                "
              />

              <p className="text-sm text-slate-500">Loading notifications...</p>
            </div>
          ) : error && notifications.length === 0 ? (
            /* ERROR STATE */

            <div className="space-y-3 p-6 text-center">
              <FaCircleInfo
                className="
                  mx-auto h-7 w-7
                  text-red-400
                "
              />

              <p className="text-sm text-red-500">{error}</p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleRetry}
              >
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            /* EMPTY STATE */

            <div
              className="
                flex flex-col
                items-center justify-center
                gap-3 px-6 py-12
                text-center
              "
            >
              <div
                className="
                  flex h-14 w-14
                  items-center justify-center
                  rounded-full bg-slate-100
                "
              >
                <FaBell
                  className="
                    h-6 w-6
                    text-slate-400
                  "
                />
              </div>

              <h4 className="text-sm font-semibold text-slate-700">
                No notifications yet
              </h4>

              <p className="max-w-[240px] text-xs leading-5 text-slate-500">
                Your appointment, payment and account notifications will appear
                here.
              </p>
            </div>
          ) : (
            /* NOTIFICATION LIST */

            <div>
              {error && (
                <div
                  className="
                    flex items-center
                    justify-between gap-2
                    bg-red-50 px-4 py-2
                  "
                >
                  <p className="text-xs text-red-600">{error}</p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {notifications.map((notification) => {
                const isProcessing = processingId === notification._id;

                return (
                  <button
                    key={notification._id}
                    type="button"
                    disabled={isProcessing || markingAll}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      flex w-full items-start
                      gap-3 border-b
                      border-slate-100
                      px-4 py-4 text-left
                      transition-colors
                      hover:bg-slate-50
                      disabled:cursor-wait
                      disabled:opacity-60
                      ${notification.isRead ? "bg-white" : "bg-blue-50/70"}
                    `}
                  >
                    {/* NOTIFICATION TYPE ICON */}

                    <div
                      className="
                        flex h-10 w-10
                        shrink-0 items-center
                        justify-center
                        rounded-full
                        bg-white shadow-sm
                      "
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* NOTIFICATION DETAILS */}

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          flex items-start
                          justify-between gap-2
                        "
                      >
                        <h4
                          className="
                            break-words text-sm
                            font-semibold
                            text-slate-800
                          "
                        >
                          {notification.title}
                        </h4>

                        {!notification.isRead && (
                          <span
                            className="
                              mt-1.5 h-2 w-2
                              shrink-0 rounded-full
                              bg-blue-500
                            "
                          />
                        )}
                      </div>

                      <p
                        className="
                          mt-1 break-words
                          text-xs leading-5
                          text-slate-500
                        "
                      >
                        {notification.message}
                      </p>

                      <div
                        className="
                          mt-2 flex items-center
                          gap-2
                        "
                      >
                        <span
                          className="
                            text-[11px]
                            text-slate-400
                          "
                        >
                          {formatTime(notification.createdAt)}
                        </span>

                        {notification.isRead && (
                          <FaCheck
                            className="
                              h-3 w-3
                              text-green-600
                            "
                          />
                        )}

                        {isProcessing && (
                          <span className="text-[11px] text-blue-500">
                            Updating...
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* ==============================================
            FOOTER
        =============================================== */}

        <Separator />

        <div
          className="
            flex items-center
            justify-between
            bg-slate-50 px-4 py-3
          "
        >
          <span className="text-xs text-slate-500">
            Latest {notifications.length} notifications
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleRetry}
            className="text-xs text-blue-600"
          >
            Refresh
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
