// routes/cm/customerRoutes.js
const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const ctrl = require("../../controllers/cm/customerController");

const router = express.Router();

// Public
router.post("/register", ctrl.createCustomer);

// Protected (requires JWT)
router.use(protect);
router.get("/me", ctrl.getMyProfile);
router.put("/me", ctrl.updateMyProfile);
router.delete("/me", ctrl.deleteMyCustomer);

// Admin only
router.get("/", authorize("admin"), ctrl.listAllCustomers);

module.exports = router;   // <- ensure it's module.exports (not module_exports)
