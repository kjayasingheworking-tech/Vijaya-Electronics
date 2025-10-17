const Discount = require("../models/DiscountModel.js");
const Customer = require("../models/CustomerModel.js");
const { notifyNewDiscount, notifyAllSalesManagers, notifyDiscountEnd } = require("../services/notificationService.js");
const { findOrCreateCustomer } = require("../utils/customerHelper.js");

function normalizeDayBounds(startDate, endDate) {
  // Handle both string dates (YYYY-MM-DD) and Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we're working with the correct day boundaries
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function computeStatus(startDate, endDate) {
  const { start, end } = normalizeDayBounds(startDate, endDate);
  const now = new Date();
  
  if (now > end) return "Expired";
  if (now < start) return "Upcoming";
  return "Active";
}

// Get all discounts
const getDiscounts = async (req, res, next) => {
  try {
    // Update status automatically before sending
    const discounts = await Discount.find();
    discounts.forEach(d => {
      d.status = computeStatus(d.startDate, d.endDate);
    });
    await Promise.all(discounts.map(d => d.save()));
    res.json(discounts);
  } catch (err) {
    next(err);
  }
};

// Get discount by ID
const getDiscountById = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });

    // Auto-update status with normalized day bounds
    discount.status = computeStatus(discount.startDate, discount.endDate);
    await discount.save();

    res.json(discount);
  } catch (err) {
    next(err);
  }
};

// Create discount
const createDiscount = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.startDate && payload.endDate) {
      payload.status = computeStatus(new Date(payload.startDate), new Date(payload.endDate));
    }
    const discount = new Discount(payload);
    await discount.save();

    // Send notifications for new discount
    try {
      // Notify all customers about new discount
      const customers = await Customer.find({});
      const notificationPromises = customers.map(customer => 
        notifyNewDiscount(customer._id, {
          discountId: discount._id,
          discountCode: discount.code,
          discountName: discount.name,
          discountPercentage: discount.percentage,
          validUntil: discount.endDate
        })
      );
      await Promise.all(notificationPromises);

      // Notify all sales managers about discount start
      await notifyAllSalesManagers(
        'info',
        'Discount Started',
        `Discount "${discount.name}" (${discount.code}) with ${discount.percentage}% off has started. Valid until ${discount.endDate}`,
        {
          relatedEntity: 'discount',
          relatedEntityId: discount._id,
          discountName: discount.name,
          discountCode: discount.code,
          discountPercentage: discount.percentage,
          validUntil: discount.endDate
        }
      );
    } catch (notificationError) {
      console.error("Error sending discount notifications:", notificationError);
      // Don't fail the discount creation if notifications fail
    }

    res.status(201).json(discount);
  } catch (err) {
    console.error("Discount creation error:", err);
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key error (unique constraint)
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Discount code already exists. Please use a different code." 
      });
    }
    
    next(err);
  }
};

// Update discount
const updateDiscount = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    // If dates provided (or already exist), recompute status
    if (payload.startDate || payload.endDate) {
      const existing = await Discount.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Discount not found" });
      const start = payload.startDate ? new Date(payload.startDate) : existing.startDate;
      const end = payload.endDate ? new Date(payload.endDate) : existing.endDate;
      payload.status = computeStatus(start, end);
    }
    const discount = await Discount.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    res.json(discount);
  } catch (err) {
    next(err);
  }
};

// Delete discount
const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) return res.status(404).json({ message: "Discount not found" });
    res.json({ message: "Discount deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Redeem discount code (validate only - don't mark as claimed yet)
const redeemDiscount = async (req, res, next) => {
  try {
    const { code, customerTier, customerId } = req.body;
    
    // Find the discount by code
    const discount = await Discount.findOne({ code });
    if (!discount) return res.status(404).json({ message: "Discount code not found" });

    // Check if customer ID is provided
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // Find the customer using helper function
    const customer = await findOrCreateCustomer(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if customer has already claimed this discount
    if (customer.claimedDiscounts.includes(discount._id)) {
      return res.status(400).json({ message: "You have already claimed this discount" });
    }

    // Check discount validity using existing normalizeDayBounds function
    const { start, end } = normalizeDayBounds(discount.startDate, discount.endDate);
    const now = new Date();
    
    if (now < start) return res.status(400).json({ message: "Discount not started yet" });
    if (now > end) return res.status(400).json({ message: "Discount expired" });
    
    // Check customer tier eligibility
    const normalizedTier = (customerTier || customer.tier || '').toLowerCase();
    const allowed = (discount.validCustomerTiers || []).map(t => (t || '').toLowerCase());
    if (!allowed.includes(normalizedTier)) return res.status(400).json({ message: "Not valid for your tier" });

    // Just return the discount without marking as claimed
    // The discount will be marked as claimed only when the order is completed
    res.json({ message: "Discount is valid", discount });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  redeemDiscount
};
