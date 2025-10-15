const Notification = require("../models/SalesNotificationModel.js");

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;
    const { page = 1, limit = 20, filter = 'all' } = req.query;

    // Build query based on filter
    let query = { recipientType };
    
    // Set recipientId for all cases (no special "all" handling)
    query.recipientId = recipientId;
    
    if (filter === 'unread') {
      query.isRead = false;
    } else if (filter === 'read') {
      query.isRead = true;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(recipientType, recipientId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message
    });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { recipientType, recipientId } = req.body;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientType,
      recipientId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
};

// Mark a notification as unread
const markAsUnread = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { recipientType, recipientId } = req.body;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientType,
      recipientId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Mark as unread
    notification.isRead = false;
    notification.readAt = null;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as unread",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as unread",
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.body;

    let result;
    
    // Mark all notifications as read for the specific recipient
    result = await Notification.markAllAsRead(recipientType, recipientId);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message
    });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { recipientType, recipientId } = req.body;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientType,
      recipientId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message
    });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.body;

    let result;
    
    // Clear all notifications for the specific recipient
    result = await Notification.deleteMany({
      recipientType,
      recipientId
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      error: error.message
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;

    let unreadCount;
    
    // Handle special case for sales managers - if recipientId is "all", get all sales manager unread count
    if (recipientType === 'sales_manager' && recipientId === 'all') {
      unreadCount = await Notification.countDocuments({ 
        recipientType: 'sales_manager', 
        isRead: false 
      });
    } else {
      unreadCount = await Notification.getUnreadCount(recipientType, recipientId);
    }

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message
    });
  }
};

// Test endpoint to create a notification manually
const createTestNotification = async (req, res) => {
  try {
    const { customerId, type, title, message, recipientType } = req.body;
    
    // Handle special case for sales managers - if customerId is "all", use generic ID
    let recipientId = customerId;
    if (recipientType === 'sales_manager' && customerId === 'all') {
      recipientId = "000000000000000000000000";
    }
    
    const notification = new Notification({
      recipientId: recipientId,
      recipientType: recipientType || 'customer',
      type: type || 'info',
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      isRead: false
    });
    
    await notification.save();
    res.json({ success: true, message: "Test notification created", data: { notification } });
  } catch (error) {
    console.error("Error creating test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test notification",
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  createTestNotification
};
