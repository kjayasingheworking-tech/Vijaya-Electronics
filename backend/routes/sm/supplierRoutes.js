const express = require("express");
const ctrl = require("../../controllers/sm/supplierController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { requireFields } = require("../../middleware/validateMiddleware");

const router = express.Router();

/** Admin endpoints (Supplier Manager) */
router.post(
  "/admin",
  protect,
  authorize("admin"),
  requireFields(
    "userName",
    "userEmail",
    "companyName",
    "address",
    "contactDetails.email",
    "contactDetails.phone",
    "bankAccount.accountNumber",
    "bankAccount.bankName",
    "contactPerson.name"
  ),
  ctrl.adminCreateSupplier
);
router.get("/admin", protect, authorize("admin"), ctrl.listSuppliers);

//get the archived suppliers
router.get("/admin/archived", protect, authorize("admin"), ctrl.listArchivedSuppliers);

router.get("/admin/:id", protect, authorize("admin"), ctrl.getSupplierById);

router.patch("/admin/:id/archive", protect, authorize("admin"), ctrl.archiveSupplier);

/** Supplier self-service */
router.get("/me", protect, authorize("supplier"), ctrl.getMySupplierProfile);
router.put(
  "/me",
  protect,
  authorize("supplier"),
  requireFields("companyName", "address", "contactDetails.email", "contactDetails.phone"),
  ctrl.updateMySupplierProfile
);

//activate supplier account
router.patch("/admin/:id/activate",protect,authorize("admin"),ctrl.activateSupplier);

router.delete("/admin/:id", protect, authorize("admin"), ctrl.deleteSupplier);

module.exports = router;
