const { processCheckout } = require("../services/checkoutService.js");

const checkout = async (req, res, next) => {
  try {
    const { customerId, paymentMethod, paymentDetails, discountPercent, discountAmount, discountType, discountDescription, discountId, pointsToRedeem, selectedItemIds } = req.body;
    const result = await processCheckout({
      customerId,
      paymentMethod,
      paymentDetails,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      discountType: discountType || "Percentage",
      discountDescription: discountDescription || "",
      discountId: discountId || null,
      pointsToRedeem: pointsToRedeem || 0,
      conversionRateForPoints: 1 ,// 1 point = Rs 1
      selectedItemIds 
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout
};
