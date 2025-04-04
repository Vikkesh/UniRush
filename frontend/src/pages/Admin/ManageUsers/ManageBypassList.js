import React, { useState, useEffect } from 'react';
import * as userService from '../../../services/userService';
import classes from './manageBypassList.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function ManageBypassList() {
  const [bypassList, setBypassList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();
  
  useEffect(() => {
    loadBypassList();
  }, []);
  
  const loadBypassList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getBypassList();
      if (Array.isArray(response)) {
        setBypassList(response);
      } else {
        console.error('API did not return an array for bypass list:', response);
        setBypassList([]);
        setError('Failed to load bypass list data properly');
      }
    } catch (error) {
      console.error('Error loading bypass list:', error);
      setBypassList([]);
      setError(error.response?.data || 'Failed to load bypass list');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddBypass = async (data) => {
    try {
      const newEntry = await userService.addToBypassList(data.email, data.reason);
      setBypassList([...bypassList, newEntry]);
      setShowAddForm(false);
      reset();
      toast.success('Email added to bypass list successfully');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to add email to bypass list');
    }
  };
  
  const handleRemoveBypass = async (id) => {
    try {
      await userService.removeFromBypassList(id);
      setBypassList(bypassList.filter(entry => entry._id !== id));
      toast.success('Email removed from bypass list successfully');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to remove email from bypass list');
    }
  };
  
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Email Bypass List" />
        <div className={classes.buttons}>
          <Button 
            text={showAddForm ? "Cancel" : "Add Email"} 
            onClick={() => {
              setShowAddForm(!showAddForm);
              reset();
            }} 
          />
          <Button text="Refresh" onClick={loadBypassList} />
        </div>
      </div>
      
      <div className={classes.description}>
        <p>
          This list contains email addresses that are allowed to register without matching 
          the @snu.edu.in domain requirement. Typically used for admins, shop admins, and delivery personnel.
        </p>
      </div>
      
      {showAddForm && (
        <div className={classes.add_form}>
          <h3>Add Email to Bypass List</h3>
          <form onSubmit={handleSubmit(handleAddBypass)}>
            <div className={classes.form_row}>
              <div className={classes.input_container}>
                <Input
                  type="email"
                  label="Email Address"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,63}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  error={errors.email}
                />
              </div>
              <div className={classes.input_container}>
                <Input
                  type="text"
                  label="Reason (Optional)"
                  {...register('reason')}
                />
              </div>
              <Button type="submit" text="Add" />
            </div>
          </form>
        </div>
      )}
      
      {error && (
        <div className={classes.error_message}>
          <p>{error}</p>
          <Button onClick={loadBypassList} text="Try Again" />
        </div>
      )}
      
      {isLoading ? (
        <p>Loading bypass list...</p>
      ) : (
        <div className={classes.bypass_list}>
          {bypassList.length === 0 ? (
            <p>No emails in bypass list. Add your first email to allow exceptions to the @snu.edu.in requirement.</p>
          ) : (
            <table className={classes.bypass_table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Added By</th>
                  <th>Reason</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bypassList.map(entry => (
                  <tr key={entry._id}>
                    <td>{entry.email}</td>
                    <td>{entry.addedBy?.name || 'N/A'}</td>
                    <td>{entry.reason || 'N/A'}</td>
                    <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className={classes.remove_button}
                        onClick={() => handleRemoveBypass(entry._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}