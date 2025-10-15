export const minTotal = 1000;

/**
 * Validates customer account status
 * @param {Object} customer - customer object
 * @returns {string} error message or empty string if valid
 */
export function validateCustomerAccount(customer) {
  if (!customer) {
    return "Customer not found";
  }
  
  if (customer.blocked) {
    return "Your account is blocked and you cannot place orders. Please contact support.";
  }
  
  return ""; // valid
}

/**
 * Validates discount code format
 * @param {string} discountCode - discount code entered by user
 * @returns {string} error message or empty string if valid
 */
export function validateDiscountCode(discountCode) {
  if (!discountCode || discountCode.trim() === "") {
    return "Please enter a discount code";
  }
  
  if (discountCode.length < 3) {
    return "Discount code must be at least 3 characters";
  }
  
  if (discountCode.length > 20) {
    return "Discount code cannot exceed 20 characters";
  }
  
  return ""; // valid
}

/**
 * Validates points redemption
 * @param {number} pointsToRedeem - points user wants to redeem
 * @param {number} pointsBalance - customer's current points
 * @param {number} subTotal - cart subtotal amount
 * @param {number} discount - total after applying discounts
 * @returns {string} error message or empty string if valid
 */
export function validateRedeemPoints(pointsToRedeem, pointsBalance, subTotal, discount) {
  if (pointsToRedeem > pointsBalance) {
    return `You only have ${pointsBalance} points. Please enter a valid amount`;
  }
  if (pointsToRedeem < 0) {
    return "Points cannot be negative";
  }
  if (pointsToRedeem > subTotal) {
    return "Points to redeem cannot exceed Cart Subtotal";
  }
  if ((subTotal - discount - pointsToRedeem) < minTotal) {
    return `Total after redeem must be at least Rs.${minTotal}.`;
  }
  return ""; // valid
}

/**
 * Validates if a quantity is valid for a product
 * @param {number} quantity - quantity to validate
 * @param {Object} product - product object with quantity property
 * @returns {Object} validation result with isValid boolean and message
 */
export function validateQuantity(quantity, product) {
  const availableStock = product?.quantity || 0;
  
  if (quantity <= 0) {
    return {
      isValid: false,
      message: "Quantity must be greater than 0",
      isOutOfStock: false,
      quantityExceedsStock: false
    };
  }
  
  if (availableStock === 0) {
    return {
      isValid: false,
      message: "Product is out of stock",
      isOutOfStock: true,
      quantityExceedsStock: false
    };
  }
  
  if (quantity > availableStock) {
    return {
      isValid: false,
      message: `Cannot add more than ${availableStock} items. Only ${availableStock} available in stock.`,
      isOutOfStock: false,
      quantityExceedsStock: true
    };
  }
  
  return {
    isValid: true,
    message: "",
    isOutOfStock: false,
    quantityExceedsStock: false
  };
}

/**
 * Validates cart items against available stock
 * @param {Array} cartItems - array of cart items
 * @returns {Object} validation result with isValid boolean, invalidItems array, and summary message
 */
export function validateCartStock(cartItems) {
  const invalidItems = [];
  
  for (const item of cartItems) {
    const availableStock = item.productId?.quantity || 0;
    const isOutOfStock = availableStock === 0;
    const quantityExceedsStock = item.quantity > availableStock;
    
    if (isOutOfStock || quantityExceedsStock) {
      const itemName = item.name || item.productId?.productName || 'Unknown Item';
      invalidItems.push({
        itemName,
        requestedQuantity: item.quantity,
        availableStock,
        isOutOfStock,
        quantityExceedsStock,
        message: isOutOfStock 
          ? `${itemName}: Out of Stock` 
          : `${itemName}: requested ${item.quantity}, available ${availableStock}`
      });
    }
  }
  
  const isValid = invalidItems.length === 0;
  const summaryMessage = isValid 
    ? "" 
    : `Cannot proceed with checkout. Quantity exceeds available stock for:\n${invalidItems.map(item => item.message).join('\n')}`;
  
  return {
    isValid,
    invalidItems,
    summaryMessage,
    hasStockIssues: invalidItems.length > 0
  };
}

/**
 * Gets stock status information for display
 * @param {Object} item - cart item or product
 * @returns {Object} stock status information
 */
export function getStockStatus(item) {
  const availableStock = item.productId?.quantity || item.quantity || 0;
  const currentQuantity = item.quantity || 1;
  
  const isOutOfStock = availableStock === 0;
  const quantityExceedsStock = currentQuantity > availableStock;
  
  let statusMessage = "";
  let statusType = "success"; // success, warning, error
  
  if (isOutOfStock) {
    statusMessage = "Out of Stock";
    statusType = "error";
  } else if (quantityExceedsStock) {
    statusMessage = `Only ${availableStock} available`;
    statusType = "error";
  } else {
    statusMessage = `${availableStock} in stock`;
    statusType = "success";
  }
  
  return {
    availableStock,
    isOutOfStock,
    quantityExceedsStock,
    statusMessage,
    statusType
  };
}
