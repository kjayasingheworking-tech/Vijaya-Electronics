const Payment = require("../models/PaymentModel.js");
const Invoice = require("../models/InvoiceModel.js");
const Customer = require("../models/CustomerModel.js");

// Get payment history for a customer
const getCustomerPaymentHistory = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    
    // Check if customer exists (for registered customers) and populate user data
    const customer = await Customer.findById(customerId).populate('user', 'name email role isActive');
    
    let payments = [];
    let invoices = [];
    
    if (customer) {
      // Registered customer - get payments by customerId
      payments = await Payment.find({ customerId: customerId })
        .sort({ createdAt: -1 });
      
      invoices = await Invoice.find({ 
        customerId: customerId
      }).sort({ createdAt: -1 });
    }

    // Calculate statistics for all payment types
    const cashStats = calculateCashStats(payments, invoices);
    const cardStats = calculateCardStats(payments, invoices);
    const chequeStats = calculateChequeStats(payments, invoices);
    const creditStats = calculateCreditStats(payments, invoices, customer);

    // Combine all payment history
    const paymentHistory = {
      customer: customer, // Send the full customer object with populated user data
      cashHistory: cashStats,
      cardHistory: cardStats,
      chequeHistory: chequeStats,
      creditHistory: creditStats,
      allPayments: payments.map(payment => ({
        id: payment._id,
        paymentType: payment.paymentType,
        amount: payment.amount,
        status: payment.paymentType === "Cheque" ? payment.chequeDetails?.status : 
                payment.paymentType === "Credit" ? payment.creditDetails?.status : "Completed",
        createdAt: payment.createdAt,
        invoiceNumber: invoices.find(inv => inv._id.toString() === payment.invoiceId.toString())?.invoiceNumber
      }))
    };

    res.json(paymentHistory);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Calculate cheque payment statistics
function calculateChequeStats(payments, invoices) {
  const chequePayments = payments.filter(p => p.paymentType === "Cheque");
  
  if (chequePayments.length === 0) {
    return {
      totalCheques: 0,
      clearedCheques: 0,
      bouncedCheques: 0,
      pendingCheques: 0,
      totalBounceCount: 0,
      bounceRate: 0,
      totalChequeAmount: 0,
      clearedAmount: 0,
      bouncedAmount: 0,
      pendingAmount: 0,
      chequeDetails: []
    };
  }

  let clearedCount = 0;
  let bouncedCount = 0;
  let pendingCount = 0;
  let totalBounceCount = 0;
  let clearedAmount = 0;
  let bouncedAmount = 0;
  let pendingAmount = 0;

  const chequeDetails = [];

  chequePayments.forEach(payment => {
    const status = payment.chequeDetails?.status || "Pending";
    const amount = payment.amount || 0;
    
    // Count by status
    if (status === "Cleared") {
      clearedCount++;
      clearedAmount += amount;
    } else if (status === "Bounced") {
      bouncedCount++;
      bouncedAmount += amount;
      totalBounceCount++;
    } else {
      pendingCount++;
      pendingAmount += amount;
    }

    // Add to details
    chequeDetails.push({
      id: payment._id,
      chequeNumber: payment.chequeDetails?.chequeNumber || "N/A",
      bank: payment.chequeDetails?.bank || "N/A",
      amount: amount,
      status: status,
      issueDate: payment.chequeDetails?.issueDate,
      clearedDate: payment.chequeDetails?.clearedDate,
      bouncedReason: payment.chequeDetails?.bouncedReason,
      createdAt: payment.createdAt,
      invoiceNumber: invoices.find(inv => inv._id.toString() === payment.invoiceId.toString())?.invoiceNumber
    });
  });

  const totalCheques = chequePayments.length;
  const bounceRate = totalCheques > 0 ? (totalBounceCount / totalCheques) * 100 : 0;
  const totalChequeAmount = clearedAmount + bouncedAmount + pendingAmount;

  return {
    totalCheques,
    clearedCheques: clearedCount,
    bouncedCheques: bouncedCount,
    pendingCheques: pendingCount,
    totalBounceCount,
    bounceRate: Math.round(bounceRate * 100) / 100, // round to 2 decimal places
    totalChequeAmount,
    clearedAmount,
    bouncedAmount,
    pendingAmount,
    chequeDetails
  };
}

