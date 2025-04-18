import React from 'react';
import { useForm } from 'react-hook-form';
import classes from './userForm.module.css';
import Title from '../../../components/Title/Title';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';

export default function UserForm({ user, onSubmit, onCancel }) {
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.contact || '',
      address: user?.address || ''
    }
  });

  return (
    <div className={classes.container}>
      <Title title={user ? 'Edit User' : 'Add User'} />
      
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
        <Input
          type="text"
          label="Name"
          {...register('name', {
            required: true,
            minLength: 3
          })}
          error={errors.name}
        />
        
        <Input
          type="email"
          label="Email"
          {...register('email', {
            required: true,
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i,
              message: 'Email Is Not Valid'
            }
          })}
          error={errors.email}
        />
        
        <Input
          type="tel"
          label="Contact Number"
          {...register('contact', {
            required: true,
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Please enter a valid 10-digit phone number'
            }
          })}
          error={errors.contact}
        />
        
        <Input
          type="text"
          label="Address"
          {...register('address', {
            required: true,
            minLength: 5
          })}
          error={errors.address}
        />
        
        <div className={classes.button_container}>
          <Button
            type="submit"
            text="Save"
            backgroundColor="#009e84"
            className={classes.save_button}
          />
          <Button
            type="button"
            text="Cancel"
            backgroundColor="#e63946"
            onClick={onCancel}
            className={classes.cancel_button}
          />
        </div>
      </form>
    </div>
  );
}