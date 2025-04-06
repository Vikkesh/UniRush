import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user, validateReturnUrl } = useAuth();
  
  // Validate the current path for admin access
  const validatedPath = validateReturnUrl(location.pathname, user);
  
  // If the validated path is different from current path, redirect to it
  if (validatedPath !== location.pathname) {
    return <Navigate to={validatedPath} replace />;
  }

  return children;
}
