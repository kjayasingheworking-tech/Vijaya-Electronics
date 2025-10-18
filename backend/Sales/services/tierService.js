const Customer = require("../models/CustomerModel.js");
const { findOrCreateCustomer } = require("../utils/customerHelper.js");

// Calculate customer tier based on total purchase amount
function calculateCustomerTier(customerType, totalPurchaseAmount) {
  if (customerType === "regular") {
    // Regular customer tier thresholds
    if (totalPurchaseAmount >= 400000) {
      return "diamond";
    } else if (totalPurchaseAmount >= 200000) {
      return "gold";
    } else {
      return "silver";
    }
  } else if (customerType === "wholesale") {
    // Wholesale customer tier thresholds
    if (totalPurchaseAmount >= 1000000) {
      return "diamond";
    } else if (totalPurchaseAmount >= 500100) {
      return "gold";
    } else {
      return "silver";
    }
  }
  
  // Default to silver if type is unknown
  return "silver";
}

// Update customer tier based on current purchase amount
async function updateCustomerTier(customerId) {
  try {
    const customer = await findOrCreateCustomer(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const currentTier = calculateCustomerTier(customer.type, customer.totalPurchaseAmount || 0);
    
    // Only update if tier has changed
    if (customer.tier !== currentTier) {
      customer.tier = currentTier;
      await customer.save();
    }

    return customer;
  } catch (error) {
    console.error("Error updating customer tier:", error);
    throw error;
  }
}

module.exports = {
  calculateCustomerTier,
  updateCustomerTier
};
