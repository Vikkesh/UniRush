import axios from 'axios';

export const getAll = async () => {
    const { data } = await axios.get('/api/foods');
    return data;
};

// Function to get foods filtered by user permissions
export const getAdminFoods = async () => {
    const { data } = await axios.get('/api/foods/admin');
    return data;
};

export const search = async searchTerm => {
    const { data } = await axios.get('/api/foods/search/' + searchTerm);
    return data;
};

export const getAllTags = async () => {
    const { data } = await axios.get('/api/foods/tags');
    return data;
};

export const getAllByTag = async tag => {
    if (tag === 'All') return getAll();
    const { data } = await axios.get('/api/foods/tag/' + tag);
    return data;
};

export const getById = async foodId => {
    const { data } = await axios.get(`/api/foods/${foodId}`);
    return data;
};

// Admin functions for managing food items
export const createFood = async foodData => {
    const { data } = await axios.post('/api/foods', foodData);
    return data;
};

export const updateFood = async (foodId, foodData) => {
    const { data } = await axios.put('/api/foods/' + foodId, foodData);
    return data;
};

export const deleteFood = async foodId => {
    const { data } = await axios.delete('/api/foods/' + foodId);
    return data;
};

// Function to toggle food visibility
export const toggleFoodEnabled = async (foodId, enabled) => {
    const { data } = await axios.patch(`/api/foods/${foodId}/toggle-enabled`, { enabled });
    return data;
};

// Function to toggle all foods for a shop
export const toggleAllFoodsForShop = async (shopId, enabled) => {
    const { data } = await axios.patch(`/api/foods/shop/${shopId}/toggle-all`, { enabled });
    return data;
};

// Add bulk import function
export const bulkImportFoods = async (file, shopId) => {
    const formData = new FormData();
    formData.append('spreadsheet', file);
    formData.append('shop', shopId);
    
    const { data } = await axios.post('/api/foods/bulk-import', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return data;
};