const express = require("express");
const { createInvoiceController, getInvoicesController, getInvoiceController, deleteInvoice } = require("../controllers/invoiceController.js");

const router = express.Router();

router.post("/", createInvoiceController);
router.get("/", getInvoicesController);
router.get("/:id", getInvoiceController);
router.delete("/:id", deleteInvoice); // Optional: If you want to add delete functionality

module.exports = router;
