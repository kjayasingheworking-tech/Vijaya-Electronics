// controllers/productController.js
const Product = require("../models/ProductModel.js");
const Category = require("../models/CategoryModel.js");

// list
const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category', 'categoryName description').limit(200);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    next(err);
  }
};

// Category controllers
const addCategory = async (req, res, next) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

const viewCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().limit(200);
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  createProduct,
  addCategory,
  viewCategories
};
