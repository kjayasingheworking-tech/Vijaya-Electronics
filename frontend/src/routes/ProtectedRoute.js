import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, booted } = useAuth();
  const loc = useLocation();

  // Wait until auth boot completes (avoid flicker/incorrect redirects)
  if (!booted) return null; // or a loader component

  // Not signed in → go to HOME, not /login
  if (!user) {
    return <Navigate to="/" replace state={{ from: loc }} />;
  }

  // Role mismatch → also go to HOME
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
