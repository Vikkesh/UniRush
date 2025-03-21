import React, { useEffect, useState } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function DeliveryRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // If the user is a delivery person and accessing just the dashboard,
  // redirect them directly to the orders section
  useEffect(() => {
    if (!hasRedirected && user && user.isDelivery && !user.isAdmin && !user.isOwner) {
      // Only redirect if they're accessing exactly /admin/dashboard with no params
      if (location.pathname === '/admin/dashboard' && !location.search) {
        setHasRedirected(true);
        navigate('/admin/dashboard?section=orders', { replace: true });
      }
    }
  }, [user, location.pathname, location.search, navigate, hasRedirected]);
  
  // Check if user has necessary permissions (admin, owner, shop admin, or delivery)
  return user && (user.isAdmin || user.isDelivery || user.isOwner || user.isShopAdmin) ? (
    children
  ) : (
    <Navigate to={`/login?returnUrl=${location.pathname}`} replace />
  );
}