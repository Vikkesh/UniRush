import React from 'react';
import Title from '../../components/Title/Title';
import classes from './adminDashboard.module.css';

export default function AdminDashboardPage() {
  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <Title title="Admin Dashboard" />
        <p>Welcome to the admin dashboard. Here you can manage your site.</p>
        
        <div className={classes.dashboard_menu}>
          <div className={classes.dashboard_item} onClick={() => console.log('Manage Users clicked')}>
            <h3>Manage Users</h3>
            <p>View and manage user accounts</p>
          </div>
          
          <div className={classes.dashboard_item} onClick={() => console.log('Manage Orders clicked')}>
            <h3>Manage Orders</h3>
            <p>View and process customer orders</p>
          </div>
          
          <div className={classes.dashboard_item} onClick={() => console.log('Manage Foods clicked')}>
            <h3>Manage Foods</h3>
            <p>Add, edit, or remove food items</p>
          </div>
          
          <div className={classes.dashboard_item} onClick={() => console.log('Sales Statistics clicked')}>
            <h3>Sales Statistics</h3>
            <p>View sales and revenue data</p>
          </div>
        
        </div>
      </div>
    </div>
  );
}
