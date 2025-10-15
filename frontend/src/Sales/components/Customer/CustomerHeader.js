import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "../../styles/sales.css";
import CustomerNotificationModal from "./CustomerNotificationModal";
import { ROUTES } from "../../constants/salesRoutes";

import { Home, Package, Wrench, Info, User, ShoppingCart, Bell, Menu, X } from "lucide-react";

//UI Components
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


// CustomerHeader Component
const CustomerHeader = ({ customerId }) => {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, href: ROUTES.HOME },
    { id: "products", label: "Products", icon: Package, href: ROUTES.PRODUCTS },
    { id: "repair", label: "Repair", icon: Wrench, href: "/repair" },
    { id: "about", label: "About Us", icon: Info, href: "/about" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary backdrop-blur border-b shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-md flex items-center justify-center shadow-button overflow-hidden">
              <img 
                src="/logo.jpeg" 
                alt="Vijaya Electronics Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-white">Vijaya Electronics</h1>
              <p className="text-sm text-white/50 ">Electronic device selling and repair center</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/20 hover:text-electric-blue text-white/90"
                  onClick={() => navigate(item.href)} 
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Action Items */}
          <div className="flex items-center space-x-2 relative">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-white/20 text-white hover:text-electric-blue transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-white/20 text-white hover:text-electric-blue transition-colors"
              onClick={() => navigate(ROUTES.CART)}   // go to CartPage
            >
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-honeycomb-orange text-tech-white border-0">
                {cartCount}
              </Badge>
            </Button>

            {/* Profile */}
            <Button variant="ghost" size="icon" className="relative hover:bg-white/20 text-white hover:text-electric-blue transition-colors">
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-light-gray">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-light-gray hover:text-electric-blue"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <CustomerNotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        customerId={customerId}
      />
    </header>
  );
};

export default CustomerHeader;
