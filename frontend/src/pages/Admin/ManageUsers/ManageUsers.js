import React, { useState, useEffect } from 'react';
import * as userService from '../../../services/userService';
import * as shopService from '../../../services/shopService';
import classes from './manageUsers.module.css';
import Title from '../../../components/Title/Title';
import Button from '../../../components/Button/Button';
import UserForm from './UserForm';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showShopAssignModal, setShowShopAssignModal] = useState(false);
  const [selectedShopIds, setSelectedShopIds] = useState([]);
  const [userForShopAssign, setUserForShopAssign] = useState(null);
  
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
    loadShops();
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
  
  const loadShops = async () => {
    try {
      const response = await shopService.getAll();
      if (Array.isArray(response)) {
        setShops(response);
      } else {
        console.error('API did not return an array for shops:', response);
        setShops([]);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops([]);
    }
  };

  const handleEditClick = (user) => {
    // Check if current user is admin and target user is owner
    if (currentUser && !currentUser.isOwner && currentUser.isAdmin && user.isOwner) {
      toast.error('Admins cannot edit owner accounts');
      return;
    }
    
    setUserToEdit({ ...user });
    setShowForm(true);
  };
  
  const handleToggleBlock = async (user) => {
    // Check if current user is admin and target user is owner
    if (currentUser && !currentUser.isOwner && currentUser.isAdmin && user.isOwner) {
      toast.error('Admins cannot block owner accounts');
      return;
    }
    
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
  
  // New handler for toggling shop admin role
  const handleToggleShopAdmin = async (user) => {
    try {
      const updatedUser = await userService.toggleShopAdminRole(user._id, !user.isShopAdmin);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      toast.success(`User ${updatedUser.isShopAdmin ? 'assigned as shop admin' : 'removed from shop admin role'} successfully`);
      
      // If the user has been made a shop admin, open the shop assignment modal
      if (updatedUser.isShopAdmin) {
        handleAssignShops(updatedUser);
      }
    } catch (error) {
      console.error('Error toggling shop admin role:', error);
      toast.error(error.response?.data || 'Failed to update shop admin role');
    }
  };
  
  // Handler for opening shop assignment modal
  const handleAssignShops = (user) => {
    setUserForShopAssign(user);
    // Set initially selected shops
    setSelectedShopIds(user.managedShops || []);
    setShowShopAssignModal(true);
  };
  
  // Handler for saving shop assignments
  const handleSaveShopAssignments = async () => {
    try {
      const updatedUser = await userService.updateManagedShops(userForShopAssign._id, selectedShopIds);
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      setShowShopAssignModal(false);
      toast.success('Shop assignments saved successfully');
    } catch (error) {
      console.error('Error updating shop assignments:', error);
      toast.error(error.response?.data || 'Failed to update shop assignments');
    }
  };
  
  // Handler for shop checkbox change
  const handleShopCheckboxChange = (shopId) => {
    if (selectedShopIds.includes(shopId)) {
      setSelectedShopIds(selectedShopIds.filter(id => id !== shopId));
    } else {
      setSelectedShopIds([...selectedShopIds, shopId]);
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
        <Button color=" #ece7e7" onClick={loadUsers} text="Refresh" />
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
                    <th>Shop Admin</th>
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
                            checked={user.isShopAdmin} 
                            onChange={() => handleToggleShopAdmin(user)}
                          />
                          {user.isShopAdmin && (
                            <button 
                              className={classes.assign_shops_button}
                              onClick={() => handleAssignShops(user)}
                            >
                              Assign Shops
                            </button>
                          )}
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
                            disabled={currentUser && !currentUser.isOwner && currentUser.isAdmin && user.isOwner}
                          >
                            Edit
                          </button>
                          <button 
                            className={user.isBlocked ? classes.unblock_button : classes.block_button}
                            onClick={() => handleToggleBlock(user)}
                            disabled={(currentUser && user._id === currentUser.id) || 
                                     (currentUser && !currentUser.isOwner && currentUser.isAdmin && user.isOwner)}
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
      
      {/* Shop Assignment Modal */}
      {showShopAssignModal && userForShopAssign && (
        <div className={classes.modal_overlay}>
          <div className={classes.modal_content}>
            <h2>Assign Shops to {userForShopAssign.name}</h2>
            <div className={classes.shops_list}>
              {shops.length === 0 ? (
                <p>No shops available to assign.</p>
              ) : (
                <div>
                  {shops.map(shop => (
                    <div key={shop._id} className={classes.shop_item}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedShopIds.includes(shop._id)}
                          onChange={() => handleShopCheckboxChange(shop._id)}
                        />
                        {shop.name} - {shop.address}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={classes.modal_buttons}>
              <Button onClick={handleSaveShopAssignments} text="Save" />
              <Button onClick={() => setShowShopAssignModal(false)} text="Cancel" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}