import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as shopService from '../../../services/shopService';
import classes from './manageShops.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import ShopForm from './ShopForm';
import StarRating from '../../../components/StarRating/StarRating';
import { useAuth } from '../../../hooks/useAuth';

export default function ManageShops() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopToEdit, setShopToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  
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
    // Improved logging to verify all shop data is available
    console.log("Editing shop - full data:", JSON.stringify(shop));
    
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
  
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Manage Shops" />
        {/* Only show Add button for admin/owners */}
        {!isShopAdminOnly && (
          <Button onClick={handleAddClick} text="Add New Shop" />
        )}
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
                    <th>Rating</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(shop => (
                    <tr key={shop._id || `shop-${Math.random()}`}>
                      <td>
                        <img 
                          src={shop.imageUrl || 'default-shop.jpg'} 
                          alt={shop.name || 'Unknown Shop'} 
                          className={classes.shop_image} 
                        />
                      </td>
                      <td>{shop.name || 'Unnamed Shop'}</td>
                      <td>
                        <StarRating stars={shop.stars || 0} size={20} />
                      </td>
                      <td>{shop.address || 'No address'}</td>
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      )}
    </div>
  );
}