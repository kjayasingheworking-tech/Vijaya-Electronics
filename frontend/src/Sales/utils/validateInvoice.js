import { validateQuantity, getStockStatus } from './validation';

// validate create invoice form
export const validateInvoice = (invoiceForm) => {
  const errors = {};

  // Customer name required
  if (!invoiceForm.customerName?.trim()) {
    errors.customerName = "*Customer name is required.";
  }

  // Customer email format
  if (invoiceForm.customerEmail?.trim()) {
    if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(invoiceForm.customerEmail)
    ) {
      errors.customerEmail = "*Invalid email format.";
    }
  }

  // Customer phone number format
  if (invoiceForm.customerPhone?.trim()) {
    const phoneNum = /^\d{10}$/;
    if (!phoneNum.test(invoiceForm.customerPhone)) {
      errors.customerPhone = "*Phone number must be a 10-digit number.";
    }
  }

  // Payment method
  if (!invoiceForm.paymentMethod) {
    errors.paymentMethod = "*Please select a payment method.";
  }

  // Cheque validation - only if payment method is Cheque
  if (invoiceForm.paymentMethod === "Cheque") {
    if (!invoiceForm.chequeDetails?.chequeNumber?.trim()) {
      errors.chequeNumber = "*Cheque number is required.";
    }
    if (!invoiceForm.chequeDetails?.bank?.trim()) {
      errors.bank = "*Bank name is required.";
    }
    if (!invoiceForm.chequeDetails?.amount || invoiceForm.chequeDetails.amount <= 0) {
      errors.chequeAmount = "*Cheque amount must be greater than 0.";
    }
    if (!invoiceForm.chequeDetails?.issueDate?.trim()) {
      errors.issueDate = "*Issue date is required.";
    }
  }

  // Items
  if (!invoiceForm.items || !invoiceForm.items.length) {
    // If no items, return a single error in the array
    errors.items = ["*At least one item is required."];
  } else {
    const itemsErrors = invoiceForm.items.map((item, index) => {
      if (!item.name) return `*Item ${index + 1}: Name is required.`;
      if (!item.price || item.price <= 0) return `*Item ${index + 1}: Price must be greater than 0.`;
      if (!item.quantity || item.quantity <= 0) return `*Item ${index + 1}: Quantity must be at least 1.`;
      
      // Product quantity validation using centralized validation
      if (item.product) {
        const quantityValidation = validateQuantity(item.quantity || 0, item.product);
        if (!quantityValidation.isValid) {
          return `*Item ${index + 1}: ${quantityValidation.message}`;
        }
      }
      
      return null; // no error for this item
    });

    // Only set errors.items if there are actual item errors
    if (itemsErrors.some(msg => msg)) {
      errors.items = itemsErrors.filter(msg => msg);
    }
  }

  return errors;
};

/**
 * Gets stock status information for invoice items
 * @param {Array} items - array of invoice items
 * @returns {Array} array of stock status information for each item
 */
export const getInvoiceItemsStockStatus = (items) => {
  if (!items || !items.length) return [];
  
  return items.map(item => {
    const stockStatus = getStockStatus(item.product || item);
    return {
      ...item,
      stockStatus,
      hasStockIssues: stockStatus.statusType === 'error'
    };
  });
};

/**
 * Validates if all invoice items have sufficient stock
 * @param {Array} items - array of invoice items
 * @returns {Object} validation result with isValid boolean and invalidItems array
 */
export const validateInvoiceStock = (items) => {
  if (!items || !items.length) {
    return { isValid: true, invalidItems: [] };
  }
  
  const invalidItems = [];
  
  items.forEach((item, index) => {
    if (item.product) {
      const quantityValidation = validateQuantity(item.quantity || 0, item.product);
      if (!quantityValidation.isValid) {
        invalidItems.push({
          index,
          itemName: item.name || 'Unknown Item',
          requestedQuantity: item.quantity || 0,
          availableStock: item.product.quantity || 0,
          message: quantityValidation.message,
          isOutOfStock: quantityValidation.isOutOfStock,
          quantityExceedsStock: quantityValidation.quantityExceedsStock
        });
      }
    }
  });
  
  return {
    isValid: invalidItems.length === 0,
    invalidItems,
    hasStockIssues: invalidItems.length > 0
  };
};

export const validateInvoiceForm = validateInvoice;
