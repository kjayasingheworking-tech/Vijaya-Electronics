const express = require("express");
const { createCustomer, getCustomerById, getCustomerByPhone, getCustomerByEmail, listCustomers, updateCustomer, updateCustomerBlockStatus, updateCustomerCreditInfo, getSalesCustomerIdByUserId } = require("../controllers/customerController.js");

const router = express.Router();
router.get("/", listCustomers);
router.post("/add", createCustomer);
router.get("/sales-id/:userId", getSalesCustomerIdByUserId); // New endpoint to get Sales Customer ID
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.patch("/:id/block-status", updateCustomerBlockStatus);
router.patch("/:id/update-credit", updateCustomerCreditInfo);
router.get("/phone/:phone", getCustomerByPhone);
router.get("/email/:email", getCustomerByEmail);

module.exports = router;
