const express = require("express");
const ctrl = require("../../controllers/sm/poController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { requireFields } = require("../../middleware/validateMiddleware");

const router = express.Router();

/** Company (admin) */
router.post("/admin/purchase-orders", protect, authorize("admin"), requireFields("supplier","items"), ctrl.createPO);
router.get("/admin/purchase-orders", protect, authorize("admin"), ctrl.listCompanyPOs);
router.get("/admin/purchase-orders/:id", protect, authorize("admin"), ctrl.getCompanyPO);
router.patch("/admin/purchase-orders/:id/status", protect, authorize("admin"), ctrl.companyChangeStatus);

/** Supplier self-service */
router.get("/me/purchase-orders", protect, authorize("supplier"), ctrl.listSupplierPOs);
router.get("/me/purchase-orders/:id", protect, authorize("supplier"), ctrl.getSupplierPO);
router.patch("/me/purchase-orders/:id/status", protect, authorize("supplier"), ctrl.supplierChangeStatus);

module.exports = router;
