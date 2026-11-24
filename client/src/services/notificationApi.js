import api from "../api/axios";

// ======================================================
// GET NOTIFICATIONS
// ======================================================

export const getNotifications = async (page = 1, limit = 20) => {
  const response = await api.get("/notifications", {
    params: { page, limit },
  });

  return response.data;
};

// ======================================================
// MARK ONE NOTIFICATION AS READ
// ======================================================

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );

  return response.data;
};

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");

  return response.data;
};
