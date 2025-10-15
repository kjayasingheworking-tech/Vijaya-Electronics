import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API, API_ENDPOINTS } from "../constants/salesApi.js";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, customerId }) => {
  const [cart, setCart] = useState({ items: [] });

  const fetchCart = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`${API}${API_ENDPOINTS.CART_BY_CUSTOMER(customerId)}`);
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error("CartContext - Error fetching cart:", err);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCart();
  }, [customerId, fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!customerId) {
      console.error("No customer ID provided");
      return;
    }

    const url = `${API}${API_ENDPOINTS.CART_BY_CUSTOMER(customerId)}/add`;
    const payload = { productId, quantity };
    

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error("CartContext - HTTP error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCart = await response.json();
      setCart(updatedCart);
      
      // Force a re-fetch to ensure data consistency
      setTimeout(() => {
        fetchCart();
      }, 100);
      
      return updatedCart;
    } catch (error) {
      console.error("CartContext - Error adding to cart:", error);
      throw error;
    }
  }, [customerId, fetchCart]);

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, setCart, fetchCart, addToCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
