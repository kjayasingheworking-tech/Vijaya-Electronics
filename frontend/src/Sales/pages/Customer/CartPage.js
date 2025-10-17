import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import "../../styles/sales.css";
import CheckoutModal from "../../components/Customer/CheckoutModal";
import CustomerHeader from "../../components/Customer/CustomerHeader";
import { useCart } from "../../context/CartContext";
import { validateQuantity, getStockStatus } from "../../utils/validation";
import { API, API_ENDPOINTS } from "../../constants/salesApi";

const CartPage = ({ customerId }) => {
  const { cart, setCart, fetchCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    localStorage.setItem(
      `cartSelected-${customerId}`,
      JSON.stringify(selectedItems)
    );
  }, [selectedItems, customerId]);

  // Initialize selected items when cart is loaded
  useEffect(() => {
    if (cart.items) {
      if (cart.items.length > 0) {
        const savedSelection = JSON.parse(localStorage.getItem(`cartSelected-${customerId}`)) || {};
        const selection = {};
        cart.items.forEach(item => {
          // If previously saved, use that; otherwise default to true (selected)
          selection[item._id] = savedSelection[item._id] ?? true;
        });
        setSelectedItems(selection);
      } else {
        // Cart is empty, clear selected items
        setSelectedItems({});
      }
      setLoading(false);
    }
  }, [cart.items, customerId]);


  // Refresh cart when component mounts
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Also refresh cart when customerId changes
  useEffect(() => {
    if (customerId) {
      fetchCart();
    }
  }, [customerId, fetchCart]);

  // Update quantity
  const updateQty = async (itemId, qty) => {
    if (qty < 1) return;
    
    // Find the cart item to check available stock
    const cartItem = cart.items.find(item => item._id === itemId);
    if (!cartItem) return;
    
    // Use centralized validation
    const validation = validateQuantity(qty, cartItem.productId || cartItem);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }
    
    await fetch(`${API}${API_ENDPOINTS.CART_ITEM_UPDATE(customerId, itemId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    // Refresh cart from context
    await fetchCart();
  };

  // Remove item
  const removeItem = async (itemId) => {
    await fetch(`${API}${API_ENDPOINTS.CART_ITEM_DELETE(customerId, itemId)}`, { method: "DELETE" });
    // Refresh cart from context
    await fetchCart();
    setSelectedItems((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Toggle individual selection
  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Toggle select all
  const toggleSelectAll = () => {
    const allSelected =
      cart.items.length > 0 &&
      Object.keys(selectedItems).length === cart.items.length &&
      Object.values(selectedItems).every(Boolean);

    if (allSelected) {
      setSelectedItems({});
    } else {
      const newSelection = {};
      cart.items.forEach((item) => {
        newSelection[item._id] = true;
      });
      setSelectedItems(newSelection);
    }
  };

  // Calculate subtotal of selected items
  const subtotal = cart.items
    .filter((item) => selectedItems[item._id])
    .reduce((s, it) => {
      // Handle both unitPrice (direct) and productId.price (populated) cases
      const price = it.unitPrice || (it.productId && it.productId.price) || 0;
      return s + (price * it.quantity);
    }, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <CustomerHeader customerId={customerId}/>

      <main className="pt-16 flex-1 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-5">Shopping Cart</h2>

        {loading ? (
          <p>Loading...</p>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gray-200 mx-auto mb-6">
              <span className="text-4xl">🛒</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Add some items to get started</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-2 bg-electric-blue text-white rounded hover:bg-electric-blue-dark"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={
                  cart.items.length > 0 &&
                  Object.keys(selectedItems).length === cart.items.length &&
                  Object.values(selectedItems).every(Boolean)
                }
                onChange={toggleSelectAll}
                className="mr-2 w-4 h-4"
              />
              <span className="font-medium text-gray-700">Select All</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 w-full">
              {/* Cart Items */}
              <div className="flex-1 space-y-4">
                {cart.items.map((item) => {
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <div
                      key={item._id}
                      className={`flex gap-4 items-center bg-white p-4 rounded shadow ${
                        stockStatus.statusType === 'error' ? 'border border-red-200 bg-red-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={!!selectedItems[item._id]}
                        onChange={() => toggleSelectItem(item._id)}
                        className="w-4 h-4"
                      />

                      <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-400 text-2xl">🛍️</span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name || item.productId?.productName}</h3>
                        {item.description && (
                          <p className="text-gray-500 text-sm">{item.description}</p>
                        )}
                        <p className="font-bold text-electric-blue">
                          Rs.{(item.unitPrice || item.productId?.price).toFixed(2)}
                        </p>
                        <p className={`text-xs ${stockStatus.statusType === 'error' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {stockStatus.statusMessage}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQty(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQty(item._id, item.quantity + 1)}
                            disabled={item.quantity >= stockStatus.availableStock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="flex items-center gap-1 text-red-600 text-sm hover:underline"
                          onClick={() => removeItem(item._id)}
                        >
                          <Trash2 size={16} className="text-red-600" />
                          Remove
                        </button>
                        <p className="font-semibold">
                          Rs.{((item.unitPrice || item.productId?.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="flex-1">
                <div className="bg-white p-6 rounded shadow sticky top-24">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">Order Summary</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal ({Object.values(selectedItems).filter(Boolean).length} items)</span>
                      <span>Rs.{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold text-gray-800 text-lg">
                        <span>Total</span>
                        <span>Rs.{subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      className="w-full px-4 py-2 bg-electric-blue text-white rounded hover:bg-electric-blue-dark"
                      onClick={() => {
                        const itemsToCheckout = cart.items.filter(item => selectedItems[item._id]);
                        if (itemsToCheckout.length === 0) {
                          alert("Please select at least one item to checkout");
                          return;
                        }
                        setShowCheckout(true);
                      }}
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                      onClick={() => (window.location.href = "/")}
                    >
                      Continue Shopping
                    </button>
                    <button
                      className="w-full px-4 py-2 text-red-600 rounded hover:bg-red-50"
                      onClick={async () => {
                        await fetch(`${API}${API_ENDPOINTS.CART_CLEAR(customerId)}`, { method: "DELETE" });
                        setCart({ items: [] });
                        setSelectedItems({});
                      }}
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showCheckout && (
        <CheckoutModal
          customerId={customerId}
          cart={{
            ...cart,
            items: cart.items.filter(item => selectedItems[item._id]), // only selected items
          }}
          onClose={() => setShowCheckout(false)}
          onSuccess={async (res) => {
            setShowCheckout(false);

            // Refetch updated cart from context
            try {
              await fetchCart();
              setSelectedItems({});
            } catch (err) {
              console.error("Failed to refresh cart after checkout", err);
            }

          }}
        />
      )}
    </div>
  );
};

export default CartPage;
