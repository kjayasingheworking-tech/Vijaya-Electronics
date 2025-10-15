const express = require('express');
const {
  addProductImages,
  getProductImages,
  updateProductImages,
  removeProductImage,
  deleteProductImages
} = require('../controllers/productImageController.js');

const router = express.Router();

// Add images to product
router.post('/', addProductImages);

// Get images for a product
router.get('/:productId', getProductImages);

// Update images for a product
router.put('/:productId', updateProductImages);

// Remove specific image from product
router.delete('/:productId/remove', removeProductImage);

// Delete all images for a product
router.delete('/:productId', deleteProductImages);

module.exports = router;
