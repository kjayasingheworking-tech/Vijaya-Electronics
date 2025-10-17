const Customer = require("../models/CustomerModel.js");

/**
 * Helper function to find or create a customer record
 * Handles both Customer ID and User ID lookups
 * Automatically creates Sales Customer record if user exists in main User collection
 * Returns the Sales Customer record
 */
async function findOrCreateCustomer(customerId) {
  // First try to find by Customer ID
  let customer = await Customer.findById(customerId);
  
  // If not found by Customer ID, try to find by User ID
  if (!customer) {
    customer = await Customer.findOne({ user: customerId });
  }
  
  // If still not found, try to create a customer record for the user
  if (!customer) {
    // Try to find user in main User collection first
    const MainUser = require("../../models/User.js");
    const mainUser = await MainUser.findById(customerId);
    
    if (mainUser && mainUser.role === 'customer') {
      // Create a corresponding user in Sales UserTemp collection
      const SalesUser = require("../models/UserModel.js");
      let salesUser = await SalesUser.findOne({ email: mainUser.email });
      
      if (!salesUser) {
        // Create sales user
        salesUser = new SalesUser({
          name: mainUser.name,
          email: mainUser.email,
          role: mainUser.role,
          isActive: mainUser.isActive || true
        });
        await salesUser.save();
      }
      
      // Create Sales Customer record with proper data
      const customerData = {
        user: salesUser._id,
        name: mainUser.name || 'Unknown Customer',
        email: mainUser.email || 'No email provided',
        type: 'regular', // default to regular customer
        tier: 'silver'
      };
      
      customer = new Customer(customerData);
      await customer.save();
    }
  }
  
  return customer;
}

/**
 * Helper function to get Sales Customer ID from main User ID
 * This is the main function that should be used by the frontend
 */
async function getSalesCustomerId(mainUserId) {
  const customer = await findOrCreateCustomer(mainUserId);
  return customer ? customer._id : null;
}

/**
 * Helper function to ensure customer data is properly populated
 * Fetches fresh data from linked user if needed
 */
async function ensureCustomerDataPopulated(customer) {
  if (!customer) return customer;
  
  // If customer data is missing, try to fetch from the linked user
  if (!customer.name || !customer.email) {
    try {
      // Populate the user field to get fresh data
      await customer.populate('user', 'name email');
      if (customer.user) {
        customer.name = customer.user.name || customer.name || 'Unknown Customer';
        customer.email = customer.user.email || customer.email || 'No email provided';
        await customer.save(); // Save the updated data
      }
    } catch (error) {
      console.warn('Could not populate user data for customer:', error.message);
    }
  }
  
  return customer;
}

module.exports = { findOrCreateCustomer, getSalesCustomerId, ensureCustomerDataPopulated };
