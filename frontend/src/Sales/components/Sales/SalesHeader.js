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
    <header className="bg-gradient-primary text-white shadow-elegant fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-md flex items-center justify-center shadow-button overflow-hidden bg-white/10">
              <img 
                src="/vijayaElectronics.jpg" 
                alt="Vijaya Electronics Logo" 
                className="h-full w-full object-contain"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                onError={(e) => {
                  console.log('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vijaya Electronics</h1>
              <p className="text-sm text-white/70 font-medium">
                Sales Management Portal - {user?.name || 'Sales Manager'}
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
