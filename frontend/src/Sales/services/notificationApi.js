// API service for notifications
import { API } from '../constants/salesApi.js';

// Get notifications for a user
export const getNotifications = async (recipientType, recipientId, page = 1, limit = 20, filter = 'all') => {
  try {
    const response = await fetch(
      `${API}/notifications/${recipientType}/${recipientId}?page=${page}&limit=${limit}&filter=${filter}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread count for a user
export const getUnreadCount = async (recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/${recipientType}/${recipientId}/unread-count`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId, recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark a notification as unread
export const markAsUnread = async (notificationId, recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/${notificationId}/unread`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async (recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/mark-all-read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId, recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Clear all notifications
export const clearAllNotifications = async (recipientType, recipientId) => {
  try {
    const response = await fetch(
      `${API}/notifications/clear-all`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientType,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};
