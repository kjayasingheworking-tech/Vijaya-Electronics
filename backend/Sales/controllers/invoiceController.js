const { createInvoice, getInvoices, getInvoiceById } = require("../services/invoiceService.js");
const Invoice = require("../models/InvoiceModel.js");
const Customer = require("../models/CustomerModel.js");
const { findOrCreateCustomer } = require("../utils/customerHelper.js");

/** POST /api/invoices */
async function createInvoiceController(req, res, next) {
  try {
    // Check if customer is blocked (if customerId is provided)
    if (req.body.customerId) {
      const customer = await findOrCreateCustomer(req.body.customerId);
      if (customer && customer.blocked) {
        return res.status(400).json({ 
          message: "Cannot create invoice for blocked customer. Please unblock the customer first." 
        });
      }
    }

    const invoice = await createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
}

/** GET /api/invoices */
async function getInvoicesController(req, res, next) {
  try {
    const invoices = await getInvoices();
    res.json(invoices);
  } catch (err) {
    next(err);
  }
}

/** GET /api/invoices/:id */
async function getInvoiceController(req, res, next) {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

//delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error("Delete invoice error:", err);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
};

module.exports = {
  createInvoiceController,
  getInvoicesController,
  getInvoiceController,
  deleteInvoice
};
