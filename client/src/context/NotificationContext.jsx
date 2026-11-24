import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSelector } from "react-redux";
import api from "../api/axios";

import { connectSocket, disconnectSocket } from "../services/socket";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  const activeToken = isAuthenticated ? token : null;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(activeToken));
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);
  const tokenRef = useRef(activeToken);

  tokenRef.current = activeToken;

  // ====================================================
  // FETCH NOTIFICATIONS
  // ====================================================

  const fetchNotifications = useCallback(async () => {
    const requestedToken = activeToken;

    if (!requestedToken) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const response = await api.get("/notifications", {
        params: {
          page: 1,
          limit: 20,
        },
        headers: {
          Authorization: `Bearer ${requestedToken}`,
        },
      });

      if (
        requestId !== requestIdRef.current ||
        tokenRef.current !== requestedToken
      ) {
        return;
      }

      setNotifications(response.data?.notifications ?? []);

      setUnreadCount(response.data?.unreadCount ?? 0);

      setError("");
    } catch (err) {
      if (
        requestId !== requestIdRef.current ||
        tokenRef.current !== requestedToken
      ) {
        return;
      }

      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      if (
        requestId === requestIdRef.current &&
        tokenRef.current === requestedToken
      ) {
        setLoading(false);
      }
    }
  }, [activeToken]);

  // ====================================================
  // AUTH SESSION + SOCKET.IO
  // ====================================================

  useEffect(() => {
    requestIdRef.current += 1;

    setNotifications([]);
    setUnreadCount(0);
    setError("");

    if (!activeToken) {
      setLoading(false);
      disconnectSocket();
      return;
    }

    const socket = connectSocket(activeToken);

    fetchNotifications();

    if (!socket) return;

    const handleConnect = () => {
      fetchNotifications();
    };

    const handleNotificationChange = () => {
      fetchNotifications();
    };

    socket.on("connect", handleConnect);

    socket.on("notification:new", handleNotificationChange);

    socket.on("notification:read", handleNotificationChange);

    socket.on("notification:read-all", handleNotificationChange);

    return () => {
      requestIdRef.current += 1;

      socket.off("connect", handleConnect);

      socket.off("notification:new", handleNotificationChange);

      socket.off("notification:read", handleNotificationChange);

      socket.off("notification:read-all", handleNotificationChange);

      disconnectSocket();
    };
  }, [activeToken, fetchNotifications]);

  // ====================================================
  // MARK ONE AS READ
  // ====================================================

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!activeToken || !notificationId) {
        return false;
      }

      const requestedToken = activeToken;

      try {
        await api.patch(
          `/notifications/${encodeURIComponent(notificationId)}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${requestedToken}`,
            },
          },
        );

        if (tokenRef.current !== requestedToken) {
          return false;
        }

        await fetchNotifications();

        return true;
      } catch (err) {
        if (tokenRef.current === requestedToken) {
          setError(
            err.response?.data?.message ||
              "Unable to mark notification as read",
          );
        }

        return false;
      }
    },
    [activeToken, fetchNotifications],
  );

  // ====================================================
  // MARK ALL AS READ
  // ====================================================

  const markAllAsRead = useCallback(async () => {
    if (!activeToken) return false;

    const requestedToken = activeToken;

    try {
      await api.patch(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${requestedToken}`,
          },
        },
      );

      if (tokenRef.current !== requestedToken) {
        return false;
      }

      await fetchNotifications();

      return true;
    } catch (err) {
      if (tokenRef.current === requestedToken) {
        setError(
          err.response?.data?.message ||
            "Unable to mark all notifications as read",
        );
      }

      return false;
    }
  }, [activeToken, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ======================================================
// CUSTOM CONTEXT HOOK
// ======================================================

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotificationContext must be used inside NotificationProvider",
    );
  }

  return context;
}
