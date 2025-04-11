import axios from 'axios';

export const getAll = async () => {
    const { data } = await axios.get('/api/shops');
    return data;
};

// Function to get shops filtered by user permissions
export const getAdminShops = async () => {
    const { data } = await axios.get('/api/shops/admin');
    return data;
};

export const search = async searchTerm => {
    const { data } = await axios.get('/api/shops/search/' + searchTerm);
    return data;
};

export const getAllTags = async () => {
    const { data } = await axios.get('/api/shops/tags');
    return data;
};

export const getAllByTag = async tag => {
    if (tag === 'All') return getAll();
    const { data } = await axios.get('/api/shops/tag/' + tag);
    return data;
};

export const getById = async shopId => {
    const { data } = await axios.get(`/api/shops/${shopId}`);
    return data;
};

export const getFoodsByShop = async shopId => {
  const { data } = await axios.get('/api/shops/' + shopId + '/foods');
  return data;
};

export const createShop = async shopData => {
  const { data } = await axios.post('/api/shops', shopData);
  return data;
};

export const updateShop = async (shopId, shopData) => {
  const { data } = await axios.put('/api/shops/' + shopId, shopData);
  return data;
};

export const deleteShop = async shopId => {
  const { data } = await axios.delete('/api/shops/' + shopId);
  return data;
};

// Function to toggle shop enabled status
export const toggleShopEnabled = async (shopId, enabled) => {
  const { data } = await axios.patch(`/api/shops/${shopId}/toggle-enabled`, { enabled });
  return data;
};

// Function to toggle all shops enabled status
export const toggleAllShopsEnabled = async (enabled) => {
  const { data } = await axios.patch(`/api/shops/toggle-all-shops`, { enabled });
  return data;
};