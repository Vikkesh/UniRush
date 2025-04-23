import { useAuth } from "../../hooks/useAuth"
import { Navigate, useLocation } from "react-router-dom"

export default function AuthRoute({ children }) {
    const location = useLocation();
    const { user, validateReturnUrl } = useAuth();
    
    // If user is not logged in, redirect to login
    if (!user) {
      return <Navigate to={`/login?returnUrl=${location.pathname}${location.search}`} replace />;
    }

    // Validate the current path for authenticated access
    // Pass the full path including search params to validation
    const validatedPath = validateReturnUrl(location.pathname + location.search, user);
    
    // Compare the full current path with the validated path
    const currentFullPath = location.pathname + location.search;
    if (validatedPath !== currentFullPath) {
      return <Navigate to={validatedPath} replace />;
    }

    return children;
}