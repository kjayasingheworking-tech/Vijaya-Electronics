const Cart = require("../models/CartModel.js");
const Customer = require("../models/CustomerModel.js");
const Product = require("../models/ProductModel.js");
const { redeemPoints } = require("./pointsService.js");
const { createInvoice } = require("./invoiceService.js");
const { findOrCreateCustomer, ensureCustomerDataPopulated } = require("../utils/customerHelper.js");

async function processCheckout({
  customerId,
  paymentMethod,
  paymentDetails = {},
  discountPercent = 0,
  discountAmount = 0,
  discountType = "Percentage",
  discountDescription = "",
  discountId = null,
  pointsToRedeem = 0,
  conversionRateForPoints = 1,
  selectedItemIds = []
}) {
  // get customer using helper function
  const customer = await findOrCreateCustomer(customerId);
  if (!customer) throw new Error("Customer not found");
  
  // Ensure customer data is properly populated
  await ensureCustomerDataPopulated(customer);
  
  // Use Sales Customer ID for all operations
  const salesCustomerId = customer._id;

  // check if customer is blocked
  if (customer.blocked) {
    throw new Error("This customer account is blocked and cannot place orders. Please contact support.");
  }

  // get cart using Sales Customer ID
  const cart = await Cart.findOne({ customerId: salesCustomerId });
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  // filter only selected items if provided
  let checkoutItems = cart?.items || []; // use cart items if cart exists

  if (Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
    checkoutItems = checkoutItems.filter(it => selectedItemIds.includes(it._id.toString()));
  }

  if (checkoutItems.length === 0) {
    throw new Error("No items selected for checkout");
  }

  // Build invoice items & subtotal
  let subtotal = 0;
  const items = [];

  for (const it of checkoutItems) {
    const product = it.productId ? await Product.findById(it.productId) : null;
    const unitPrice = product?.price ?? it.unitPrice ?? 0;
    const total = unitPrice * it.quantity;
    subtotal += total;
    items.push({
      productId: it.productId,
      name: it.name,
      unitPrice,
      quantity: it.quantity,
      total
    });
  }

  // apply discount (percent or fixed amount)
  const percentBasedAmount = (subtotal * (discountPercent || 0)) / 100;
  const fixedBasedAmount = discountAmount || 0;
  const appliedDiscount = fixedBasedAmount > 0 ? fixedBasedAmount : percentBasedAmount;
  let amountAfterDiscount = subtotal - appliedDiscount;

  // redeem points (if requested)
  let redeemedPoints = 0;
  let redeemedDiscount = 0;
  if (pointsToRedeem && pointsToRedeem > 0) {
    const redemption = await redeemPoints(customerId, pointsToRedeem, conversionRateForPoints);
    redeemedPoints = redemption.redeemedPoints;
    redeemedDiscount = redemption.discountAmount;
    amountAfterDiscount -= redeemedDiscount;
  }

  if (amountAfterDiscount < 0) amountAfterDiscount = 0;

  // If payment method is credit, check credit limit (only for wholesale customers)
  if (paymentMethod === "Credit" && customer.type === "wholesale") {
    const multiplier = customer.tier === "diamond" ? 0.7 : customer.tier === "gold" ? 0.5 : 0.3;
    const creditLimit = (customer.totalPurchaseAmount || 0) * multiplier;
    
    // Calculate current credit usage from existing credit payments
    const Payment = require("../models/PaymentModel.js");
    const existingCreditPayments = await Payment.find({
      customerId: customer._id,
      paymentType: "Credit",
      isActive: true
    });
    
    const currentCreditUsed = existingCreditPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const projectedCredit = currentCreditUsed + amountAfterDiscount;
    
    if (projectedCredit > creditLimit) {
      // block customer and notify
      customer.blocked = true;
      await customer.save();
      throw new Error("Credit limit exceeded; customer blocked");
    }
  }

  // Customer data should now be properly populated by ensureCustomerDataPopulated
  const customerName = customer.name || 'Unknown Customer';
  const customerEmail = customer.email || 'No email provided';
  const customerPhone = customer.phone || '';
  const customerAddress = [customer.addressLine1, customer.addressLine2, customer.city].filter(Boolean).join(', ') || '';

  // create invoice
  const invoiceData = {
    customerId: salesCustomerId, // Use Sales Customer ID
    customerSnapshot: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress
    },
    items, // array of { productId, name, unitPrice, quantity, total }
    subtotal,
    discountId,
    discountType,
    discountPercent,
    discountAmount: appliedDiscount,
    discountDescription,
    totalAmount: amountAfterDiscount,
    paymentMethod,
    paymentDetails,
    status: paymentMethod === "Cash" || paymentMethod === "Card" ? "Paid" : "Pending",
    pointsRedeemed: redeemedPoints,
    pointsAwarded: 0
  };

  const invoice = await createInvoice(invoiceData);

  // remove only purchased items from cart
  cart.items = cart.items.filter(
    it => !checkoutItems.some(ci => ci._id.toString() === it._id.toString())
  );

  if (cart.items.length === 0) {
    await Cart.findOneAndDelete({ customerId: salesCustomerId }); // cart empty, delete it
  } else {
    await cart.save(); // keep remaining items
  }

  return {
    invoice, awardedPoints: invoice.pointsAwarded, redeemedPoints, redeemedDiscount
  };
}

module.exports = {
  processCheckout
};
