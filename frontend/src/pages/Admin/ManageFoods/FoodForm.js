import React, { useState, useEffect } from 'react';
import classes from './foodForm.module.css';
import Title from '../../../components/Title/Title';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import { useAuth } from '../../../hooks/useAuth';

export default function FoodForm({ food, shops, onSubmit, onCancel }) {
  const { user } = useAuth();
  // Determine if the user is a shop admin without admin/owner privileges
  const isShopAdminOnly = user?.isShopAdmin && !user?.isAdmin && !user?.isOwner;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    tags: '',
    shop: '',
    favorite: false,
    stars: 3,
    imageUrl: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    price: '',
    shop: '',
    imageUrl: '',
  });

  // Updated useEffect to properly handle all fields when editing
  useEffect(() => {
    if (food) {
      console.log("Setting food data in form:", food); // Debug log
      setFormData({
        name: food.name || '',
        price: food.price ? food.price.toString() : '',
        tags: food.tags ? food.tags.join(', ') : '',
        shop: food.shop ? food.shop._id : '',
        favorite: food.favorite || false,
        stars: food.stars || 3,
        imageUrl: food.imageUrl || '',
      });
    } else if (shops && shops.length > 0) {
      // For new foods, if shop admin has only one shop, preselect it
      if (isShopAdminOnly && shops.length === 1) {
        setFormData(prev => ({
          ...prev,
          shop: shops[0]._id
        }));
      } else {
        // For admins or shop admins with multiple shops
        setFormData(prev => ({
          ...prev,
          shop: shops[0]._id
        }));
      }
    }
  }, [food, shops, isShopAdminOnly]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleStarsChange = (e) => {
    const value = parseFloat(e.target.value);
    setFormData({
      ...formData,
      stars: value
    });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    } else {
      newErrors.name = '';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
      valid = false;
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
      valid = false;
    } else {
      newErrors.price = '';
    }

    if (!formData.shop) {
      newErrors.shop = 'Shop is required';
      valid = false;
    } else {
      newErrors.shop = '';
    }

    // Remove validation for imageUrl since it's now optional
    newErrors.imageUrl = '';

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const processedData = {
      ...formData,
      price: parseFloat(formData.price),
      tags: formData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
    };
    
    onSubmit(processedData);
  };

  // If shop admin has only one shop and we're editing a food from that shop, 
  // disable the shop dropdown
  const isShopFieldDisabled = isShopAdminOnly && shops.length === 1;

  return (
    <div className={classes.container}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <Title title={food ? 'Edit Food Item' : 'Add New Food Item'} />
        
        <div className={classes.form_row}>
          <div className={classes.form_group}>
            <label>Name</label>
            <Input
              type="text"
              name="name"
              defaultValue={formData.name}
              onChange={handleChange}
              error={errors.name}
            />
          </div>
          
          <div className={classes.form_group}>
            <label>Price</label>
            <Input
              type="text"
              name="price"
              defaultValue={formData.price}
              onChange={handleChange}
              error={errors.price}
            />
          </div>
        </div>
        
        <div className={classes.form_group}>
          <label>Shop</label>
          <select
            name="shop"
            value={formData.shop}
            onChange={handleChange}
            className={errors.shop ? classes.error_select : classes.select}
            disabled={isShopFieldDisabled}
          >
            <option value="">Select a shop</option>
            {shops.map(shop => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
          {errors.shop && <p className={classes.error_text}>{errors.shop}</p>}
          {isShopFieldDisabled && shops.length === 1 && (
            <p className={classes.help_text}>As a shop admin, you can only add food to your assigned shop.</p>
          )}
        </div>
        
        <div className={classes.form_group}>
          <label>Image URL (optional)</label>
          <Input
            type="text"
            name="imageUrl"
            defaultValue={formData.imageUrl}
            onChange={handleChange}
            error={errors.imageUrl}
          />
        </div>
        
        <div className={classes.form_group}>
          <label>Tags (comma separated)</label>
          <Input
            type="text"
            name="tags"
            defaultValue={formData.tags}
            onChange={handleChange}
          />
          <p className={classes.help_text}>Example: Pizza, FastFood, Lunch</p>
        </div>
        
        <div className={classes.form_group}>
          <label>Rating (1-5)</label>
          <div className={classes.range_container}>
            <input
              type="range"
              name="stars"
              min="1"
              max="5"
              step="0.5"
              value={formData.stars}
              onChange={handleStarsChange}
              className={classes.range_input}
            />
            <span className={classes.range_value}>{formData.stars}</span>
          </div>
        </div>
        
        <div className={classes.form_group_checkbox}>
          <input
            type="checkbox"
            name="favorite"
            checked={formData.favorite}
            onChange={handleChange}
            id="favorite"
            className={classes.checkbox}
          />
          <label htmlFor="favorite" className={classes.checkbox_label}>Mark as favourite</label>
        </div>
        
        <div className={classes.buttons}>
          <Button type="submit" text={food ? 'Save Changes' : 'Create Food Item'} />
          <Button type="button" onClick={onCancel} text="Cancel" color="secondary" />
        </div>
      </form>
    </div>
  );
}