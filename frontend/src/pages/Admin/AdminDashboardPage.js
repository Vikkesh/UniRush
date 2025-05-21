import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Title from '../../components/Title/Title';
import classes from './adminDashboard.module.css';
import ManageFoods from './ManageFoods/ManageFoods';
import ManageShops from './ManageShops/ManageShops';
import ManageUsers from './ManageUsers/ManageUsers';
import ManageOrders from './ManageOrders/ManageOrders';
import Statistics from './Statistics/Statistics';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Initialize navigate

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  const defaultSection = user?.isDelivery && !user?.isAdmin && !user?.isOwner && !user?.isShopAdmin ? 'orders' : '';
  
  // Initialize state from URL params or defaults. These will be synced by useEffect.
  const [activeSection, setActiveSection] = useState(queryParams.get('section') || defaultSection);
  const [filter, setFilter] = useState(queryParams.get('filter') || null);
  
  // Set page title based on user role
  let pageTitle = "Dashboard";
  if (user?.isOwner) pageTitle = "Owner Dashboard";
  else if (user?.isAdmin) pageTitle = "Admin Dashboard";
  else if (user?.isShopAdmin) pageTitle = "Shop Admin Dashboard";
  else if (user?.isDelivery) pageTitle = "Delivery Dashboard";

  // Effect 1: Handle redirection for delivery-only users
  useEffect(() => {
    const currentUrlSection = queryParams.get('section');
    if (user?.isDelivery && !user?.isAdmin && !user?.isOwner && !user?.isShopAdmin) {
      // If section in URL is present and not 'orders', or if no section is in URL (should default to 'orders' for them)
      if ((currentUrlSection && currentUrlSection !== 'orders') || !currentUrlSection) {
        const targetPath = '/admin/dashboard?section=orders';
        // Check to prevent navigation loop if already at the target or navigating
        if (location.pathname + location.search !== targetPath) {
          navigate(targetPath, { replace: true });
        }
      }
    }
  }, [user, queryParams, navigate, location.pathname, location.search]);

  // Effect 2: Sync activeSection and filter state from URL (queryParams)
  useEffect(() => {
    // This effect runs after any potential redirection from Effect 1 has updated queryParams
    const sectionParam = queryParams.get('section');
    // For delivery users, if Effect 1 ran, sectionParam should now be 'orders'.
    // defaultSection handles cases like no section in URL for non-delivery.
    const determinedSection = sectionParam || defaultSection; 

    if (activeSection !== determinedSection) {
      setActiveSection(determinedSection);
    }

    const filterParam = queryParams.get('filter');
    const determinedFilter = filterParam || null;
    if (filter !== determinedFilter) {
      setFilter(determinedFilter);
    }
  }, [queryParams, defaultSection, activeSection, filter]); // Dependencies for syncing state from URL

  const hasAdminPrivileges = user?.isAdmin || user?.isOwner;
  const isShopAdminOnly = user?.isShopAdmin && !hasAdminPrivileges;
  
  const renderContent = () => {
    switch (activeSection) {
      case 'foods':
        return <ManageFoods />;
      case 'shops':
        return <ManageShops />;
      case 'users':
        return <ManageUsers />;
      case 'orders':
        return <ManageOrders filter={filter} />;
      case 'statistics':
        return <Statistics />;
      default:
        return (
          <p>Welcome to the {pageTitle}. Select an option from above to get started.</p>
        );
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <Title title={pageTitle} />
        <div className={classes.dashboard_menu}>
          {/* Only show these options to admin or owner users */}
          {hasAdminPrivileges && (
            <>
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'shops' ? classes.active : ''}`} 
                onClick={() => navigate('/admin/dashboard?section=shops')} // Updated onClick
              >
                <h3>Manage Shops</h3>
                <p>Add, edit, or remove shops</p>
              </div>
              
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'foods' ? classes.active : ''}`}
                onClick={() => navigate('/admin/dashboard?section=foods')} // Updated onClick
              >
                <h3>Manage Foods</h3>
                <p>Add, edit, or remove food items</p>
              </div>
              
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'users' ? classes.active : ''}`}
                onClick={() => navigate('/admin/dashboard?section=users')} // Updated onClick
              >
                <h3>Manage Users</h3>
                <p>View and manage user accounts</p>
              </div>
            </>
          )}

          {/* Show shop management for shop admin ONLY if they don't have admin/owner privileges */}
          {isShopAdminOnly && (
            <>
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'shops' ? classes.active : ''}`} 
                onClick={() => navigate('/admin/dashboard?section=shops')} // Updated onClick
              >
                <h3>Manage Shops</h3>
                <p>View your assigned shops</p>
              </div>
              
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'foods' ? classes.active : ''}`}
                onClick={() => navigate('/admin/dashboard?section=foods')} // Updated onClick
              >
                <h3>Manage Foods</h3>
                <p>Manage food items for your shops</p>
              </div>
            </>
          )}
          
          {/* Show order management to admin, owner, shop admin and delivery users */}
          <div 
            className={`${classes.dashboard_item} ${activeSection === 'orders' ? classes.active : ''}`}
            onClick={() => navigate('/admin/dashboard?section=orders')} // Updated onClick
          >
            <h3>Manage Orders</h3>
            <p>View and process customer orders</p>
          </div>
          
          {/* Show statistics to admin, owner and shop admin users */}
          {(hasAdminPrivileges || user?.isShopAdmin) && (
            <div 
              className={`${classes.dashboard_item} ${activeSection === 'statistics' ? classes.active : ''}`}
              onClick={() => navigate('/admin/dashboard?section=statistics')} // Updated onClick
            >
              <h3>Sales Statistics</h3>
              <p>View sales and revenue data</p>
            </div>
          )}
        </div>
        <div className={classes.section_content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
