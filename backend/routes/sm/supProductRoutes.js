const express = require("express");
const ctrl = require("../../controllers/sm/supProductController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { requireFields } = require("../../middleware/validateMiddleware");
const upload = require("../../middleware/upload");

const router = express.Router();

/** Supplier self-service product management */
router.get("/me/products", protect, authorize("supplier"), ctrl.listSupProducts);
router.post("/me/products", protect, authorize("supplier"),upload.array("images", 5),  requireFields("name","unitPrice"), ctrl.createSupProduct);
router.post("/me/products/bulk", protect, authorize("supplier"), ctrl.bulkCreateSupProducts);
router.patch("/me/products/:id", protect, authorize("supplier"), ctrl.updateSupProduct);
router.get("/me/products/:id/history", protect, authorize("supplier"), ctrl.getSupProductHistory);
router.get("/admin/products", protect, authorize("admin"), ctrl.adminListSupProducts);
router.post("/me/products/:id/images", protect, authorize("supplier"), upload.array("images", 5), ctrl.uploadSupProductImages);
router.delete("/me/products/:id", protect, authorize("supplier"), ctrl.deleteSupProduct);


module.exports = router;
