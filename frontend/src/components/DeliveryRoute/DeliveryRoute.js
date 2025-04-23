import React, { useEffect, useState } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function DeliveryRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, validateReturnUrl } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!hasRedirected && user?.isDelivery && !user?.isAdmin && !user?.isOwner && !user?.isShopAdmin) {
      // Only redirect if they're accessing exactly /admin/dashboard with no params
      if (location.pathname === '/admin/dashboard' && !location.search) {
        setHasRedirected(true);
        navigate('/admin/dashboard?section=orders', { replace: true });
      }
    }
  }, [user, location.pathname, location.search, navigate, hasRedirected]);

  // Validate the current path for delivery access
  // Pass the full path including search params to validation
  const validatedPath = validateReturnUrl(location.pathname + location.search, user);
  
  // Compare the full current path with the validated path
  const currentFullPath = location.pathname + location.search;
  if (validatedPath !== currentFullPath) {
    return <Navigate to={validatedPath} replace />;
  }

  // Check if user has necessary permissions (admin, owner, shop admin, or delivery)
  if (!user || (!user.isAdmin && !user.isDelivery && !user.isOwner && !user.isShopAdmin)) {
    return <Navigate to={`/login?returnUrl=${location.pathname}${location.search}`} replace />;
  }

  return children;
}