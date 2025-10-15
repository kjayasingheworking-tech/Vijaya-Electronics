import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, AlertCircle, X, Bell, Check, Trash2, CreditCard, UserX, Percent, TrendingUp } from "lucide-react";
import {
  getNotifications, getUnreadCount, markAsRead, markAsUnread, markAllAsRead, deleteNotification,
  clearAllNotifications
} from "../../services/notificationApi.js";
import ModalWrapper from "../ModalWrapper";

// UI Components
const Button = ({ children, variant = "solid", size = "md", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none";

  const variants = {
    solid: "bg-honeycomb-orange text-tech-white hover:bg-orange-600",
    ghost: "bg-transparent hover:bg-light-gray text-dark-charcoal",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-electric-blue text-white ${className}`}
    >
      {children}
    </span>
  );
};

// Notification Item Component for Sales Manager
const SalesNotificationItem = ({ notification, onMarkAsRead, onDelete, onMarkAsUnread }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-green" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-honeycomb-orange" />;
      case 'error':
        return <UserX className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Clock className="h-5 w-5 text-electric-blue" />;
      default:
        return <Bell className="h-5 w-5 text-slate-gray" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-success-green';
      case 'warning':
        return 'border-l-honeycomb-orange';
      case 'error':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-electric-blue';
      default:
        return 'border-l-slate-gray';
    }
  };

  const getPriorityIcon = (title) => {
    if (title.includes('DUE TODAY') || title.includes('DUE SOON')) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    if (title.includes('Credit Payment')) {
      return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
    if (title.includes('Customer Blocked')) {
      return <UserX className="h-4 w-4 text-red-500" />;
    }
    if (title.includes('Discount')) {
      return <Percent className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  return (
    <div className={`flex items-start space-x-3 p-3 hover:bg-light-gray rounded-lg transition-colors border-l-4 ${getTypeColor(notification.type)} ${notification.isRead ? 'opacity-60' : ''}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className={`font-medium text-sm ${notification.isRead ? 'text-slate-gray' : 'text-dark-charcoal'}`}>
                {notification.title}
              </p>
              {getPriorityIcon(notification.title)}
            </div>
            <p className="text-xs text-slate-gray mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-slate-gray mt-1">
              {notification.time}
            </p>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {!notification.isRead ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-success-green hover:text-white"
                onClick={() => onMarkAsRead(notification._id)}
                title="Mark as read"
              >
                <Check className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-electric-blue hover:text-white"
                onClick={() => onMarkAsUnread(notification._id)}
                title="Mark as unread"
              >
                <Bell className="h-3 w-3" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white"
              onClick={() => onDelete(notification._id)}
              title="Delete notification"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Sales Notification Modal Component
const SalesNotificationModal = ({ isOpen, onClose, salesManagerId }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotifications('sales_manager', salesManagerId);
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Set empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [salesManagerId]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount('sales_manager', salesManagerId);
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  }, [salesManagerId]);

  // Load notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, loadNotifications, loadUnreadCount]);

  // Notification management functions
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId, 'sales_manager', salesManagerId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await markAsUnread(notificationId, 'sales_manager', salesManagerId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: false }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId, 'sales_manager', salesManagerId);
      setNotifications(prev =>
        prev.filter(notification => notification._id !== notificationId)
      );
      // Update unread count if notification was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead('sales_manager', salesManagerId);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications('sales_manager', salesManagerId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
        return true;
    }
  });

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-modal')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalWrapper>
      <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
        <div className="notification-modal bg-white rounded-lg shadow-elegant border border-light-gray w-2/5 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-light-gray">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-electric-blue" />
              <h3 className="font-semibold text-dark-charcoal">Sales Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-honeycomb-orange text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-light-gray"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-light-gray">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'read', label: 'Read' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${filter === tab.key
                    ? 'text-electric-blue border-b-2 border-electric-blue'
                    : 'text-slate-gray hover:text-dark-charcoal'
                  }`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-light-gray/30">
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-600"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              </div>
              <span className="text-xs text-slate-gray">
                {filteredNotifications.length} of {notifications.length}
              </span>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue mb-3"></div>
                <p className="text-slate-gray text-sm">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-slate-gray mb-3" />
                <p className="text-slate-gray text-sm">
                  {filter === 'all'
                    ? 'No notifications yet'
                    : `No ${filter} notifications`
                  }
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredNotifications.map((notification) => (
                  <SalesNotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default SalesNotificationModal;
