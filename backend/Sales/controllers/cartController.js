const Cart = require("../models/CartModel.js");
const Product = require("../models/ProductModel.js");

// Get cart
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customerId: req.params.customerId });
    if (!cart) {
      return res.json({ customerId: req.params.customerId, items: [] });
    }

    // Populate product details
    cart = await cart.populate("items.productId", "productName price quantity");

    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// Add item to cart
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const customerId = req.params.customerId;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    const existing = cart.items.find(i => i.productId.toString() === productId);
    if (existing) {
      existing.quantity += quantity || 1;
      existing.unitPrice = product.price;
      existing.name = product.productName;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.productName,
        unitPrice: product.price,
        quantity: quantity || 1
      });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// Update item quantity
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { customerId, itemId } = req.params;

    const cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;
    cart.updatedAt = Date.now();

    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// Remove item
const removeCartItem = async (req, res, next) => {
  try {
    const { customerId, itemId } = req.params;
    let cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Remove item safely
    cart.items.pull(itemId);
    cart.updatedAt = Date.now();

    await cart.save();

    // Populate product details before sending
    cart = await cart.populate("items.productId", "productName price quantity");

    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// Clear cart
const clearCart = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    await Cart.findOneAndDelete({ customerId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
