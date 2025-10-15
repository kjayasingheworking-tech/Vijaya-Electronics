import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import CustomerHome from "./pages/Customer/CustomerHome";
import CustomerProductsView from "./pages/Customer/CustomerProductsView";
import Cart from "./pages/Customer/CartPage";

function CustomerApp() {
  const customerId = "68e3beb039573146a00958a7"; 

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
