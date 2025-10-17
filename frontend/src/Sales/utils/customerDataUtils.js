// Utility functions for handling customer data with user information

/**
 * Get customer display data with proper user information fallback
 * @param {Object} customer - Customer object with populated user data
 * @returns {Object} Customer display data with user information
 */
export const getCustomerDisplayData = (customer) => {
  if (!customer) return { name: "N/A", email: "N/A", phone: "N/A" };
  
  // Customer data should include populated user data from backend
  const userData = customer.user || {};
  
  return {
    ...customer,
    // Use user data if available, otherwise fallback to customer data, then "N/A"
    name: userData.name || customer.name || "N/A",
    email: userData.email || customer.email || "N/A", 
    phone: customer.phone || "N/A", // Phone is typically stored in customer data
  };
};

/**
 * Get customer name with user information fallback
 * @param {Object} customer - Customer object with populated user data
 * @returns {string} Customer name
 */
export const getCustomerName = (customer) => {
  if (!customer) return "N/A";
  const userData = customer.user || {};
  return userData.name || customer.name || "N/A";
};

/**
 * Get customer email with user information fallback
 * @param {Object} customer - Customer object with populated user data
 * @returns {string} Customer email
 */
export const getCustomerEmail = (customer) => {
  if (!customer) return "N/A";
  const userData = customer.user || {};
  return userData.email || customer.email || "N/A";
};

/**
 * Get customer phone (typically stored in customer data)
 * @param {Object} customer - Customer object
 * @returns {string} Customer phone
 */
export const getCustomerPhone = (customer) => {
  if (!customer) return "N/A";
  return customer.phone || "N/A";
};
