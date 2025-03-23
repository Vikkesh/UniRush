import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import classes from './header.module.css';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const { getAllCarts } = useCart();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('');
  
  const getTotalCartCount = () => {
    const carts = getAllCarts();
    return carts.reduce((sum, cart) => sum + cart.totalCount, 0);
  };
  
  const totalCartCount = getTotalCartCount();
  
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
    setActiveMenu('');
  };

  const toggleMenu = (menuId) => {
    if (window.innerWidth <= 834) {
      setActiveMenu(activeMenu === menuId ? '' : menuId);
    }
  };

  const closeNav = () => {
    setIsNavOpen(false);
    setActiveMenu('');
  };
  
  return (
    <header className={classes.header}>
      <div className={classes.container}>
        <Link to="/" className={classes.logo} onClick={closeNav}>
          UniRush
        </Link>
        <div className={`${classes.hamburger} ${isNavOpen ? classes.open : ''}`} onClick={toggleNav}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <nav className={isNavOpen ? classes.open : ''}>
          <ul>
            {user ? (
              <>
                {(user.isAdmin || user.isDelivery || user.isOwner || user.isShopAdmin) && (
                  <li className={`${classes.menu_container} ${activeMenu === 'dashboard' ? classes.open : ''}`}>
                    <Link to="#" onClick={() => toggleMenu('dashboard')}>
                      Dashboard
                      {user.isOwner && <span className={classes.role_badge}>Owner</span>}
                      {user.isAdmin && !user.isOwner && <span className={classes.role_badge}>Admin</span>}
                      {user.isShopAdmin && !user.isAdmin && !user.isOwner && <span className={classes.role_badge}>Shop Admin</span>}
                      {user.isDelivery && !user.isAdmin && !user.isOwner && !user.isShopAdmin && <span className={classes.role_badge}>Delivery</span>}
                    </Link>
                    <div className={classes.menu}>
                      <Link to="/admin/dashboard" onClick={closeNav}>Overview</Link>
                      {(user.isAdmin || user.isOwner || user.isShopAdmin) && (
                        <>
                          <Link to="/admin/dashboard?section=foods" onClick={closeNav}>Manage Foods</Link>
                          <Link to="/admin/dashboard?section=shops" onClick={closeNav}>Manage Shops</Link>
                          {(user.isAdmin || user.isOwner) && (
                            <Link to="/admin/dashboard?section=users" onClick={closeNav}>Manage Users</Link>
                          )}
                        </>
                      )}
                      <Link to="/admin/dashboard?section=orders" onClick={closeNav}>Manage Orders</Link>
                      {(user.isAdmin || user.isOwner || user.isShopAdmin) && (
                        <Link to="/admin/dashboard?section=statistics" onClick={closeNav}>Statistics</Link>
                      )}
                    </div>
                  </li>
                )}
                <li className={`${classes.menu_container} ${activeMenu === 'profile' ? classes.open : ''}`}>
                  <Link to="#" onClick={() => toggleMenu('profile')}>
                    {user.name}
                  </Link>
                  <div className={classes.menu}>
                    <Link to="/profile" onClick={closeNav}>Profile</Link>
                    <Link to="/orders" onClick={closeNav}>Orders</Link>
                    <a onClick={() => { closeNav(); logout(); }}>Logout</a>
                  </div>
                </li>
              </>
            ) : (
              <Link to="/login" onClick={closeNav}>Login</Link>
            )}
            <li>
              <Link to="/cart" onClick={closeNav}>
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