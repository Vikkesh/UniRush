import axios from 'axios';

export const getUser = () =>
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;
      
export const login = async (email, contact, password) => {
  // Only include non-empty values in the request
  const payload = { password };
  if (email) payload.email = email;
  if (contact) payload.contact = contact;
  
  const { data } = await axios.post('/api/users/login', payload);
  localStorage.setItem('user', JSON.stringify(data));
  return data;
};     

// Initiate registration with email and send OTP
export const initiateRegister = async (email) => {
  const { data } = await axios.post('/api/users/register/initiate', { email });
  return data;
};

// Complete registration with OTP verification
export const completeRegister = async (registerData) => {
  const { data } = await axios.post('/api/users/register/complete', registerData);
  localStorage.setItem('user', JSON.stringify(data));
  return data;
};

// Legacy register function
export const register = async registerData => {
  const { data } = await axios.post('/api/users/register', registerData);
  localStorage.setItem('user', JSON.stringify(data));
  return data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const updateProfile = async user => {
  const { data } = await axios.put('/api/users/updateProfile', user);
  localStorage.setItem('user', JSON.stringify(data));
  return data;
};

export const changePassword = async passwords => {
  await axios.put('/api/users/changePassword', passwords);
};

// Admin user management functions
export const getAllUsers = async () => {
  // Get the current user's token
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  // Make the request with proper headers
  const { data } = await axios.get('/api/users/admin/all', {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const updateUserByAdmin = async (userId, userData) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}`, userData, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const toggleBlockUser = async (userId, isBlocked) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/block`, { isBlocked }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const toggleAdminRole = async (userId, isAdmin) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/admin-role`, { isAdmin }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const toggleDeliveryRole = async (userId, isDelivery) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/delivery-role`, { isDelivery }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const toggleOwnerRole = async (userId, isOwner) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/owner-role`, { isOwner }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const toggleShopAdminRole = async (userId, isShopAdmin) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/shop-admin-role`, { isShopAdmin }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const updateManagedShops = async (userId, managedShops) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.put(`/api/users/admin/${userId}/managed-shops`, { managedShops }, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

// Email Bypass List Management Functions
export const getBypassList = async () => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.get('/api/users/admin/bypass-list', {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const addToBypassList = async (email, reason = '') => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.post('/api/users/admin/bypass-list', 
    { email, reason }, 
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
  return data;
};

export const removeFromBypassList = async (id) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.delete(`/api/users/admin/bypass-list/${id}`, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};

export const deleteUser = async (userId) => {
  const user = getUser();
  if (!user || !user.token) {
    throw new Error('Authentication required');
  }
  
  const { data } = await axios.delete(`/api/users/admin/${userId}`, {
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  return data;
};