import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const queryParams = new URLSearchParams(location.search);
  
  // Get section from query params or default to appropriate section based on user role
  const defaultSection = user?.isDelivery && !user?.isAdmin && !user?.isOwner ? 'orders' : '';
  const [activeSection, setActiveSection] = useState(queryParams.get('section') || defaultSection);
  const [orderFilter, setOrderFilter] = useState(queryParams.get('filter') || null);
  
  // Set page title based on user role
  let pageTitle = "Dashboard";
  if (user?.isOwner) pageTitle = "Owner Dashboard";
  else if (user?.isAdmin) pageTitle = "Admin Dashboard";
  else if (user?.isDelivery) pageTitle = "Delivery Dashboard";

  useEffect(() => {
    // Update active section when query params change
    const sectionParam = queryParams.get('section');
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
    
    const filterParam = queryParams.get('filter');
    if (filterParam) {
      setOrderFilter(filterParam);
    }
  }, [location.search]);

  // If delivery user tries to access other sections, redirect to orders
  useEffect(() => {
    if (user?.isDelivery && !user?.isAdmin && !user?.isOwner && activeSection && activeSection !== 'orders') {
      setActiveSection('orders');
    }
  }, [activeSection, user]);
  
  const hasAdminPrivileges = user?.isAdmin || user?.isOwner;

  const renderContent = () => {
    switch (activeSection) {
      case 'foods':
        return <ManageFoods />;
      case 'shops':
        return <ManageShops />;
      case 'users':
        return <ManageUsers />;
      case 'orders':
        return <ManageOrders />;
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
                onClick={() => setActiveSection('shops')}
              >
                <h3>Manage Shops</h3>
                <p>Add, edit, or remove shops</p>
              </div>
              
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'foods' ? classes.active : ''}`}
                onClick={() => setActiveSection('foods')}
              >
                <h3>Manage Foods</h3>
                <p>Add, edit, or remove food items</p>
              </div>
              
              <div 
                className={`${classes.dashboard_item} ${activeSection === 'users' ? classes.active : ''}`}
                onClick={() => setActiveSection('users')}
              >
                <h3>Manage Users</h3>
                <p>View and manage user accounts</p>
              </div>
            </>
          )}
          
          {/* Show order management to admin, owner and delivery users */}
          <div 
            className={`${classes.dashboard_item} ${activeSection === 'orders' ? classes.active : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            <h3>Manage Orders</h3>
            <p>View and process customer orders</p>
          </div>
          
          {/* Only show statistics to admin or owner users */}
          {hasAdminPrivileges && (
            <div 
              className={`${classes.dashboard_item} ${activeSection === 'statistics' ? classes.active : ''}`}
              onClick={() => setActiveSection('statistics')}
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
