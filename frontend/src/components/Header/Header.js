import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import classes from './header.module.css';
import { useAuth } from '../../hooks/useAuth';
import { FaHome, FaShoppingCart, FaUser, FaClipboardList, FaChartBar, 
         FaStore, FaUsers, FaUtensils, FaTachometerAlt, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';

export default function Header() {
  const { user, logout } = useAuth();
  const { getAllCarts } = useCart();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  
  // Track window resize to determine if we're in mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    setActiveMenu(activeMenu === menuId ? '' : menuId);
  };

  const closeNav = () => {
    setIsNavOpen(false);
    setActiveMenu('');
  };

  // Determine the active route for the mobile navigation
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  return (
    <header className={classes.header}>
      <div className={classes.container}>
        <Link to="/" className={classes.logo} onClick={closeNav}>
          <img 
            src="/Icons/unirush-icon.png" 
            alt="UniRush Icon" 
            className={classes.logoIcon} 
          />
          UniRush
        </Link>
        
        {/* Mobile header action buttons - only visible on mobile (<= 768px) */}
        {isMobile && (
          <div className={classes.mobileHeaderActions}>
            {/* Dashboard button - only visible for authorized roles */}
            {user && (user.isAdmin || user.isDelivery || user.isOwner || user.isShopAdmin) && (
              <Link to="/admin/dashboard" className={`${classes.mobileHeaderButton} ${isActive('/admin/dashboard') ? classes.active : ''}`}>
                <div className={classes.navItemBackground}></div>
                <FaTachometerAlt className={classes.icon} />
              </Link>
            )}
            
            {/* Logout/Login button */}
            {user ? (
              <a onClick={logout} className={classes.mobileHeaderButton}>
                <div className={classes.navItemBackground}></div>
                <FaSignOutAlt className={classes.icon} />
              </a>
            ) : (
              <Link to="/login" className={`${classes.mobileHeaderButton} ${isActive('/login') ? classes.active : ''}`}>
                <div className={classes.navItemBackground}></div>
                <FaSignInAlt className={classes.icon} />
              </Link>
            )}
          </div>
        )}
        
        {/* Hamburger menu - always visible on desktop (>768px), hidden on mobile */}
        <div className={`${classes.hamburger} ${isNavOpen ? classes.open : ''}`} onClick={toggleNav}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        {/* Navigation menu - visible in hamburger on desktop, hidden on mobile */}
        <nav className={isNavOpen ? classes.open : ''}>
          <ul>
            {/* Home link */}
            <li>
              <Link to="/" onClick={closeNav}>
                <FaHome className={classes.icon} />
                <span>Home</span>
              </Link>
            </li>
            
            {/* Dashboard menu for admins/shop owners/etc */}
            {user && (user.isAdmin || user.isDelivery || user.isOwner || user.isShopAdmin) && (
              <li className={`${classes.menu_container} ${activeMenu === 'dashboard' ? classes.open : ''}`}>
                <Link to="#" onClick={() => toggleMenu('dashboard')}>
                  <FaTachometerAlt className={classes.icon} />
                  <span>Dashboard</span>
                  {user.isOwner && <span className={classes.role_badge}>Owner</span>}
                  {user.isAdmin && !user.isOwner && <span className={classes.role_badge}>Admin</span>}
                  {user.isShopAdmin && !user.isAdmin && !user.isOwner && <span className={classes.role_badge}>Shop Admin</span>}
                  {user.isDelivery && !user.isAdmin && !user.isOwner && !user.isShopAdmin && <span className={classes.role_badge}>Delivery</span>}
                </Link>
                <div className={classes.menu}>
                  <Link to="/admin/dashboard" onClick={closeNav}>
                    <FaChartBar className={classes.icon} />
                    <span>Overview</span>
                  </Link>
                  {(user.isAdmin || user.isOwner || user.isShopAdmin) && (
                    <>
                      <Link to="/admin/dashboard?section=foods" onClick={closeNav}>
                        <FaUtensils className={classes.icon} />
                        <span>Manage Foods</span>
                      </Link>
                      <Link to="/admin/dashboard?section=shops" onClick={closeNav}>
                        <FaStore className={classes.icon} />
                        <span>Manage Shops</span>
                      </Link>
                      {(user.isAdmin || user.isOwner) && (
                        <Link to="/admin/dashboard?section=users" onClick={closeNav}>
                          <FaUsers className={classes.icon} />
                          <span>Manage Users</span>
                        </Link>
                      )}
                    </>
                  )}
                  <Link to="/admin/dashboard?section=orders" onClick={closeNav}>
                    <FaClipboardList className={classes.icon} />
                    <span>Manage Orders</span>
                  </Link>
                  {(user.isAdmin || user.isOwner || user.isShopAdmin) && (
                    <Link to="/admin/dashboard?section=statistics" onClick={closeNav}>
                      <FaChartBar className={classes.icon} />
                      <span>Statistics</span>
                    </Link>
                  )}
                </div>
              </li>
            )}
            
            {/* Cart link */}
            <li>
              <Link to="/cart" onClick={closeNav}>
                <FaShoppingCart className={classes.icon} />
                <span>Cart</span>
                {totalCartCount > 0 && (
                  <span className={classes.cart_count}>{totalCartCount}</span>
                )}
              </Link>
            </li>
            
            {/* User profile/login */}
            {user ? (
              <li className={`${classes.menu_container} ${activeMenu === 'profile' ? classes.open : ''}`}>
                <Link to="#" onClick={() => toggleMenu('profile')}>
                  <FaUser className={classes.icon} />
                  <span>{user.name}</span>
                </Link>
                <div className={classes.menu}>
                  <Link to="/profile" onClick={closeNav}>
                    <FaUser className={classes.icon} />
                    <span>Profile</span>
                  </Link>
                  <Link to="/orders" onClick={closeNav}>
                    <FaClipboardList className={classes.icon} />
                    <span>Orders</span>
                  </Link>
                  <a onClick={() => { closeNav(); logout(); }}>
                    <FaSignOutAlt className={classes.icon} />
                    <span>Logout</span>
                  </a>
                </div>
              </li>
            ) : (
              <li>
                <Link to="/login" onClick={closeNav}>
                  <FaSignInAlt className={classes.icon} />
                  <span>Login</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile screens */}
      {isMobile && (
        <div className={classes.mobileNav}>
          <div className={classes.mobileNavContainer}>
            {/* Home */}
            <Link to="/" className={`${classes.navItem} ${isActive('/') ? classes.active : ''}`}>
              <div className={classes.navItemBackground}></div>
              <FaHome className={classes.icon} />
              <span>Home</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className={`${classes.navItem} ${isActive('/cart') ? classes.active : ''}`}>
              <div className={classes.navItemBackground}></div>
              <FaShoppingCart className={classes.icon} />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className={classes.mobileCartCount}>{totalCartCount}</span>
              )}
            </Link>

            {/* Orders */}
            <Link to="/orders" className={`${classes.navItem} ${isActive('/orders') ? classes.active : ''}`}>
              <div className={classes.navItemBackground}></div>
              <FaClipboardList className={classes.icon} />
              <span>Orders</span>
            </Link>

            {/* Profile */}
            <Link to={user ? "/profile" : "/login"} className={`${classes.navItem} ${isActive('/profile') || isActive('/login') ? classes.active : ''}`}>
              <div className={classes.navItemBackground}></div>
              <FaUser className={classes.icon} />
              <span>{user ? "Profile" : "Login"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
