import React, { useEffect, useReducer } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAll, getAllStatus, updateOrderStatus } from '../../../services/orderService';
import classes from './manageOrders.module.css';
import Title from '../../../components/Title/Title';
import DateTime from '../../../components/DateTime/DateTime';
import Price from '../../../components/Price/Price';
import NotFound from '../../../components/NotFound/NotFound';
import * as userService from '../../../services/userService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';

const initialState = {};
const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'ALL_STATUS_FETCHED':
      return { ...state, allStatus: payload };
    case 'ORDERS_FETCHED':
      return { ...state, orders: payload };
    case 'ORDER_UPDATED':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === payload.id ? { ...order, status: payload.status } : order
        )
      };
    default:
      return state;
  }
};

export default function ManageOrders() {
  const [{ allStatus, orders }, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get filter from query params
  const queryParams = new URLSearchParams(location.search);
  const queryFilter = queryParams.get('filter');

  useEffect(() => {
    // Set auth token for admin requests
    const user = userService.getUser();
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }

    getAllStatus().then(status => {
      dispatch({ type: 'ALL_STATUS_FETCHED', payload: status });
    });

    getAll(queryFilter).then(orders => {
      dispatch({ type: 'ORDERS_FETCHED', payload: orders });
    });
  }, [queryFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result) {
        dispatch({
          type: 'ORDER_UPDATED',
          payload: { id: orderId, status: newStatus }
        });
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleFilterClick = (status) => {
    // Keep the current section parameter, just change the filter
    const currentSection = queryParams.get('section') || 'orders';
    navigate(`/admin/dashboard?section=${currentSection}&filter=${status}`);
  };

  const getRoleLabel = () => {
    if (user?.isAdmin) return "Admin";
    if (user?.isDelivery) return "Delivery Personnel";
    return "";
  };

  return (
    <div className={classes.container}>
      <div className={classes.roleIndicator}>
        <span>Role: {getRoleLabel()}</span>
      </div>

      <Title
        title="Manage Orders"
        margin="1.5rem 0 0 .2rem"
        fontSize="1.9rem"
      />

      {allStatus && (
        <div className={classes.all_status}>
          <Link
            to={`/admin/dashboard?section=orders`}
            className={!queryFilter ? classes.active : ''}
         >
            All
          </Link>
          {allStatus.map(state => (
            <Link
              key={state}
              to={`/admin/dashboard?section=orders&filter=${state}`}
              className={state === queryFilter ? classes.active : ''}
            >
              {state}
            </Link>
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <NotFound
          linkRoute="/admin/dashboard?section=orders"
          linkText="Show All Orders"
        />
      )}

      {orders &&
        orders.map(order => (
          <div key={order.id} className={classes.order_summary}>
            <div className={classes.header}>
              <span>{order.id}</span>
              <span>
                <DateTime date={order.createdAt} />
              </span>
              <span>{order.status}</span>
              <div className={classes.status_dropdown}>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                >
                  {allStatus?.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={classes.shop_info}>
              <span>Shop: {order.shopName}</span>
            </div>
            <div className={classes.customer_info}>
              <span>
                <strong>Customer:</strong> {order.name}&nbsp;&nbsp;&nbsp;
              </span>
              <span>
                <strong>Phone:</strong> {order.contact || 'N/A'}&nbsp;&nbsp;&nbsp;
              </span>
              <span>
                <strong>Address:</strong> {order.address}
              </span>
            </div>
            <div className={classes.items}>
              {order.items.map(item => (
                <Link key={item.food.id} to={`/food/${item.food.id}`}>
                  <img src={item.food.imageUrl} alt={item.food.name} />
                  <span className={classes.quantity}>x{item.quantity}</span>
                </Link>
              ))}
            </div>
            <div className={classes.footer}>
              <div>
                <Link to={`/track/${order.id}`}>Show Order</Link>
              </div>
              <div>
                <span className={classes.price}>
                  <Price price={order.totalPrice} />
                </span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}