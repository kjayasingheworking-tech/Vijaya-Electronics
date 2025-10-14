// src/api/notifications.js
import api from "../api/axios";

// unread only
export const fetchUnreadNotifications = async () => {
  const { data } = await api.get("/notifications/me", { params: { unread: true } });
  return data || [];
};

// all (read + unread, last 50 from server)
export const fetchAllNotifications = async () => {
  const { data } = await api.get("/notifications/me");
  return data || [];
};

// mark single read
export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/me/${id}/read`);
  return data;
};

// mark all read
export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/me/read-all");
  return data;
};
