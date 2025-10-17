import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRedirect = ({ children }) => {
  const { user, booted } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (booted && user) {
      // Redirect sales managers to their dashboard
      if (user.role === 'sales_manager') {
        navigate('/sales', { replace: true });
      }
    }
  }, [user, booted, navigate]);

  return children;
};

export default AuthRedirect;

