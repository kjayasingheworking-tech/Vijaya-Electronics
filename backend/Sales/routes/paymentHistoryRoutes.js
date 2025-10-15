const express = require("express");
const { getCustomerPaymentHistory } = require("../controllers/paymentHistoryController.js");

const router = express.Router();

// Get payment history for a specific customer
router.get("/customer/:customerId", getCustomerPaymentHistory);

module.exports = router;