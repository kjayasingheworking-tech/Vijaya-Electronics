const express = require("express");
const ctrl = require("../../controllers/sm/invoiceController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { requireFields } = require("../../middleware/validateMiddleware");

const router = express.Router();

/** Supplier */
router.post("/me/invoices", protect, authorize("supplier"), requireFields("purchaseOrder"), ctrl.supplierCreateInvoice);
router.get("/me/invoices", protect, authorize("supplier"), ctrl.supplierListInvoices);

/** Admin (Company) */
router.get("/admin/invoices", protect, authorize("admin"), ctrl.adminListInvoices);
router.get("/admin/invoices/:id", protect, authorize("admin"), ctrl.adminGetInvoice);
router.post("/admin/damage-inquiries/recalculate", protect, authorize("admin"), requireFields("purchaseOrder","originalInvoice","items"), ctrl.adminCreateDamageInquiryAndRecalculate);
router.patch("/admin/invoices/:id/close", protect, authorize("admin"), ctrl.adminCloseInvoice);
router.get("/admin/damage-inquiries",       protect, authorize("admin"), ctrl.adminListDamageInquiries);
router.get("/admin/damage-inquiries/:id",   protect, authorize("admin"), ctrl.adminGetDamageInquiry);

router.get(
  "/admin/original-issued",
  protect, authorize("admin"),
  ctrl.adminListOriginalIssuedInvoicesForPo
);


module.exports = router;
