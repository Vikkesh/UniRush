import axios from 'axios';

export const createOrder = async order => {
  try {
    const { data } = await axios.post('/api/orders/create', order);
    return data;
  } catch (error) {
    throw error; // This will propagate the error up
  }
};

export const getNewOrderForCurrentUser = async () => {
  try {
    const { data } = await axios.get('/api/orders/newOrderForCurrentUser');
    return data;
  } catch (error) {
    throw error;
  }
};

export const pay = async paymentId => {
  try {
    const { data } = await axios.put('/api/orders/pay', { paymentId });
    return data;
  } catch (error) {
    console.error('Payment error:', error);
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

export const getAll = async state => {
  try {
    const { data } = await axios.get(`/api/orders/${state ?? ''}`);
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return []; // Return empty array on error to prevent UI errors
  }
};

export const getAllStatus = async () => {
  try {
    const { data } = await axios.get('/api/orders/allstatus');
    return data;
  } catch (error) {
    console.error('Error fetching order status options:', error);
    return []; // Return empty array on error
  }
};