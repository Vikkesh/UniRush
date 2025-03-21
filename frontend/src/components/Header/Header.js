import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import classes from './header.module.css';
import { useAuth } from '../../hooks/useAuth';
export default function Header() {
  const { user, logout } = useAuth();
  const { getAllCarts } = useCart();
  
  // Calculate the total count across all shop carts
  const getTotalCartCount = () => {
    const carts = getAllCarts();
    return carts.reduce((sum, cart) => sum + cart.totalCount, 0);
  };
  
  const totalCartCount = getTotalCartCount();
  
  // Get dashboard label based on user role
  const getDashboardLabel = () => {
    if (user?.isOwner) return "Owner Dashboard";
    if (user?.isAdmin) return "Admin Dashboard";
    if (user?.isShopAdmin) return "Shop Admin Dashboard";
    if (user?.isDelivery) return "Delivery Dashboard";
    return "Dashboard";
  };
  
  return (
    <header className={classes.header}>
      <div className={classes.container}>
        <Link to="/" className={classes.logo}>
          UniRush
        </Link>
        <nav>
          <ul>
            {user ? (
              <>
                <div className={classes.menu_container}>
                  {/* Show dashboard link for admin, delivery, shop admin, and owner roles */}
                  {(user.isAdmin || user.isDelivery || user.isOwner || user.isShopAdmin) && (
                    <Link to="/admin/dashboard">{getDashboardLabel()}</Link>
                  )}
                </div>
                <li className={classes.menu_container}>
                  <Link to="/profile">
                    {user.name}
                    {user.isOwner && (
                      <span className={classes.role_badge}>Owner</span>
                    )}
                    {user.isAdmin && !user.isOwner && (
                      <span className={classes.role_badge}>Admin</span>
                    )}
                    {user.isShopAdmin && !user.isAdmin && !user.isOwner && (
                      <span className={classes.role_badge}>Shop Admin</span>
                    )}
                    {user.isDelivery && !user.isAdmin && !user.isOwner && !user.isShopAdmin && (
                      <span className={classes.role_badge}>Delivery</span>
                    )}
                  </Link>
                  <div className={classes.menu}>
                    <Link to="/profile">Profile</Link>
                    <Link to="/orders">Orders</Link>
                    <a onClick={logout}>Logout</a>
                  </div>
                </li>
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
            <li>
              <Link to="/cart">
                Cart
                {totalCartCount > 0 && (
                  <span className={classes.cart_count}>{totalCartCount}</span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}