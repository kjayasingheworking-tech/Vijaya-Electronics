import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../../context/CartContext";
import "../../styles/customer-dark.css";
import CustomerHeader from "../../components/Customer/CustomerHeader";
import Toast from "../../components/Toast";
import { API, API_ENDPOINTS } from "../../constants/salesApi";
import { validateQuantity, getStockStatus } from "../../utils/validation";
import { Search, ShoppingCart, Star, Package } from "lucide-react";

// UI Components
const Badge = ({ children, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-electric-blue text-white ${className}`}
    >
      {children}
    </span>
  );
};

const Button = ({ children, variant = "solid", size = "md", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none";

  const variants = {
    solid: "bg-honeycomb-orange text-tech-white hover:bg-orange-600",
    ghost: "bg-transparent hover:bg-light-gray text-dark-charcoal",
    outline: "border border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const ProductCard = ({ product, productImages, onAddToCart, isLoading }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    // Validation before proceeding
    if (!quantityValidation.isValid) {
      console.warn("Cannot add to cart: invalid quantity", { quantity, product: product.productName });
      return;
    }
    onAddToCart(product._id, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  // Use centralized validation
  const quantityValidation = validateQuantity(quantity, product);
  const stockStatus = getStockStatus(product);

  // Get the first image for this product
  const productImage = productImages[product._id] && productImages[product._id].length > 0 
    ? productImages[product._id][0] 
    : null;

  return (
    <div className="product-card-dark customer-card rounded-lg shadow-card border border-light-gray hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-gradient-to-br from-electric-blue/10 to-honeycomb-orange/10 flex items-center justify-center p-4">
        {productImage ? (
          <img 
            src={productImage} 
            alt={product.productName}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <Package 
          className={`h-16 w-16 text-electric-blue ${productImage ? 'hidden' : ''}`}
          style={{ display: productImage ? 'none' : 'block' }}
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="product-title font-semibold text-lg line-clamp-2">
            {product.productName}
          </h3>
          <Badge className="customer-badge ml-2 flex-shrink-0">
            {product.category?.categoryName || 'Uncategorized'}
          </Badge>
        </div>

        <p className="product-description text-sm mb-3 line-clamp-2">
          {product.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-400">4.5</span>
          </div>
          <span className="product-price text-lg font-bold">
            Rs. {product.price}
          </span>
        </div>

        {/* Stock Information */}
        <div className="mb-2">
          <span className={`text-sm font-medium ${
            stockStatus.statusType === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {stockStatus.statusMessage}
          </span>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-600 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 py-1 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-3 py-1 text-sm font-medium text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quantity >= stockStatus.availableStock}
            >
              +
            </button>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || !quantityValidation.isValid}
            size="sm"
            className="customer-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {quantityValidation.isOutOfStock ? 'Out of Stock' : !quantityValidation.isValid ? 'Invalid Quantity' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CustomerProductsView = ({ customerId }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productImages, setProductImages] = useState({}); // Store product images by productId
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // name, price, category
  const [toast, setToast] = useState({ isVisible: false, message: "", type: "success" });

  // Fetch products and categories
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API}${API_ENDPOINTS.PRODUCTS}`),
        fetch(`${API}${API_ENDPOINTS.CATEGORIES}`)
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setFilteredProducts(productsData);

      // Fetch images for each product
      const imagesMap = {};
      for (const product of productsData) {
        try {
          const imagesRes = await fetch(`${API}${API_ENDPOINTS.PRODUCT_IMAGES_BY_PRODUCT(product._id)}`);
          const imagesData = await imagesRes.json();
          if (imagesData.images && imagesData.images.length > 0) {
            imagesMap[product._id] = imagesData.images;
          }
        } catch (error) {
          console.log(`No images found for product ${product._id}`);
        }
      }
      setProductImages(imagesMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and search products
  useEffect(() => {
    if (products.length > 0) {
    }
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category?._id === selectedCategory || 
        product.category?.categoryName === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort products
    const sortedProducts = [...filtered].sort((a, b) => {
      let result;
      switch (sortBy) {
        case "price":
          // Ensure prices are numbers and handle null/undefined
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          result = priceA - priceB;
          return result;
        case "category":
          const categoryA = a.category?.categoryName || "";
          const categoryB = b.category?.categoryName || "";
          result = categoryA.localeCompare(categoryB);
          return result;
        case "name":
        default:
          const nameA = a.productName || "";
          const nameB = b.productName || "";
          result = nameA.localeCompare(nameB);
          return result;
      }
    });

    setFilteredProducts(sortedProducts);
  }, [products, selectedCategory, searchTerm, sortBy]);

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ isVisible: false, message: "", type: "success" });
  };

  const handleAddToCart = async (productId, quantity) => {
    // Find the product to validate
    const product = products.find(p => p._id === productId);
    if (product) {
      const validation = validateQuantity(quantity, product);
      if (!validation.isValid) {
        showToast(validation.message, "error");
        return;
      }
    }

    try {
      setIsAddingToCart(true);
      await addToCart(productId, quantity);
      showToast(`Added ${quantity} item(s) to cart successfully!`, "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add item to cart. Please try again.", "error");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-app min-h-screen">
        <CustomerHeader customerId={customerId} />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="customer-spinner animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"></div>
            <p className="customer-loading">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-app min-h-screen">
      <CustomerHeader customerId={customerId} />
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      <div className="pt-20 px-4">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">Our Products</h1>
            <p className="text-gray-300">Discover our wide range of electronic products</p>
          </div>

          {/* Filters and Search */}
          <div className="py-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="customer-input w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="customer-select w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="customer-select w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>

            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-300">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

           {/* Products Grid */}
           {filteredProducts.length === 0 ? (
             <div className="text-center py-12">
               <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-gray-300 mb-2">No products found</h3>
               <p className="text-gray-400">Try adjusting your search or filter criteria</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredProducts.map((product) => (
                 <ProductCard
                   key={product._id}
                   product={product}
                   productImages={productImages}
                   onAddToCart={handleAddToCart}
                   isLoading={isAddingToCart}
                 />
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProductsView;
