const Customer = require("../models/CustomerModel.js");
const Payment = require("../models/PaymentModel.js");
const { notifyCreditDueDateApproaching, notifyAllSalesManagers } = require("./notificationService.js");
const { findOrCreateCustomer } = require("../utils/customerHelper.js");

// Calculate credit limit based on tier and total purchase amount
function calculateCreditLimit(customer) {
  // Only wholesale customers get credit
  if (customer.type !== "wholesale") {
    return 0;
  }

  const totalPurchase = customer.totalPurchaseAmount || 0;
  
  // Different multipliers for different tiers
  if (customer.tier === "diamond") {
    return totalPurchase * 70/100;
  } else if (customer.tier === "gold") {
    return totalPurchase * 50/100;
  } else if (customer.tier === "silver") {
    return totalPurchase * 30/100;
  } else {
    return 0;
  }
}

// Update customer credit information
async function updateCustomerCredit(customerId) {
  try {
    const customer = await findOrCreateCustomer(customerId);
    if (!customer || customer.type !== "wholesale") {
      return customer;
    }

    // Calculate credit limit
    const creditLimit = calculateCreditLimit(customer);
    
    // Find all pending credit payments for this customer
    const pendingCreditPayments = await Payment.find({
      customerId: customerId,
      paymentType: "Credit",
      isActive: true
    });
    
    // Add up all pending credit amounts
    let currentCreditUsed = 0;
    for (const payment of pendingCreditPayments) {
      currentCreditUsed += payment.amount;
    }
    
    // Calculate available credit (cannot be negative)
    const creditAvailable = Math.max(0, creditLimit - currentCreditUsed);
    
    // Update customer with new credit information
    customer.creditLimit = creditLimit;
    customer.currentCreditUsed = currentCreditUsed;
    customer.creditAvailable = creditAvailable;
    
    await customer.save();

    // Check for approaching credit due dates
    await checkApproachingCreditDueDates();

    return customer;
    
  } catch (error) {
    console.error("Error updating customer credit:", error);
    throw error;
  }
}

// Check if customer can use credit for new purchase
async function canUseCredit(customerId, amount) {
  try {
    const customer = await findOrCreateCustomer(customerId);
    if (!customer || customer.type !== "wholesale") {
      return { canUse: false, reason: "Not a wholesale customer" };
    }

    // Update credit info first
    await updateCustomerCredit(customerId);
    
    // Check if blocked
    if (customer.blocked) {
      return { canUse: false, reason: "Customer is blocked" };
    }

    // Check if amount exceeds available credit
    if (amount > customer.creditAvailable) {
      return { canUse: false, reason: "Amount exceeds available credit" };
    }

    return { canUse: true, reason: "Credit available" };
    
  } catch (error) {
    console.error("Error checking credit:", error);
    return { canUse: false, reason: "Error checking credit" };
  }
}

// Check for approaching credit due dates and send notifications
async function checkApproachingCreditDueDates() {
  try {
    const salesManagerId = "all"; // All sales managers see the same notifications
    
    // Find all active credit payments
    const creditPayments = await Payment.find({
      paymentType: "Credit",
      isActive: true,
      "creditDetails.dueDate": { $exists: true }
    }).populate('customerId', 'name');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const payment of creditPayments) {
      const dueDate = new Date(payment.creditDetails.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      // Calculate days remaining
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Send notification if due date is approaching (within 7 days)
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        try {
          await notifyCreditDueDateApproaching(salesManagerId, {
            paymentId: payment._id,
            customerName: payment.customerId?.name || "Unknown Customer",
            amount: payment.amount,
            dueDate: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            daysRemaining: daysRemaining,
            invoiceNumber: payment.invoiceId ? `INV-${payment.invoiceId}` : "N/A"
          });
        } catch (notificationError) {
          console.error("Error sending credit due date notification:", notificationError);
          // Don't fail the check if notifications fail
        }
      }
    }

    return creditPayments.length;
  } catch (error) {
    console.error("Error checking approaching credit due dates:", error);
    throw error;
  }
}

// Check for overdue credit payments and block customers
async function checkOverdueCreditPayments() {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find all overdue credit payments
    const overduePayments = await Payment.find({
      paymentType: "Credit",
      "creditDetails.status": "Pending",
      "creditDetails.dueDate": { $lt: thirtyDaysAgo }
    });
    
    // Process each overdue payment
    for (const payment of overduePayments) {
      // Mark payment as overdue
      payment.creditDetails.status = "Overdue";
      
      // Calculate how many days overdue
      const daysOverdue = Math.floor(
        (new Date() - payment.creditDetails.dueDate) / (1000 * 60 * 60 * 24)
      );
      payment.creditDetails.daysOverdue = daysOverdue;
      
      await payment.save();
      
      // Block the customer if not already blocked
      const customer = await Customer.findById(payment.customerId);
      if (customer && !customer.blocked) {
        customer.blocked = true;
        customer.blockedReason = "overdue";
        await customer.save();
        
        // Notify sales managers about customer being blocked due to overdue payments
        try {
          await notifyAllSalesManagers(
            'error',
            'Customer Blocked - Overdue Payment',
            `Customer ${customer.name} has been automatically blocked due to overdue credit payment of Rs. ${payment.amount}. Invoice: ${payment.invoiceNumber}`,
            {
              relatedEntity: 'customer',
              relatedEntityId: customer._id,
              customerName: customer.name,
              reason: 'overdue',
              blockedBy: 'System',
              amount: payment.amount,
              invoiceNumber: payment.invoiceNumber
            }
          );
        } catch (notificationError) {
          console.error("Error sending overdue payment block notification:", notificationError);
          // Don't fail the block operation if notifications fail
        }
      }
    }
    
    return overduePayments.length;
    
  } catch (error) {
    console.error("Error checking overdue payments:", error);
    throw error;
  }
}

module.exports = {
  calculateCreditLimit,
  updateCustomerCredit,
  canUseCredit,
  checkApproachingCreditDueDates,
  checkOverdueCreditPayments
};
