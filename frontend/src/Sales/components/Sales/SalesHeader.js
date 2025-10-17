import { useState } from "react";
import { Bell, LogOut, User } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "../../styles/sales.css";
import SalesNotificationModal from "./SalesNotificationModal";

const SalesHeader = ({ salesManagerId, user }) => { // Add user parameter
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-primary text-white shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-md flex items-center justify-center shadow-button overflow-hidden">
              <img 
                src="/logo.jpeg" 
                alt="Vijaya Electronics Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vijaya Electronics</h1>
              <p className="text-sm text-white/70 font-medium">
                Sales Management Portal
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <div className="h-6 w-px bg-white/30 mx-2"></div>
            <button 
              className="relative hover:bg-white/15 p-3 rounded-xl transition-all duration-200 group"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
            {user ? (
              <button 
                onClick={handleLogout}
                className="hover:bg-white/15 p-3 rounded-xl transition-all duration-200 group flex items-center space-x-2"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            ) : (
              <button className="hover:bg-white/15 p-3 rounded-xl transition-all duration-200 group">
                <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sales Notification Modal */}
      <SalesNotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        salesManagerId={salesManagerId}
      />
    </header>
  );
};

export default SalesHeader;
