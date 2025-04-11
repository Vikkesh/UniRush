import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as shopService from '../../../services/shopService';
import classes from './manageShops.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import ShopForm from './ShopForm';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function ManageShops() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopToEdit, setShopToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAllShopsEnabled, setIsAllShopsEnabled] = useState(true);
  const { user } = useAuth();
  
  // Function to check if shop is currently open
  const isShopOpen = (openingTime, closingTime) => {
    if (!openingTime || !closingTime) return true; // Default to open if times not set
    
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    // IST offset is 5 hours and 30 minutes ahead of UTC
    const istTime = new Date(now.getTime() + (330 * 60000));
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Convert times to minutes for comparison
    const currentMinutes = convertTimeToMinutes(currentTimeString);
    const openingMinutes = convertTimeToMinutes(openingTime);
    const closingMinutes = convertTimeToMinutes(closingTime);
    
    // Compare times
    if (openingMinutes < closingMinutes) {
      // Normal case (e.g., 9:00 - 17:00)
      return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
    } else {
      // Overnight case (e.g., 22:00 - 6:00)
      return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
    }
  };
  
  // Helper function to convert time (HH:MM) to minutes
  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Determine if the user is a shop admin without admin/owner privileges
  const isShopAdminOnly = user?.isShopAdmin && !user?.isAdmin && !user?.isOwner;
  
  useEffect(() => {
    loadShops();
  }, []);
  
  const loadShops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the admin endpoint which already handles shop filtering based on user role
      const response = await shopService.getAdminShops();
      
      // Ensure we have an array of shops
      if (Array.isArray(response)) {
        setShops(response);
        
        // Check if all shops are enabled
        const allEnabled = response.every(shop => shop.enabled !== false);
        setIsAllShopsEnabled(allEnabled);
      } else {
        console.error('API did not return an array:', response);
        setShops([]);
        setError('Failed to load shops data properly. Please try again later.');
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
      setError('Failed to load shops. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddClick = () => {
    // Only allow admin/owners to add new shops
    if (isShopAdminOnly) {
      alert('Shop admins cannot add new shops. Please contact an administrator.');
      return;
    }
    setShopToEdit(null);
    setShowForm(true);
  };
  
  const handleEditClick = (shop) => {
    // Ensure we're creating a complete copy of the shop data
    setShopToEdit({...shop});
    setShowForm(true);
  };
  
  const handleDeleteClick = async (shopId) => {
    // Only allow admin/owners to delete shops
    if (isShopAdminOnly) {
      alert('Shop admins cannot delete shops. Please contact an administrator.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this shop?')) {
      return;
    }
    try {
      await shopService.deleteShop(shopId);
      loadShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      if (error.response && error.response.data) {
        alert(error.response.data);
      } else {
        alert('Failed to delete shop');
      }
    }
  };
  
  const handleFormSubmit = async (shopData) => {
    try {
      if (shopToEdit) {
        await shopService.updateShop(shopToEdit._id, shopData);
      } else {
        await shopService.createShop(shopData);
      }
      
      setShowForm(false);
      loadShops();
    } catch (error) {
      console.error('Error saving shop:', error);
      alert('Failed to save shop');
    }
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
  };

  // Handle toggling a single shop's enabled status
  const handleToggleEnabled = async (shop) => {
    try {
      const newEnabled = !shop.enabled;
      await shopService.toggleShopEnabled(shop._id, newEnabled);
      
      // Update local state after successful API call
      setShops(prevShops => 
        prevShops.map(s => 
          s._id === shop._id ? { ...s, enabled: newEnabled } : s
        )
      );
      
      toast.success(`Shop "${shop.name}" has been ${newEnabled ? 'enabled' : 'disabled'}`);
      
      // Check if all shops are now enabled or disabled
      const updatedShops = shops.map(s => 
        s._id === shop._id ? { ...s, enabled: newEnabled } : s
      );
      setIsAllShopsEnabled(updatedShops.every(s => s.enabled !== false));
    } catch (error) {
      console.error('Error toggling shop visibility:', error);
      toast.error('Failed to update shop availability');
    }
  };
  
  // Handle toggling all shops
  const handleToggleAllShops = async () => {
    try {
      // Toggle to the opposite of current state
      const newEnabledState = !isAllShopsEnabled;
      await shopService.toggleAllShopsEnabled(newEnabledState);
      
      // Update local state
      setShops(prevShops => 
        prevShops.map(shop => ({ ...shop, enabled: newEnabledState }))
      );
      
      setIsAllShopsEnabled(newEnabledState);
      toast.success(`All shops have been ${newEnabledState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling all shops:', error);
      toast.error('Failed to update shops availability');
    }
  };
  
  // Helper to determine shop status display
  const getShopStatus = (shop) => {
    // If shop is manually disabled, always show as disabled
    if (shop.enabled === false) {
      return { isOpen: false, statusText: 'Disabled' };
    }
    
    // Otherwise, check regular opening hours
    const openBasedOnHours = isShopOpen(shop.openingTime, shop.closingTime);
    
    // If there's a manual override to keep open outside hours
    if (shop.manualOverride && shop.enabled) {
      return { isOpen: true, statusText: 'Open (Override)' };
    }
    
    return { 
      isOpen: openBasedOnHours, 
      statusText: openBasedOnHours ? 'Open' : 'Closed' 
    };
  };
  
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Manage Shops" />
        <div className={classes.action_buttons}>
          {/* Only show Add button for admin/owners */}
          {!isShopAdminOnly && (
            <Button onClick={handleAddClick} text="Add New Shop" />
          )}
          
          {/* Toggle all shops button */}
          {shops.length > 0 && (
            <Button 
              onClick={handleToggleAllShops}
              text={isAllShopsEnabled ? 'Disable All Shops' : 'Enable All Shops'}
              backgroundColor={isAllShopsEnabled ? '#f44336' : '#4caf50'}
            />
          )}
        </div>
      </div>
      
      {error && (
        <div className={classes.error_message}>
          <p>{error}</p>
          <Button onClick={loadShops} text="Try Again" />
        </div>
      )}
      
      {showForm ? (
        <ShopForm 
          shop={shopToEdit} 
          onSubmit={handleFormSubmit} 
          onCancel={handleCancelForm} 
        />
      ) : (
        isLoading ? (
          <p>Loading shops...</p>
        ) : (
          <div className={classes.shops_list}>
            {!Array.isArray(shops) || shops.length === 0 ? (
              <p>No shops found. {!isShopAdminOnly ? 'Add your first shop!' : 'No shops have been assigned to you.'}</p>
            ) : (
              <table className={classes.shops_table}>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(shop => {
                    const shopStatus = getShopStatus(shop);
                    return (
                      <tr key={shop._id || `shop-${Math.random()}`} className={shop.enabled === false ? classes.disabled_row : ''}>
                        <td>
                          <img 
                            src={shop.imageUrl || 'default-shop.jpg'} 
                            alt={shop.name || 'Unknown Shop'} 
                            className={classes.shop_image} 
                          />
                        </td>
                        <td>{shop.name || 'Unnamed Shop'}</td>
                        <td>{shop.address || 'No address'}</td>
                        <td>
                          {shop.openingTime || '09:00'} - {shop.closingTime || '22:00'}
                        </td>
                        <td>
                          <div className={classes.toggle_container}>
                            <label className={classes.switch}>
                              <input 
                                type="checkbox"
                                checked={shop.enabled !== false}
                                onChange={() => handleToggleEnabled(shop)}
                              />
                              <span className={`${classes.slider} ${classes.round}`}></span>
                            </label>
                            <span className={classes.status_text}>
                              {shopStatus.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={classes.actions}>
                            <Link to={`/shop/${shop._id}`} className={classes.view_button}>
                              View
                            </Link>
                            <button 
                              className={classes.edit_button}
                              onClick={() => handleEditClick(shop)}
                            >
                              Edit
                            </button>
                            {/* Only show Delete button for admin/owners */}
                            {!isShopAdminOnly && (
                              <button 
                                className={classes.delete_button}
                                onClick={() => handleDeleteClick(shop._id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      )}
    </div>
  );
}