import React, { useEffect } from 'react';
import "../styles/sales.css";
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md shadow-lg max-w-xs transform transition-all duration-300 ${
        isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-full opacity-0 scale-95'
      } ${
        type === 'success' 
          ? 'bg-black/50 text-white/90' 
          : 'bg-red/50 text-white/90'
      }`}>
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 flex-shrink-0 hover:bg-white/20 rounded p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
