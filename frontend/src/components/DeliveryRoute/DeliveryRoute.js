import React, { useEffect } from 'react';
import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function DeliveryRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If the user is a delivery person and accessing just the dashboard,
  // redirect them directly to the orders section
  useEffect(() => {
    if (user && user.isDelivery && !user.isAdmin) {
      // Only redirect if they're accessing exactly /admin/dashboard with no params
      if (location.pathname === '/admin/dashboard' && !location.search) {
        navigate('/admin/dashboard?section=orders');
      }
    }
  }, [user, location.pathname, location.search, navigate]);
  
  return user && (user.isAdmin || user.isDelivery) ? (
    children
  ) : (
    <Navigate to={`/login?returnUrl=${location.pathname}`} replace />
  );
}