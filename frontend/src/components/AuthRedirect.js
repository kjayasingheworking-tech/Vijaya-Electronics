import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRedirect = ({ children }) => {
  const { user, booted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (booted && user) {
      // Redirect sales managers to their dashboard ONLY if they're not already on a sales route
      if (user.role === 'sales_manager' && !location.pathname.startsWith('/sales')) {
        navigate('/sales', { replace: true });
      }
      
      // Redirect repair managers to their dashboard ONLY if they're not already on a repair route
      if (user.role === 'repair_manager' && !location.pathname.startsWith('/repair')) {
        navigate('/repair/admin', { replace: true });
      }
    }
  }, [user, booted, navigate, location]);

  return children;
};

export default AuthRedirect;

