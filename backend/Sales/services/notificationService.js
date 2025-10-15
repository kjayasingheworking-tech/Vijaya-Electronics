const Notification = require("../models/SalesNotificationModel.js");
const User = require("../models/UserModel.js");

// Create a new notification
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Customer Notifications
const createCustomerNotification = async (customerId, type, title, message, metadata = {}) => {
  return createNotification({
    recipientType: 'customer',
    recipientId: customerId,
    type,
    title,
    message,
    metadata
  });
};

// Sales Manager Notifications (Individual)
const createSalesManagerNotification = async (salesManagerId, type, title, message, metadata = {}) => {
  return createNotification({
    recipientType: 'sales_manager',
    recipientId: salesManagerId, 
    type,
    title,
    message,
    metadata
  });
};

// Broadcast notification to all sales managers
const notifyAllSalesManagers = async (type, title, message, metadata = {}) => {
  try {
    // Get all active sales managers
    const salesManagers = await User.find({ 
      role: 'sales_manager', 
      isActive: true 
    }).select('_id name email');

    if (salesManagers.length === 0) {
      console.warn('No active sales managers found to notify');
      return [];
    }

    // Create individual notifications for each sales manager
    const notifications = salesManagers.map(salesManager => ({
      title,
      message,
      type,
      recipientType: 'sales_manager',
      recipientId: salesManager._id,
      metadata: {
        ...metadata,
        broadcastTo: 'all_sales_managers',
        salesManagerName: salesManager.name,
        salesManagerEmail: salesManager.email
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert all notifications at once
    const createdNotifications = await Notification.insertMany(notifications);
    
    return createdNotifications;
  } catch (error) {
    console.error("Error creating notifications for all sales managers:", error);
    throw error;
  }
};

// Specific notification creators for different events

// Payment Success Notification
const notifyPaymentSuccess = async (customerId, paymentData) => {
  const { amount, paymentMethod, invoiceNumber } = paymentData;

  if (paymentMethod === 'Card') {
    return createCustomerNotification(
      customerId,
      'success',
      'Payment Successful',
      `Your payment of Rs. ${amount} has been processed successfully. Invoice: ${invoiceNumber}`,
      {
        relatedEntity: 'payment',
        relatedEntityId: paymentData.paymentId,
        amount,
        paymentMethod,
        invoiceNumber
      }
    );
  }

};

// Order Placed Notification
const notifyOrderPlaced = async (customerId, orderData) => {
  const { orderNumber, pointsEarned, invoiceNumber, totalAmount } = orderData;

  return createCustomerNotification(
    customerId,
    'success',
    'Order Placed Successfully',
    `Your order ${orderNumber} has been placed successfully. You earned ${pointsEarned} points! Invoice: ${invoiceNumber}`,
    {
      relatedEntity: 'order',
      relatedEntityId: orderData.orderId,
      orderNumber,
      pointsEarned,
      invoiceNumber,
      totalAmount
    }
  );
};

// New Discount Notification
const notifyNewDiscount = async (customerId, discountData) => {
  const { discountCode, discountName, discountPercentage, validUntil } = discountData;

  return createCustomerNotification(
    customerId,
    'info',
    'New Discount Available',
    `New discount "${discountName}" is now available! Use code "${discountCode}" for ${discountPercentage}% off. Valid until ${validUntil}`,
    {
      relatedEntity: 'discount',
      relatedEntityId: discountData.discountId,
      discountCode,
      discountName,
      discountPercentage,
      validUntil
    }
  );
};

// Credit Due Date Approaching Notification (for Sales Manager)
const notifyCreditDueDateApproaching = async (salesManagerId, creditData) => {
  const { customerName, amount, dueDate, daysRemaining, invoiceNumber } = creditData;

  const urgencyLevel = daysRemaining <= 1 ? 'error' : daysRemaining <= 3 ? 'warning' : 'info';
  const urgencyText = daysRemaining <= 1 ? 'DUE TODAY' : daysRemaining <= 3 ? 'DUE SOON' : 'DUE APPROACHING';

  return createSalesManagerNotification(
    salesManagerId,
    urgencyLevel,
    `Credit Payment ${urgencyText}`,
    `Customer ${customerName} has a credit payment of Rs. ${amount} due ${dueDate}. ${daysRemaining} days remaining. Invoice: ${invoiceNumber}`,
    {
      relatedEntity: 'payment',
      relatedEntityId: creditData.paymentId,
      customerName,
      amount,
      dueDate,
      daysRemaining,
      invoiceNumber
    }
  );
};

// Credit Due Date Approaching Notification (Broadcast to All Sales Managers)
const notifyAllSalesManagersCreditDueDateApproaching = async (creditData) => {
  const { customerName, amount, dueDate, daysRemaining, invoiceNumber } = creditData;

  const urgencyLevel = daysRemaining <= 1 ? 'error' : daysRemaining <= 3 ? 'warning' : 'info';
  const urgencyText = daysRemaining <= 1 ? 'DUE TODAY' : daysRemaining <= 3 ? 'DUE SOON' : 'DUE APPROACHING';

  return notifyAllSalesManagers(
    urgencyLevel,
    `Credit Payment ${urgencyText}`,
    `Customer ${customerName} has a credit payment of Rs. ${amount} due ${dueDate}. ${daysRemaining} days remaining. Invoice: ${invoiceNumber}`,
    {
      relatedEntity: 'payment',
      relatedEntityId: creditData.paymentId,
      customerName,
      amount,
      dueDate,
      daysRemaining,
      invoiceNumber
    }
  );
};

// Cheque Processing Status Update (for Sales Manager)
const notifyChequeStatusUpdate = async (salesManagerId, chequeData) => {
  const { chequeNumber, status, customerName, amount } = chequeData;

  const statusMessages = {
    'pending': 'is pending approval',
    'approved': 'has been approved',
    'rejected': 'has been rejected',
    'cleared': 'has been cleared',
    'bounced': 'has bounced'
  };

  return createSalesManagerNotification(
    salesManagerId,
    status === 'rejected' || status === 'bounced' ? 'error' : 'info',
    'Cheque Status Update',
    `Cheque ${chequeNumber} for Rs. ${amount} from ${customerName} ${statusMessages[status] || 'status updated'}`,
    {
      relatedEntity: 'cheque',
      relatedEntityId: chequeData.chequeId,
      chequeNumber,
      status,
      customerName,
      amount
    }
  );
};

// Customer Blocked Notification (for Sales Manager)
const notifyCustomerBlocked = async (salesManagerId, customerData) => {
  const { customerName, reason, blockedBy } = customerData;

  return createSalesManagerNotification(
    salesManagerId,
    'warning',
    'Customer Blocked',
    `Customer ${customerName} has been blocked. Reason: ${reason}. Blocked by: ${blockedBy}`,
    {
      relatedEntity: 'customer',
      relatedEntityId: customerData.customerId,
      customerName,
      reason,
      blockedBy
    }
  );
};

// Discount Start Notification (for Sales Manager)
const notifyDiscountStart = async (salesManagerId, discountData) => {
  const { discountName, discountCode, discountPercentage, validUntil } = discountData;

  return createSalesManagerNotification(
    salesManagerId,
    'info',
    'Discount Started',
    `Discount "${discountName}" (${discountCode}) with ${discountPercentage}% off has started. Valid until ${validUntil}`,
    {
      relatedEntity: 'discount',
      relatedEntityId: discountData.discountId,
      discountName,
      discountCode,
      discountPercentage,
      validUntil
    }
  );
};

// Discount End Notification (for Sales Manager)
const notifyDiscountEnd = async (salesManagerId, discountData) => {
  const { discountName, discountCode } = discountData;

  return createSalesManagerNotification(
    salesManagerId,
    'warning',
    'Discount Ended',
    `Discount "${discountName}" (${discountCode}) has ended`,
    {
      relatedEntity: 'discount',
      relatedEntityId: discountData.discountId,
      discountName,
      discountCode
    }
  );
};

module.exports = {
  createNotification,
  createCustomerNotification,
  createSalesManagerNotification,
  notifyAllSalesManagers,
  notifyPaymentSuccess,
  notifyOrderPlaced,
  notifyNewDiscount,
  notifyCreditDueDateApproaching,
  notifyAllSalesManagersCreditDueDateApproaching,
  notifyChequeStatusUpdate,
  notifyCustomerBlocked,
  notifyDiscountStart,
  notifyDiscountEnd
};
