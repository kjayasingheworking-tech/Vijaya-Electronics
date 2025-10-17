const Payment = require("../models/PaymentModel.js");
const Customer = require("../models/CustomerModel.js");
const { updateChequeStatus, updateCreditStatus } = require("../services/chequeService.js");
const { prepareCheckout, completeCheckout } = require("../services/paymentService.js");

// Store prepared checkout data temporarily (in production, use Redis or database)
const checkoutSessions = new Map();

// Original payment functions
const preparePayment = async (req, res, next) => {
  try {
    const { customerId, discountPercent, discountAmount, discountType, discountDescription, discountId, pointsToRedeem, selectedItemIds } = req.body;
    
    const checkoutData = await prepareCheckout({
      customerId,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      discountType: discountType || "Percentage",
      discountDescription: discountDescription || "",
      discountId: discountId || null,
      pointsToRedeem: pointsToRedeem || 0,
      conversionRateForPoints: 1,
      selectedItemIds 
    });

    // Generate session ID and store checkout data
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    checkoutSessions.set(sessionId, checkoutData);

    // Return session ID and checkout summary
    res.json({
      sessionId,
      totalAmount: checkoutData.amountAfterDiscount,
      customerName: checkoutData.customer.name,
      itemsCount: checkoutData.items.length
    });
  } catch (err) {
    next(err);
  }
};

const completePayment = async (req, res, next) => {
  try {
    const { sessionId, paymentMethod, paymentDetails } = req.body;
    
    // Retrieve checkout data
    const checkoutData = checkoutSessions.get(sessionId);
    if (!checkoutData) {
      return res.status(404).json({ message: "Checkout session not found or expired" });
    }

    // Complete the checkout
    const result = await completeCheckout({
      ...checkoutData,
      paymentMethod,
      paymentDetails
    });

    // Clean up session
    checkoutSessions.delete(sessionId);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const cancelPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    // Remove session data
    checkoutSessions.delete(sessionId);
    
    res.json({ message: "Payment session cancelled" });
  } catch (err) {
    next(err);
  }
};

// Get all credit payments
const getCreditPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ paymentType: "Credit" })
      .populate({
        path: 'customerId',
        populate: {
          path: 'user',
          select: 'name email role isActive'
        }
      })
      .populate('invoiceId', 'invoiceNumber status')
      .sort({ createdAt: -1 });

    // Transform data for frontend
    const transformedPayments = payments.map(payment => ({
      _id: payment._id,
      customer: payment.customerId,
      invoice: payment.invoiceId,
      amount: payment.amount,
      creditDetails: payment.creditDetails,
      createdAt: payment.createdAt
    }));

    res.json(transformedPayments);
  } catch (err) {
    next(err);
  }
};

// Get all cheque payments
const getChequePayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ paymentType: "Cheque" })
      .populate({
        path: 'customerId',
        populate: {
          path: 'user',
          select: 'name email role isActive'
        }
      })
      .populate('invoiceId', 'invoiceNumber status')
      .sort({ createdAt: -1 });

    // Transform data for frontend
    const transformedPayments = payments.map(payment => ({
      _id: payment._id,
      customer: payment.customerId,
      invoice: payment.invoiceId,
      amount: payment.amount,
      chequeDetails: payment.chequeDetails,
      createdAt: payment.createdAt
    }));

    res.json(transformedPayments);
  } catch (err) {
    next(err);
  }
};

// Update credit payment status
const updateCreditPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Paid", "Pending", "Overdue"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await updateCreditStatus(id, status, new Date().toISOString());

    res.json({
      message: `Credit payment marked as ${status}`,
      payment
    });
  } catch (err) {
    next(err);
  }
};

// Update cheque payment status
const updateChequePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, clearedDate, bouncedReason } = req.body;

    if (!["Cleared", "Pending", "Bounced"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await updateChequeStatus(id, status, clearedDate, bouncedReason);

    res.json({
      message: `Cheque payment marked as ${status}`,
      payment
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  preparePayment,
  completePayment,
  cancelPayment,
  getCreditPayments,
  getChequePayments,
  updateCreditPaymentStatus,
  updateChequePaymentStatus
};