import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CustomerHome from "./pages/Customer/CustomerHome";
import CustomerProductsView from "./pages/Customer/CustomerProductsView";
import Cart from "./pages/Customer/CartPage";
import { API, API_ENDPOINTS } from "./constants/salesApi";

function CustomerApp() {
  const { user } = useAuth(); // Get logged-in user
  const [customerId, setCustomerId] = useState(null); // Will store Sales Customer ID
  const [loading, setLoading] = useState(true);

  // Fetch Sales Customer ID when user is available
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (user && user.role === 'customer') {
        try {
          // Get Sales Customer ID from main User ID
          const response = await fetch(`${API}/customers/sales-id/${user._id}`);
          if (response.ok) {
            const data = await response.json();
            setCustomerId(data.salesCustomerId); // Use Sales Customer ID
          }
        } catch (error) {
          console.error('Error fetching customer ID:', error);
        }
      }
      setLoading(false);
    };

    fetchCustomerId();
  }, [user]);

  // Handle case where user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to access the customer portal.</p>
        </div>
      </div>
    );
  }

  // Handle case where user is not a customer
  if (user.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">This portal is only accessible to customers.</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching customer ID
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600">Setting up your customer account.</p>
        </div>
      </div>
    );
  }

  // Show error if customer ID couldn't be fetched
  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600">Unable to load customer account. Please try again.</p>
        </div>
      </div>
    );
  } 

  return (
    <Routes>
      {/* Customer routes with CartProvider */}
      <Route path="/" element={
        <CartProvider customerId={customerId}>
          <CustomerHome customerId={customerId}/>
        </CartProvider>
      } />
      <Route path="/cart" element={
        <CartProvider customerId={customerId}>
          <Cart customerId={customerId}/>
        </CartProvider>
      } />
      <Route path="/products" element={
        <CartProvider customerId={customerId}>
          <CustomerProductsView customerId={customerId}/>
        </CartProvider>
      } />
    </Routes>
  );
}

export default CustomerApp;
