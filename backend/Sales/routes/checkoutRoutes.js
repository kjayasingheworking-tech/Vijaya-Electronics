// routes/checkoutRoutes.js
const express = require("express");
const { checkout } = require("../controllers/checkoutController.js");

const router = express.Router();

// POST /api/checkout
router.post("/", checkout);

module.exports = router;
