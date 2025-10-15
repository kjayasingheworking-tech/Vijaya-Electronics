const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  createTestNotification
} = require("../controllers/notificationController.js");

const router = express.Router();

// Get notifications for a specific recipient
router.get("/:recipientType/:recipientId", getNotifications);

// Get unread count for a specific recipient
router.get("/:recipientType/:recipientId/unread-count", getUnreadCount);

// Mark a specific notification as read
router.patch("/:notificationId/read", markAsRead);

// Mark a specific notification as unread
router.patch("/:notificationId/unread", markAsUnread);

// Mark all notifications as read for a recipient
router.patch("/mark-all-read", markAllAsRead);

// Delete a specific notification
router.delete("/:notificationId", deleteNotification);

// Clear all notifications for a recipient
router.delete("/clear-all", clearAllNotifications);

// Test endpoint to create notifications
router.post("/test", createTestNotification);

module.exports = router;
