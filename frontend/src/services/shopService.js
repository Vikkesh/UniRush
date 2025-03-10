import axios from 'axios';

export const getAll = async () => {
    const { data } = await axios.get('/api/shops');
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