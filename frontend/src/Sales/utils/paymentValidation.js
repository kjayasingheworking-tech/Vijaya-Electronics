// Payment validation utilities
export const validateCardNumber = (cardNumber) => {
  // Remove spaces and check if it's a valid card number
  const cleaned = cardNumber.replace(/\s/g, "");
  
  // Check if it's 16 digits
  if (cleaned.length !== 16) {
    return { isValid: false, error: "Card number must be 16 digits" };
  }
  
  // Check if it contains only digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "Card number must contain only digits" };
  }
  
  // Simple validation - card number cannot start with 0
  if (cleaned.startsWith("0")) {
    return { isValid: false, error: "Card number cannot start with 0" };
  }
  
  return { isValid: true };
};

export const validateExpiryDate = (expiryDate) => {
  // Check format MM/YY
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return { isValid: false, error: "Expiry date must be in MM/YY format" };
  }
  
  const [month, year] = expiryDate.split("/");
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Check month range
  if (monthNum < 1 || monthNum > 12) {
    return { isValid: false, error: "Invalid month" };
  }
  
  // Check if card is expired
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
  const currentMonth = currentDate.getMonth() + 1;
  
  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return { isValid: false, error: "Card has expired" };
  }
  
  return { isValid: true };
};

export const validateCVV = (cvv) => {
  // Check if CVV is 3 or 4 digits
  if (!/^\d{3,4}$/.test(cvv)) {
    return { isValid: false, error: "CVV must be 3 or 4 digits" };
  }
  
  return { isValid: true };
};

export const validateCardholderName = (name) => {
  // Check if name is not empty and contains only letters and spaces
  if (!name.trim()) {
    return { isValid: false, error: "Cardholder name is required" };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return { isValid: false, error: "Cardholder name must contain only letters and spaces" };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: "Cardholder name must be at least 2 characters" };
  }
  
  return { isValid: true };
};

export const validatePaymentForm = (cardDetails) => {
  const errors = {};
  
  // Validate card number
  const cardNumberValidation = validateCardNumber(cardDetails.cardNumber);
  if (!cardNumberValidation.isValid) {
    errors.cardNumber = cardNumberValidation.error;
  }
  
  // Validate expiry date
  const expiryValidation = validateExpiryDate(cardDetails.expiryDate);
  if (!expiryValidation.isValid) {
    errors.expiryDate = expiryValidation.error;
  }
  
  // Validate CVV
  const cvvValidation = validateCVV(cardDetails.cvv);
  if (!cvvValidation.isValid) {
    errors.cvv = cvvValidation.error;
  }
  
  // Validate cardholder name
  const nameValidation = validateCardholderName(cardDetails.cardholderName);
  if (!nameValidation.isValid) {
    errors.cardholderName = nameValidation.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};


// Format card number with spaces
export const formatCardNumber = (value) => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, "");
  
  // Limit to 16 digits
  const limited = cleaned.slice(0, 16);
  
  // Add spaces every 4 digits
  return limited.replace(/(.{4})/g, "$1 ").trim();
};

// Format expiry date as MM/YY
export const formatExpiryDate = (value) => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, "");
  
  // Limit to 4 digits
  const limited = cleaned.slice(0, 4);
  
  // Add slash after 2 digits
  if (limited.length >= 2) {
    return limited.slice(0, 2) + "/" + limited.slice(2);
  }
  
  return limited;
};

// Format CVV (limit to 4 digits)
export const formatCVV = (value) => {
  // Remove all non-digits and limit to 4
  return value.replace(/\D/g, "").slice(0, 4);
};

// Get card type from card number
export const getCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, "");
  
  // Simple card type detection
  if (cleaned.startsWith("4")) {
    return "Visa";
  } else if (cleaned.startsWith("5")) {
    return "Mastercard";
  } else if (cleaned.startsWith("3")) {
    return "American Express";
  }
    
  return "";
};
