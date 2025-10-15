const Invoice = require("../models/InvoiceModel.js");
const Customer = require("../models/CustomerModel.js");
const Payment = require("../models/PaymentModel.js");
const Product = require("../models/ProductModel.js");
const { calculatePointsToAward, awardPoints, redeemPoints } = require("./pointsService.js");
const { updateCustomerCredit } = require("./creditService.js");
const { updateCustomerTier } = require("./tierService.js");
const { createChequePayment, createCreditPayment } = require("./chequeService.js");

/**
 * Reduce product quantities when invoice is created
 * @param {Array} items - array of { productId, quantity }
 */
async function reduceProductQuantities(items) {
  try {
    
    for (const item of items) {
      
      let product = null;
      
      // Try to find product by ID first
      if (item.productId) {
        product = await Product.findById(item.productId);
      }
      
      // If not found by ID, try to find by name
      if (!product && item.name) {
        product = await Product.findOne({ productName: item.name });
      }
      
      if (product) {
        // Reduce quantity
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
      } else {
        console.warn(`Product not found for item: ${item.name || item.productId}`);
      }
    }
  } catch (error) {
    console.error("Error reducing product quantities:", error);
    throw error;
  }
}

/**
 * Create invoice
 * @param {Object} data - invoice data
 * @param {ObjectId} data.customerId - optional if existing customer
 * @param {String} data.customerSnapshot - snapshot for regular customer
 * @param {Array} data.items - array of { productId, name, unitPrice, quantity }
 * @param {Number} data.discountPercent
 * @param {String} data.paymentMethod
 * @param {Object} data.paymentDetails
 * @param {String} data.status - Paid / Pending
 */
async function createInvoice(data) {
  
  // Check if customer has pending invoices (for wholesale customers)
  if (data.customerId) {
    const Customer = require("../models/CustomerModel.js");
    const customer = await Customer.findById(data.customerId);
    
    if ((customer && customer.type === "wholesale") && (data.paymentMethod === "Credit" || data.paymentMethod === "Cheque")) {
      const existingPendingInvoices = await Invoice.find({
        customerId: data.customerId,
        status: "Pending"
      });
      
      if (existingPendingInvoices.length > 0) {
        throw new Error("Cannot create new invoice. Customer has existing pending invoices. Please wait for pending invoices to be processed first.");
      }
    }
  }
  
  const invoiceNumber = `INV-${Date.now()}`;

  const invoice = new Invoice({
    invoiceNumber,
    customerId: data.customerId || null,
    customerSnapshot: data.customerSnapshot || {},
    items: data.items,
    subtotal: data.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    discountId: data.discountId || null,
    discountType: data.discountType || "Percentage",
    discountPercent: data.discountPercent || 0,
    discountAmount: data.discountAmount || 0,
    discountDescription: data.discountDescription || "",
    totalAmount: data.totalAmount || 0,
    paymentMethod: data.paymentMethod,
    paymentDetails: data.paymentDetails || {},
    status: data.status || "Pending",
    statusUpdatedAt: new Date(),
    pointsRedeemed: data.pointsRedeemed || 0,
    pointsAwarded: data.pointsAwarded || 0,
  });

  await invoice.save();

  // Reduce product quantities
  await reduceProductQuantities(data.items);

  // Create payment record for all customers (both registered and regular)
  if (invoice.customerId || invoice.customerSnapshot) {
    // Ensure totalAmount is properly set
    const paymentAmount = invoice.totalAmount || 0;
    
    const paymentData = {
      customerId: invoice.customerId || null, // null for regular customers
      invoiceId: invoice._id,
      paymentType: invoice.paymentMethod || "Cash",
      amount: paymentAmount,
      // Store customer info for regular customers
      customerSnapshot: invoice.customerSnapshot || null
    };

    // Create payment record based on payment method
    let paymentRecord = null;
    
    if (invoice.paymentMethod === "Cheque" && invoice.paymentDetails) {
      // Create cheque payment
      paymentRecord = await createChequePayment(
        invoice.customerId,
        invoice._id,
        invoice.paymentDetails,
        invoice.totalAmount
      );
    } else if (invoice.paymentMethod === "Credit") {
      // Create credit payment
      paymentRecord = await createCreditPayment(
        invoice.customerId,
        invoice._id,
        invoice.totalAmount
      );
    } else {
      // Create regular payment record
      paymentRecord = new Payment(paymentData);
      await paymentRecord.save();
    }

    // Block customer during cheque processing (if applicable)
    if (invoice.paymentMethod === "Cheque") {
      const customer = await Customer.findById(invoice.customerId);
      if (customer && customer.type === "wholesale") {
        customer.blocked = true;
        await customer.save();
      }
    }
  }

  // Redeem points if customer exists and points were used
  if (invoice.customerId && invoice.pointsRedeemed > 0) {
    await redeemPoints(invoice.customerId, invoice.pointsRedeemed);
  }

  // Recalculate total defensively in case inputs changed
  const rawSubtotal = invoice.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  let finalDiscountAmount = 0;
  
  if (invoice.discountType === "Percentage") {
    finalDiscountAmount = (invoice.discountPercent || 0) / 100 * rawSubtotal;
  } else if (invoice.discountType === "Amount") {
    finalDiscountAmount = invoice.discountAmount || 0;
  }
  
  const pointsDiscount = invoice.pointsRedeemed || 0;
  invoice.discountAmount = finalDiscountAmount;
  invoice.totalAmount = Math.max(0, rawSubtotal - finalDiscountAmount - pointsDiscount);
  await invoice.save();

  // Award points only if there is an existing customer
  if (invoice.customerId) {
    const { points } = await calculatePointsToAward(invoice.customerId, invoice.totalAmount);
    invoice.pointsAwarded = points;
    await invoice.save();
    await awardPoints(invoice.customerId, points);
    
    // Update customer's total purchase amount
    const customer = await Customer.findById(invoice.customerId);
    if (customer) {
      customer.totalPurchaseAmount = (customer.totalPurchaseAmount || 0) + invoice.totalAmount;
      await customer.save();
      
      // Update customer tier based on new purchase amount
      await updateCustomerTier(invoice.customerId);
    }
    
    // Mark discount as claimed if a discount was used
    if (invoice.discountId) {
      if (customer && !customer.claimedDiscounts.includes(invoice.discountId)) {
        customer.claimedDiscounts.push(invoice.discountId);
        await customer.save();
      }
    }
    
    // Update customer credit information for wholesale customers
    if (customer && customer.type === "wholesale") {
      await updateCustomerCredit(invoice.customerId);
    }
  }
  return invoice;
}

//Get all invoices
async function getInvoices(filter = {}) {
  return Invoice.find(filter).sort({ createdAt: -1 });
}

//Get invoice by ID
async function getInvoiceById(id) {
  return Invoice.findById(id);
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById
};
