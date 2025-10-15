const Customer = require("../models/CustomerModel.js");

const tierConfig = {
  diamond: { pointsPercent: 0.05 }, // 5% of bill as points
  gold: { pointsPercent: 0.03 },    // 3%
  silver: { pointsPercent: 0.01 }   // 1%
};

async function calculatePointsToAward(customerId, amount) {
  const customer = await Customer.findById(customerId);
  const tier = (customer && customer.tier) || "silver";
  const pct = tierConfig[tier]?.pointsPercent || 0.01;
  const points = Math.floor(amount * pct); // store integer points
  return { points, tier, pct };
}

async function awardPoints(customerId, points) {
  if (!points || points <= 0) return null;
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");
  
  // Update current balance
  customer.pointsBalance = (customer.pointsBalance || 0) + points;
  
  // Update total points earned
  customer.totalPointsEarned = (customer.totalPointsEarned || 0) + points;
  
  await customer.save();
  return customer;
}

async function redeemPoints(customerId, pointsToRedeem, conversionRate = 1) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");
  const balance = customer.pointsBalance || 0;
  const redeemable = Math.min(pointsToRedeem, balance);
  const discountAmount = redeemable * conversionRate;
  
  // Update current balance
  customer.pointsBalance = balance - redeemable;
  
  // Update total points redeemed
  customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + redeemable;
  
  await customer.save();
  return { redeemedPoints: redeemable, discountAmount, remainingPoints: customer.pointsBalance };
}

module.exports = {
  calculatePointsToAward,
  awardPoints,
  redeemPoints
};
