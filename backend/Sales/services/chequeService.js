const Customer = require("../models/CustomerModel.js");
const Payment = require("../models/PaymentModel.js");
const Invoice = require("../models/InvoiceModel.js");
const { notifyChequeStatusUpdate } = require("./notificationService.js");

// Check if customer can use cheque payment
async function canUseCheque(customerId) {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer || customer.type !== "wholesale") {
      return { canUse: false, reason: "Not a wholesale customer" };
    }

    // Check if customer has pending cheques
    const pendingCheques = await Payment.find({
      customerId: customerId,
      paymentType: "Cheque",
      "chequeDetails.status": "Pending"
    });

    if (pendingCheques.length > 0) {
      return { canUse: false, reason: "Customer has pending cheques" };
    }

    return { canUse: true, reason: "Cheque payment available" };
    
  } catch (error) {
    console.error("Error checking cheque availability:", error);
    return { canUse: false, reason: "Error checking cheque availability" };
  }
}

// Create cheque payment record
async function createChequePayment(customerId, invoiceId, chequeDetails, amount) {
  try {
    const payment = new Payment({
      customerId,
      invoiceId,
      paymentType: "Cheque",
      amount,
      chequeDetails: {
        chequeNumber: chequeDetails.chequeNumber,
        bank: chequeDetails.bank,
        issueDate: new Date(chequeDetails.issueDate),
        status: "Pending"
      }
    });

    await payment.save();
    
    // Block customer until cheque is cleared
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.blocked = true;
      customer.blockedReason = "cheque_pending";
      await customer.save();
    }
    
    return payment;
    
  } catch (error) {
    console.error("Error creating cheque payment:", error);
    throw error;
  }
}

// Update cheque status
async function updateChequeStatus(paymentId, status, clearedDate = null, bouncedReason = null) {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update cheque details
    payment.chequeDetails.status = status;
    
    // Add cleared date if cheque is cleared
    if (status === "Cleared" && clearedDate) {
      payment.chequeDetails.clearedDate = new Date(clearedDate);
    }
    
    // Add bounce reason if cheque is bounced
    if (status === "Bounced" && bouncedReason) {
      payment.chequeDetails.bouncedReason = bouncedReason;
    }

    await payment.save();

    // Update invoice status based on cheque status
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      if (status === "Cleared") {
        invoice.status = "Paid";
      } else if (status === "Bounced") {
        invoice.status = "Unpaid";
      }
      await invoice.save();
    }

    // If cheque is cleared, unblock customer
    if (status === "Cleared") {
      const customer = await Customer.findById(payment.customerId);
      if (customer && customer.blockedReason === "cheque_pending") {
        customer.blocked = false;
        customer.blockedReason = "";
        await customer.save();
      }
    }

    // Send notification to sales manager about cheque status update
    try {
      const customer = await Customer.findById(payment.customerId);
      const salesManagerId = "all"; // All sales managers see the same notifications
      
      await notifyChequeStatusUpdate(salesManagerId, {
        chequeId: payment._id,
        chequeNumber: payment.chequeDetails.chequeNumber,
        status: status,
        customerName: customer?.name || "Unknown Customer",
        amount: payment.amount
      });
    } catch (notificationError) {
      console.error("Error sending cheque status notification:", notificationError);
      // Don't fail the cheque update if notifications fail
    }

    return payment;
    
  } catch (error) {
    console.error("Error updating cheque status:", error);
    throw error;
  }
}

// Create credit payment record
async function createCreditPayment(customerId, invoiceId, amount) {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    const payment = new Payment({
      customerId,
      invoiceId,
      paymentType: "Credit",
      amount,
      creditDetails: {
        dueDate,
        status: "Pending"
      }
    });

    await payment.save();
    return payment;
    
  } catch (error) {
    console.error("Error creating credit payment:", error);
    throw error;
  }
}

// Update credit payment status
async function updateCreditStatus(paymentId, status, paidDate = null) {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update credit details
    payment.creditDetails.status = status;
    if (status === "Paid" && paidDate) {
      payment.creditDetails.paidDate = new Date(paidDate);
    }

    await payment.save();

    // Update invoice status if credit is paid
    if (status === "Paid") {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.status = "Paid";
        await invoice.save();
      }

      // Update customer credit info
      const customer = await Customer.findById(payment.customerId);
      if (customer) {
        // Recalculate credit availability
        const { updateCustomerCredit } = require("./creditService.js");
        await updateCustomerCredit(payment.customerId);
      }
    }

    return payment;
    
  } catch (error) {
    console.error("Error updating credit status:", error);
    throw error;
  }
}

module.exports = {
  canUseCheque,
  createChequePayment,
  updateChequeStatus,
  createCreditPayment,
  updateCreditStatus
};
