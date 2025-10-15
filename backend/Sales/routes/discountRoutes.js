const express = require("express");
const { getDiscounts, getDiscountById, createDiscount, updateDiscount, deleteDiscount, redeemDiscount
} = require("../controllers/discountControllers.js");

const router = express.Router();

router.get("/", getDiscounts);
router.get("/:id", getDiscountById);
router.post("/", createDiscount);
router.put("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);
router.post("/redeem", redeemDiscount); // redeem discount through checkout

module.exports = router;