// Calculate credit payment statistics
function calculateCreditStats(payments, invoices, customer) {
  const creditPayments = payments.filter(p => p.paymentType === "Credit");
  
  if (creditPayments.length === 0) {
    return {
      totalCredits: 0,
      paidCredits: 0,
      pendingCredits: 0,
      overdueCredits: 0,
      totalOverdueCount: 0,
      overdueRate: 0,
      creditLimit: customer.type === "wholesale" ? (customer.creditLimit || 0) : 0,
      currentCreditUsed: customer.type === "wholesale" ? (customer.currentCreditUsed || 0) : 0,
      creditAvailable: customer.type === "wholesale" ? (customer.creditAvailable || 0) : 0,
      totalCreditAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      creditDetails: []
    };
  }

  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let totalOverdueCount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  const creditDetails = [];

  creditPayments.forEach(payment => {
    const status = payment.creditDetails?.status || "Pending";
    const amount = payment.amount || 0;
    
    // Check if overdue
    const dueDate = payment.creditDetails?.dueDate;
    const isOverdue = dueDate && new Date() > new Date(dueDate) && status !== "Paid";
    
    // Count by status
    if (status === "Paid") {
      paidCount++;
      paidAmount += amount;
    } else if (isOverdue) {
      overdueCount++;
      overdueAmount += amount;
      totalOverdueCount++;
    } else {
      pendingCount++;
      pendingAmount += amount;
    }

    // Calculate days overdue
    let daysOverdue = 0;
    if (isOverdue) {
      const today = new Date();
      const due = new Date(dueDate);
      daysOverdue = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    }

    // Add to details
    creditDetails.push({
      id: payment._id,
      amount: amount,
      status: isOverdue ? "Overdue" : status,
      dueDate: dueDate,
      paidDate: payment.creditDetails?.paidDate,
      daysOverdue: daysOverdue,
      createdAt: payment.createdAt,
      invoiceNumber: invoices.find(inv => inv._id.toString() === payment.invoiceId.toString())?.invoiceNumber
    });
  });

  const totalCredits = creditPayments.length;
  const overdueRate = totalCredits > 0 ? (totalOverdueCount / totalCredits) * 100 : 0;
  const totalCreditAmount = paidAmount + pendingAmount + overdueAmount;

  return {
    totalCredits,
    paidCredits: paidCount,
    pendingCredits: pendingCount,
    overdueCredits: overdueCount,
    totalOverdueCount,
    overdueRate: Math.round(overdueRate * 100) / 100, // round to 2 decimal places
    creditLimit: customer.type === "wholesale" ? (customer.creditLimit || 0) : 0,
    currentCreditUsed: customer.type === "wholesale" ? (customer.currentCreditUsed || 0) : 0,
    creditAvailable: customer.type === "wholesale" ? (customer.creditAvailable || 0) : 0,
    totalCreditAmount,
    paidAmount,
    pendingAmount,
    overdueAmount,
    creditDetails
  };
}

// Calculate cash payment statistics
function calculateCashStats(payments, invoices) {
  const cashPayments = payments.filter(p => p.paymentType === "Cash");
  
  if (cashPayments.length === 0) {
    return {
      totalCashPayments: 0,
      totalCashAmount: 0,
      averageCashAmount: 0,
      cashDetails: []
    };
  }

  let totalCashAmount = 0;
  const cashDetails = [];

  cashPayments.forEach(payment => {
    const amount = payment.amount || 0;
    totalCashAmount += amount;

    // Add to details
    cashDetails.push({
      id: payment._id,
      amount: amount,
      status: "Completed",
      createdAt: payment.createdAt,
      invoiceNumber: invoices.find(inv => inv._id.toString() === payment.invoiceId.toString())?.invoiceNumber
    });
  });

  const averageCashAmount = cashPayments.length > 0 ? totalCashAmount / cashPayments.length : 0;

  return {
    totalCashPayments: cashPayments.length,
    totalCashAmount,
    averageCashAmount: Math.round(averageCashAmount * 100) / 100,
    cashDetails
  };
}

// Calculate card payment statistics
function calculateCardStats(payments, invoices) {
  const cardPayments = payments.filter(p => p.paymentType === "Card");
  
  if (cardPayments.length === 0) {
    return {
      totalCardPayments: 0,
      totalCardAmount: 0,
      averageCardAmount: 0,
      cardDetails: []
    };
  }

  let totalCardAmount = 0;
  const cardDetails = [];

  cardPayments.forEach(payment => {
    const amount = payment.amount || 0;
    totalCardAmount += amount;

    // Add to details
    cardDetails.push({
      id: payment._id,
      amount: amount,
      status: "Completed",
      createdAt: payment.createdAt,
      invoiceNumber: invoices.find(inv => inv._id.toString() === payment.invoiceId.toString())?.invoiceNumber
    });
  });

  const averageCardAmount = cardPayments.length > 0 ? totalCardAmount / cardPayments.length : 0;

  return {
    totalCardPayments: cardPayments.length,
    totalCardAmount,
    averageCardAmount: Math.round(averageCardAmount * 100) / 100,
    cardDetails
  };
}

module.exports = {
  getCustomerPaymentHistory
};