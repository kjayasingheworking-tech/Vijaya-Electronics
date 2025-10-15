const express = require("express");
const { 
  preparePayment, 
  completePayment, 
  cancelPayment,
  getCreditPayments,
  getChequePayments,
  updateCreditPaymentStatus,
  updateChequePaymentStatus
} = require("../controllers/paymentController.js");

const router = express.Router();

// Existing payment routes
router.post("/prepare", preparePayment);
router.post("/complete", completePayment);
router.post("/cancel", cancelPayment);

// New payment management routes
router.get("/credit", getCreditPayments);
router.get("/cheque", getChequePayments);
router.patch("/credit/:id/status", updateCreditPaymentStatus);
router.patch("/cheque/:id/status", updateChequePaymentStatus);

module.exports = router;