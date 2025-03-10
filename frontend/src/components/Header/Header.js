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
                  {user.isAdmin && (
                    <Link to="/admin/dashboard">Admin Dashboard</Link>
                  )}
                </div>
                <li className={classes.menu_container}>
                  <Link to="/profile">{user.name}</Link>
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