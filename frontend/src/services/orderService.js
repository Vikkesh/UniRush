import axios from 'axios';

export const createOrder = async order => {
  try {
    const { data } = await axios.post('/api/orders/create', order);
    return data;
  } catch (error) {
    throw error;
  }
};

export const trackOrderById = async orderId => {
  try {
    const { data } = await axios.get(`/api/orders/track/${orderId}`);
    return data;
  } catch (error) {
    console.error('Order tracking error:', error);
    throw error;
  }
};

export const getAll = async (state, filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.shopId && filters.shopId !== 'all') {
      params.append('shopId', filters.shopId);
    }
    
    const url = `/api/orders/${state ?? ''}?${params.toString()}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getAllStatus = async () => {
  try {
    const { data } = await axios.get('/api/orders/allstatus');
    return data;
  } catch (error) {
    console.error('Error fetching order status options:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const { data } = await axios.put(`/api/orders/${orderId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const getStatistics = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.shopId) {
      params.append('shopId', filters.shopId);
    }
    
    const { data } = await axios.get(`/api/orders/statistics?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    throw error;
  }
};