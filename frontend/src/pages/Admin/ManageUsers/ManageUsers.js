import React, { useState, useEffect } from 'react';
import * as userService from '../../../services/userService';
import classes from './manageUsers.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import UserForm from './UserForm';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = userService.getUser();
    setCurrentUser(user);
    
    // Check if user is admin or owner, if not redirect
    if (!user || (!user.isAdmin && !user.isOwner)) {
      toast.error('Only admins and owners can access this page');
      navigate('/');
      return;
    }
    
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getAllUsers();
      // Ensure response is an array before setting state
      if (Array.isArray(response)) {
        setUsers(response);
      } else {
        console.error('API did not return an array for users:', response);
        setUsers([]);
        setError('Failed to load users data properly. Server response was not an array.');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setError(`Failed to load users. ${error.response?.data || error.message || 'Check if you have admin privileges.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setUserToEdit({ ...user });
    setShowForm(true);
  };

  const handleToggleBlock = async (user) => {
    try {
      const updatedUser = await userService.toggleBlockUser(user._id, !user.isBlocked);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      toast.success(`User ${updatedUser.isBlocked ? 'blocked' : 'unblocked'} successfully`);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      toast.error(error.response?.data || 'Failed to update user');
    }
  };

  const handleToggleAdmin = async (user) => {
    // Prevent admin from removing their own admin rights
    if (user._id === currentUser.id && user.isAdmin) {
      toast.error('You cannot remove your own admin privileges');
      return;
    }
    
    try {
      const updatedUser = await userService.toggleAdminRole(user._id, !user.isAdmin);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      toast.success(`User ${updatedUser.isAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`);
    } catch (error) {
      console.error('Error toggling user admin role:', error);
      toast.error(error.response?.data || 'Failed to update user role');
    }
  };

  const handleToggleDelivery = async (user) => {
    try {
      const updatedUser = await userService.toggleDeliveryRole(user._id, !user.isDelivery);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      toast.success(`User ${updatedUser.isDelivery ? 'assigned as delivery personnel' : 'removed from delivery role'} successfully`);
    } catch (error) {
      console.error('Error toggling delivery role:', error);
      toast.error(error.response?.data || 'Failed to update delivery role');
    }
  };
  
  // New handler for toggling owner role
  const handleToggleOwner = async (user) => {
    // Prevent owner from removing their own owner rights
    if (user._id === currentUser.id && user.isOwner) {
      toast.error('You cannot remove your own owner privileges');
      return;
    }
    
    try {
      const updatedUser = await userService.toggleOwnerRole(user._id, !user.isOwner);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      toast.success(`User ${updatedUser.isOwner ? 'promoted to owner' : 'demoted from owner'} successfully`);
    } catch (error) {
      console.error('Error toggling user owner role:', error);
      toast.error(error.response?.data || 'Failed to update user role');
    }
  };

  const handleFormSubmit = async (userData) => {
    try {
      const updatedUser = await userService.updateUserByAdmin(userToEdit._id, userData);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      setShowForm(false);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data || 'Failed to update user');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Manage Users" />
        <Button onClick={loadUsers} text="Refresh" />
      </div>

      {error && (
        <div className={classes.error_message}>
          <p>{error}</p>
          <Button onClick={loadUsers} text="Try Again" />
        </div>
      )}

      {showForm ? (
        <UserForm 
          user={userToEdit} 
          onSubmit={handleFormSubmit} 
          onCancel={handleCancelForm} 
        />
      ) : (
        isLoading ? (
          <p>Loading users...</p>
        ) : (
          <div className={classes.users_list}>
            {!Array.isArray(users) || users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <table className={classes.users_table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th>Owner</th>
                    <th>Admin</th>
                    <th>Delivery</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className={user.isBlocked ? classes.blocked_user : ''}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.contact}</td>
                      <td className={classes.address_cell}>{user.address}</td>
                      <td>
                        <div className={classes.checkbox_container}>
                          {currentUser && currentUser.isOwner ? (
                            <input 
                              type="checkbox" 
                              checked={user.isOwner} 
                              onChange={() => handleToggleOwner(user)}
                              disabled={currentUser && user._id === currentUser.id && user.isOwner}
                            />
                          ) : (
                            <span>{user.isOwner ? 'Yes' : 'No'}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={classes.checkbox_container}>
                          <input 
                            type="checkbox" 
                            checked={user.isAdmin} 
                            onChange={() => handleToggleAdmin(user)}
                            disabled={currentUser && user._id === currentUser.id && user.isAdmin}
                          />
                        </div>
                      </td>
                      <td>
                        <div className={classes.checkbox_container}>
                          <input 
                            type="checkbox" 
                            checked={user.isDelivery} 
                            onChange={() => handleToggleDelivery(user)}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={user.isBlocked ? classes.blocked_status : classes.active_status}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className={classes.actions}>
                          <button 
                            className={classes.edit_button}
                            onClick={() => handleEditClick(user)}
                          >
                            Edit
                          </button>
                          <button 
                            className={user.isBlocked ? classes.unblock_button : classes.block_button}
                            onClick={() => handleToggleBlock(user)}
                            disabled={currentUser && user._id === currentUser.id} // Disable blocking own account
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
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