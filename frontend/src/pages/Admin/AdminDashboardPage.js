import React, { useState } from 'react';
import Title from '../../components/Title/Title';
import classes from './adminDashboard.module.css';
import ManageFoods from './ManageFoods/ManageFoods';
import ManageShops from './ManageShops/ManageShops';

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case 'foods':
        return <ManageFoods />;
      case 'shops':
        return <ManageShops />;
      case 'users':
        return <div>User management coming soon</div>;
      case 'orders':
        return <div>Order management coming soon</div>;
      case 'statistics':
        return <div>Statistics coming soon</div>;
      default:
        return (
          <p>Welcome to the admin dashboard. Select an option from above to get started.</p>
        );
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <Title title="Admin Dashboard" />

        <div className={classes.dashboard_menu}>
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
          
          <div 
            className={`${classes.dashboard_item} ${activeSection === 'orders' ? classes.active : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            <h3>Manage Orders</h3>
            <p>View and process customer orders</p>
          </div>
          
          <div 
            className={`${classes.dashboard_item} ${activeSection === 'statistics' ? classes.active : ''}`}
            onClick={() => setActiveSection('statistics')}
          >
            <h3>Sales Statistics</h3>
            <p>View sales and revenue data</p>
          </div>
        </div>

        <div className={classes.section_content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
