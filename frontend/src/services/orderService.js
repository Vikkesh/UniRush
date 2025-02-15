import axios from 'axios';

export const createOrder = async order => {
  try {
    const { data } = axios.post('/api/orders/create', order);
    return data;
  } catch (error) {}
};

export const getNewOrderForCurrentUser = async () => {

    const { data } = await axios.get('/api/orders/newOrderForCurrentUser');
    return data;

};
