import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
export default function AdminRoute({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  
  return user && (user.isAdmin || user.isOwner) ? (
    children
  ) : (
    <Navigate to={`/login?returnUrl=${location.pathname}`} replace />
  );
}
