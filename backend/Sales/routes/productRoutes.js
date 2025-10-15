const express = require("express");
const { listProducts, createProduct, addCategory, viewCategories } = require("../controllers/productController.js");

const router = express.Router();

// Product routes
router.get("/", listProducts);
router.post("/", createProduct);

// Category routes
router.post("/categories", addCategory);
router.get("/categories", viewCategories);

module.exports = router;
