import React, { useState, useEffect } from 'react';
import classes from './shopForm.module.css';
import Title from '../../../components/Title/Title';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';

export default function ShopForm({ shop, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    address: '',
    tags: '',
    openingTime: '09:00',
    closingTime: '22:00'
  });

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    imageUrl: '',
    address: '',
    openingTime: '',
    closingTime: ''
  });

  useEffect(() => {
    if (shop) {
      console.log("Setting shop data in form:", shop);
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        imageUrl: shop.imageUrl || '',
        address: shop.address || '',
        tags: Array.isArray(shop.tags) ? shop.tags.join(', ') : '',
        openingTime: shop.openingTime || '09:00',
        closingTime: shop.closingTime || '22:00'
      });
    }
  }, [shop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
      valid = false;
    } else {
      newErrors.name = '';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      valid = false;
    } else {
      newErrors.description = '';
    }

    newErrors.imageUrl = '';

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
      valid = false;
    } else {
      newErrors.address = '';
    }

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
      tags: formData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    };
    
    onSubmit(processedData);
  };

  return (
    <div className={classes.container}>
      <form onSubmit={handleSubmit} className={classes.form}>
        <Title title={shop ? 'Edit Shop' : 'Add New Shop'} />
        
        <Input
          type="text"
          name="name"
          label="Shop Name"
          defaultValue={formData.name}
          onChange={handleChange}
          error={errors.name}
        />
        
        <div className={classes.form_group}>
          <label>Description</label>
          <textarea
            name="description"
            defaultValue={formData.description}
            onChange={handleChange}
            className={errors.description ? classes.error : ''}
          />
          {errors.description && <p className={classes.error_text}>{errors.description}</p>}
        </div>
        
        <Input
          type="text"
          name="imageUrl"
          label="Image URL (optional)"
          defaultValue={formData.imageUrl}
          onChange={handleChange}
          error={errors.imageUrl}
        />
        
        <Input
          type="text"
          name="address"
          label="Address"
          defaultValue={formData.address}
          onChange={handleChange}
          error={errors.address}
        />
        
        <Input
          type="text"
          name="tags"
          label="Tags (comma separated)"
          defaultValue={formData.tags}
          onChange={handleChange}
        />
        <p className={classes.help_text}>Example: Pizza, Italian, Fast</p>
        
        <div className={classes.time_inputs}>
          <div className={classes.form_group}>
            <label>Opening Time</label>
            <input
              type="time"
              name="openingTime"
              value={formData.openingTime}
              onChange={handleChange}
              className={errors.openingTime ? classes.error : ''}
            />
            {errors.openingTime && <p className={classes.error_text}>{errors.openingTime}</p>}
            <p className={classes.help_text}>Enter time in 24hr format (e.g., 09:00)</p>
          </div>
          
          <div className={classes.form_group}>
            <label>Closing Time</label>
            <input
              type="time"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              className={errors.closingTime ? classes.error : ''}
            />
            {errors.closingTime && <p className={classes.error_text}>{errors.closingTime}</p>}
            <p className={classes.help_text}>Enter time in 24hr format (e.g., 22:00)</p>
          </div>
        </div>
        
        <div className={classes.buttons}>
          <Button type="submit" text={shop ? 'Save Changes' : 'Create Shop'} />
          <Button type="button" onClick={onCancel} text="Cancel" color="secondary" />
        </div>
      </form>
    </div>
  );
}