const ProductImage = require('../models/ProductImageModel.js');
const Product = require('../models/ProductModel.js');

// Add images to product
const addProductImages = async (req, res, next) => {
  try {
    const { productId, images } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product already has images
    let productImage = await ProductImage.findOne({ productId });

    if (productImage) {
      // Update existing images
      productImage.images = [...productImage.images, ...images];
      productImage.productName = product.productName; // Update product name
      await productImage.save();
    } else {
      // Create new product image record
      productImage = new ProductImage({
        productId,
        productName: product.productName,
        images
      });
      await productImage.save();
    }

    res.status(201).json({
      ...productImage.toObject(),
      productName: product.productName
    });
  } catch (err) {
    next(err);
  }
};

// Get images for a product
const getProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const productImage = await ProductImage.findOne({ productId });
    
    // Get product name
    const product = await Product.findById(productId);
    const productName = product ? product.productName : 'Unknown Product';
    
    if (!productImage) {
      return res.json({ 
        productId, 
        productName,
        images: [] 
      });
    }

    res.json({
      ...productImage.toObject(),
      productName
    });
  } catch (err) {
    next(err);
  }
};

// Update images for a product
const updateProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { images } = req.body;

    // Get product name first
    const product = await Product.findById(productId);
    const productName = product ? product.productName : 'Unknown Product';

    const productImage = await ProductImage.findOneAndUpdate(
      { productId },
      { 
        images,
        productName
      },
      { new: true, upsert: true }
    );

    res.json({
      ...productImage.toObject(),
      productName
    });
  } catch (err) {
    next(err);
  }
};

// Remove specific image from product
const removeProductImage = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageUrl } = req.body;

    const productImage = await ProductImage.findOne({ productId });
    if (!productImage) {
      return res.status(404).json({ message: 'Product images not found' });
    }

    productImage.images = productImage.images.filter(img => img !== imageUrl);
    await productImage.save();

    res.json(productImage);
  } catch (err) {
    next(err);
  }
};

// Delete all images for a product
const deleteProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    await ProductImage.findOneAndDelete({ productId });
    res.json({ message: 'All product images deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addProductImages,
  getProductImages,
  updateProductImages,
  removeProductImage,
  deleteProductImages
};
