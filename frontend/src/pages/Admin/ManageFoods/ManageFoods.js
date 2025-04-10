import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as foodService from '../../../services/foodService';
import * as shopService from '../../../services/shopService';
import classes from './manageFoods.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import FoodForm from './FoodForm';
import { useAuth } from '../../../hooks/useAuth';

export default function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorFoods, setErrorFoods] = useState(null);
  const [errorShops, setErrorShops] = useState(null);
  const [foodToEdit, setFoodToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedShop, setSelectedShop] = useState('all');
  const [isAllFoodsEnabled, setIsAllFoodsEnabled] = useState(true);
  const { user } = useAuth();
  
  // Determine if the user is a shop admin without admin/owner privileges
  const isShopAdminOnly = user?.isShopAdmin && !user?.isAdmin && !user?.isOwner;
  
  useEffect(() => {
    loadFoods();
    loadShops();
  }, []);
  
  const loadFoods = async () => {
    setIsLoading(true);
    setErrorFoods(null);
    try {
      // Use the admin endpoint to get foods filtered by permissions
      const response = await foodService.getAdminFoods();
      if (Array.isArray(response)) {
        setFoods(response);
        
        // If shop admin has only one shop, pre-select it in the filter
        if (isShopAdminOnly && user.managedShops && user.managedShops.length === 1) {
          setSelectedShop(user.managedShops[0]);
        }
      } else {
        console.error('API did not return an array for foods:', response);
        setFoods([]);
        setErrorFoods('Failed to load food items properly.');
      }
    } catch (error) {
      console.error('Error loading foods:', error);
      setFoods([]);
      setErrorFoods('Failed to load food items.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadShops = async () => {
    setErrorShops(null);
    try {
      // Use the admin endpoint to get shops filtered by permissions
      const response = await shopService.getAdminShops();
      if (Array.isArray(response)) {
        setShops(response);
      } else {
        console.error('API did not return an array for shops:', response);
        setShops([]);
        setErrorShops('Failed to load shops data properly.');
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
      setErrorShops('Failed to load shops.');
    }
  };
  
  const handleAddClick = () => {
    setFoodToEdit(null);
    setShowForm(true);
  };
  
  const handleEditClick = (food) => {
    // Ensure we're creating a complete copy of the food data
    setFoodToEdit({...food});
    setShowForm(true);
  };
  
  const handleDeleteClick = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) {
      return;
    }
    try {
      await foodService.deleteFood(foodId);
      loadFoods();
    } catch (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food item');
    }
  };
  
  const handleFormSubmit = async (foodData) => {
    try {
      if (foodToEdit) {
        await foodService.updateFood(foodToEdit._id, foodData);
      } else {
        await foodService.createFood(foodData);
      }
      
      setShowForm(false);
      loadFoods();
    } catch (error) {
      console.error('Error saving food:', error);
      alert('Failed to save food item');
    }
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
  };
  
  const handleShopFilterChange = (e) => {
    setSelectedShop(e.target.value);
    
    // Check if all foods for this shop are enabled
    if (e.target.value !== 'all') {
      const shopFoods = foods.filter(food => 
        food.shop && (food.shop._id === e.target.value || food.shop === e.target.value)
      );
      const allEnabled = shopFoods.every(food => food.enabled !== false);
      setIsAllFoodsEnabled(allEnabled);
    }
  };

  // Handle toggling a single food item's enabled status
  const handleToggleEnabled = async (food) => {
    try {
      const newEnabled = !food.enabled;
      await foodService.toggleFoodEnabled(food._id, newEnabled);
      
      // Update local state after successful API call
      setFoods(prevFoods => 
        prevFoods.map(f => 
          f._id === food._id ? { ...f, enabled: newEnabled } : f
        )
      );
    } catch (error) {
      console.error('Error toggling food visibility:', error);
      alert('Failed to update food visibility');
    }
  };
  
  // Handle toggling all foods for a shop
  const handleToggleAllFoods = async () => {
    if (selectedShop === 'all') {
      alert('Please select a specific shop first');
      return;
    }
    
    try {
      // Toggle to the opposite of current state
      const newEnabledState = !isAllFoodsEnabled;
      await foodService.toggleAllFoodsForShop(selectedShop, newEnabledState);
      
      // Update local state
      setFoods(prevFoods => 
        prevFoods.map(food => 
          food.shop && (food.shop._id === selectedShop || food.shop === selectedShop)
            ? { ...food, enabled: newEnabledState }
            : food
        )
      );
      
      setIsAllFoodsEnabled(newEnabledState);
    } catch (error) {
      console.error('Error toggling all foods:', error);
      alert('Failed to update food visibility');
    }
  };
  
  // Filter foods by selected shop - ensure both foods and shops are arrays
  const filteredFoods = Array.isArray(foods) 
    ? (selectedShop === 'all' 
      ? foods 
      : foods.filter(food => food.shop && (food.shop._id === selectedShop || food.shop === selectedShop)))
    : [];
  
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Manage Foods" />
        <Button onClick={handleAddClick} text="Add New Food" />
      </div>
      
      {(errorFoods || errorShops) && (
        <div className={classes.error_message}>
          {errorFoods && <p>{errorFoods}</p>}
          {errorShops && <p>{errorShops}</p>}
          <Button onClick={() => { loadFoods(); loadShops(); }} text="Try Again" />
        </div>
      )}
      
      <div className={classes.filter_section}>
        <label htmlFor="shopFilter">Filter by Shop:</label>
        <select
          id="shopFilter"
          value={selectedShop}
          onChange={handleShopFilterChange}
          className={classes.shop_filter}
        >
          {/* Only show "All Shops" option if user is admin/owner or has multiple shops as shop admin */}
          {(!isShopAdminOnly || shops.length > 1) && (
            <option value="all">All Shops</option>
          )}
          {Array.isArray(shops) && shops.map(shop => (
            <option key={shop._id || `shop-${Math.random()}`} value={shop._id}>
              {shop.name || 'Unnamed Shop'}
            </option>
          ))}
        </select>
        
        {/* Toggle all foods button (only visible when a specific shop is selected) */}
        {selectedShop !== 'all' && (user?.isAdmin || user?.isOwner || user?.isShopAdmin) && (
          <button 
            className={`${classes.toggle_all_button} ${isAllFoodsEnabled ? classes.enabled : classes.disabled}`}
            onClick={handleToggleAllFoods}
          >
            {isAllFoodsEnabled ? 'Disable All Foods' : 'Enable All Foods'}
          </button>
        )}
      </div>
      
      {showForm ? (
        <FoodForm 
          food={foodToEdit} 
          shops={Array.isArray(shops) ? shops : []}
          onSubmit={handleFormSubmit} 
          onCancel={handleCancelForm} 
        />
      ) : (
        isLoading ? (
          <p>Loading foods...</p>
        ) : (
          <div className={classes.foods_list}>
            {filteredFoods.length === 0 ? (
              <p>No food items found. {shops.length > 0 ? 'Add your first food item!' : 'No shops available for adding food items.'}</p>
            ) : (
              <table className={classes.foods_table}>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Shop</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoods.map(food => (
                    <tr key={food._id || `food-${Math.random()}`} className={food.enabled === false ? classes.disabled_row : ''}>
                      <td>
                        <img 
                          src={food.imageUrl || 'default-food.jpg'} 
                          alt={food.name || 'Unknown food'} 
                          className={classes.food_image} 
                        />
                      </td>
                      <td>{food.name || 'Unnamed Food'}</td>
                      <td>{food.shop ? (food.shop.name || 'Unknown') : 'Unknown'}</td>
                      <td>₹{(food.price || 0).toFixed(2)}</td>
                      <td>
                        <div className={classes.toggle_container}>
                          <label className={classes.switch}>
                            <input 
                              type="checkbox"
                              checked={food.enabled !== false}
                              onChange={() => handleToggleEnabled(food)}
                            />
                            <span className={`${classes.slider} ${classes.round}`}></span>
                          </label>
                          <span className={classes.status_text}>
                            {food.enabled === false ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={classes.actions}>
                          <button 
                            className={classes.edit_button}
                            onClick={() => handleEditClick(food)}
                          >
                            Edit
                          </button>
                          <button 
                            className={classes.delete_button}
                            onClick={() => handleDeleteClick(food._id)}
                          >
                            Delete
                          </button>
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