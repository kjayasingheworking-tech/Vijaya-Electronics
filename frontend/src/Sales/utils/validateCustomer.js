// validateCustomer.js - Customer validation utilities

export const validateCustomer = (form, { isUpdate = false } = {}) => {
  const errors = {};

  // Name validation
  if (!form.name?.trim()) {
    errors.name = "Name is required";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long";
  } else if (form.name.trim().length > 50) {
    errors.name = "Name must not exceed 50 characters";
  }

  // Email validation
  if (!form.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email.trim())) {
    errors.email = "Invalid email format";
  } else if (form.email.trim().length > 100) {
    errors.email = "Email must not exceed 100 characters";
  }

  // Phone validation
  if (!form.phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = "Phone must be exactly 10 digits";
  }

  // Address Line 1 validation
  if (!form.addressLine1?.trim()) {
    errors.addressLine1 = "Address Line 1 is required";
  } else if (form.addressLine1.trim().length > 100) {
    errors.addressLine1 = "Address Line 1 must not exceed 100 characters";
  }

  // Address Line 2 validation (optional)
  if (form.addressLine2?.trim() && form.addressLine2.trim().length > 100) {
    errors.addressLine2 = "Address Line 2 must not exceed 100 characters";
  }

  // City validation
  if (!form.city?.trim()) {
    errors.city = "City is required";
  } else if (form.city.trim().length < 2) {
    errors.city = "City must be at least 2 characters long";
  } else if (form.city.trim().length > 50) {
    errors.city = "City must not exceed 50 characters";
  }

  // Company name validation (optional for wholesale customers)
  if (form.companyName?.trim()) {
    if (form.companyName.trim().length < 2) {
      errors.companyName = "Company name must be at least 2 characters long";
    } else if (form.companyName.trim().length > 100) {
      errors.companyName = "Company name must not exceed 100 characters";
    }
  }

  // Customer type validation
  if (!form.type || !["regular", "wholesale"].includes(form.type)) {
    errors.type = "Customer type must be either 'regular' or 'wholesale'";
  }

  // Tier validation
  if (!form.tier || !["silver", "gold", "diamond"].includes(form.tier)) {
    errors.tier = "Customer tier must be 'silver', 'gold', or 'diamond'";
  }

  // Credit limit validation (for wholesale customers)
  if (form.type === "wholesale") {
    if (form.creditLimit === undefined || form.creditLimit === null) {
      errors.creditLimit = "Credit limit is required for wholesale customers";
    } else if (typeof form.creditLimit !== "number" || form.creditLimit < 0) {
      errors.creditLimit = "Credit limit must be a non-negative number";
    } else if (form.creditLimit > 1000000) {
      errors.creditLimit = "Credit limit cannot exceed Rs. 1,000,000";
    }
  }

  // Points validation
  if (form.pointsBalance !== undefined && form.pointsBalance !== null) {
    if (typeof form.pointsBalance !== "number" || form.pointsBalance < 0) {
      errors.pointsBalance = "Points balance must be a non-negative number";
    }
  }

  if (form.totalPointsEarned !== undefined && form.totalPointsEarned !== null) {
    if (typeof form.totalPointsEarned !== "number" || form.totalPointsEarned < 0) {
      errors.totalPointsEarned = "Total points earned must be a non-negative number";
    }
  }

  if (form.totalPointsRedeemed !== undefined && form.totalPointsRedeemed !== null) {
    if (typeof form.totalPointsRedeemed !== "number" || form.totalPointsRedeemed < 0) {
      errors.totalPointsRedeemed = "Total points redeemed must be a non-negative number";
    }
  }

  if (form.totalPurchaseAmount !== undefined && form.totalPurchaseAmount !== null) {
    if (typeof form.totalPurchaseAmount !== "number" || form.totalPurchaseAmount < 0) {
      errors.totalPurchaseAmount = "Total purchase amount must be a non-negative number";
    }
  }

  // Simple validation - no complex cross-field checks for now

  return errors;
};

// Validate individual field (useful for real-time validation)
export const validateCustomerField = (field, value, form = {}) => {
  const tempForm = { ...form, [field]: value };
  const errors = validateCustomer(tempForm);
  return errors[field] || "";
};

// Validate phone number format
export const validatePhoneNumber = (phone) => {
  if (!phone?.trim()) return "Phone number is required";
  if (!/^\d{10}$/.test(phone.trim())) return "Phone must be exactly 10 digits";
  return "";
};

// Validate email format
export const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required";
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())) {
    return "Invalid email format";
  }
  return "";
};

// Validate credit limit for wholesale customers
export const validateCreditLimit = (creditLimit, customerType) => {
  if (customerType === "wholesale") {
    if (creditLimit === undefined || creditLimit === null) {
      return "Credit limit is required for wholesale customers";
    }
    if (typeof creditLimit !== "number" || creditLimit < 0) {
      return "Credit limit must be a non-negative number";
    }
    if (creditLimit > 1000000) {
      return "Credit limit cannot exceed Rs. 1,000,000";
    }
  }
  return "";
};

// Clean form data before sending to server
export const sanitizeCustomerForm = (form) => {
  // Create a new object with cleaned data
  const cleanForm = {
    name: form.name ? form.name.trim() : "",
    email: form.email ? form.email.trim().toLowerCase() : "",
    phone: form.phone ? form.phone.trim() : "",
    addressLine1: form.addressLine1 ? form.addressLine1.trim() : "",
    addressLine2: form.addressLine2 ? form.addressLine2.trim() : "",
    city: form.city ? form.city.trim() : "",
    companyName: form.companyName ? form.companyName.trim() : "",
    type: form.type || "regular",
    tier: form.tier || "silver",
    creditLimit: 0,
    pointsBalance: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    totalPurchaseAmount: 0,
    blocked: false
  };

  // Set numbers properly
  if (typeof form.creditLimit === "number") {
    cleanForm.creditLimit = form.creditLimit;
  }
  if (typeof form.pointsBalance === "number") {
    cleanForm.pointsBalance = form.pointsBalance;
  }
  if (typeof form.totalPointsEarned === "number") {
    cleanForm.totalPointsEarned = form.totalPointsEarned;
  }
  if (typeof form.totalPointsRedeemed === "number") {
    cleanForm.totalPointsRedeemed = form.totalPointsRedeemed;
  }
  if (typeof form.totalPurchaseAmount === "number") {
    cleanForm.totalPurchaseAmount = form.totalPurchaseAmount;
  }
  if (form.blocked === true) {
    cleanForm.blocked = true;
  }

  return cleanForm;
};

export default validateCustomer;
