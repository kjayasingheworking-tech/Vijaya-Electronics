const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  // Basic notification info
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['success', 'info', 'warning', 'error']
  },
  
  // Recipient info
  recipientType: {
    type: String,
    required: true,
    enum: ['customer', 'sales_manager']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Related data (optional)
  relatedEntity: {
    type: String,
    enum: ['order', 'payment', 'discount', 'customer', 'cheque']
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Additional data for specific notification types
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientType, recipientId) {
  return this.countDocuments({
    recipientType,
    recipientId,
    isRead: false
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(recipientType, recipientId) {
  return this.updateMany(
    { recipientType, recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const Notification = mongoose.model("salesNotification", notificationSchema);

module.exports = Notification;
