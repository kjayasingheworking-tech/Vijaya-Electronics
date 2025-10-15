const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require("../controllers/cartController.js");

const router = express.Router();

// GET Cart by customer ID
router.get("/:customerId", getCart);

// POST add item
router.post("/:customerId/add", addToCart);

// PUT update item qty
router.put("/:customerId/item/:itemId", updateCartItem);

// DELETE item from cart
router.delete("/:customerId/item/:itemId", removeCartItem);

// DELETE all items (clear cart)
router.delete("/:customerId/clear", clearCart);

module.exports = router;
