import { useAuth } from "../../hooks/useAuth"
import { Navigate, useLocation } from "react-router-dom"

export default function AuthRoute({ children }) {
    const location = useLocation();
    const { user, validateReturnUrl } = useAuth();
    
    // If user is not logged in, redirect to login
    if (!user) {
      return <Navigate to={`/login?returnUrl=${location.pathname}`} replace />;
    }

    // Validate the current path for authenticated access
    const validatedPath = validateReturnUrl(location.pathname, user);
    
    // If the validated path is different from current path, redirect to it
    if (validatedPath !== location.pathname) {
      return <Navigate to={validatedPath} replace />;
    }

    return children;
}