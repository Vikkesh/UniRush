import React, { useEffect, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAll, getAllStatus } from '../../services/orderService';
import { getAll as getAllShops } from '../../services/shopService';
import { useAuth } from '../../hooks/useAuth';
import { DeliveryVisibleStatus } from '../../constants/orderStatus';
import classes from './ordersPage.module.css';
import Title from '../../components/Title/Title';
import DateTime from '../../components/DateTime/DateTime';
import Price from '../../components/Price/Price';
import NotFound from '../../components/NotFound/NotFound';

const initialState = {
  allStatus: [],
  orders: [],
  shops: [],
  timeFilter: 'all',
  customStartDate: '',
  customEndDate: '',
  selectedShop: 'all'
};

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'ALL_STATUS_FETCHED':
      return { ...state, allStatus: payload };
    case 'ORDERS_FETCHED':
      return { ...state, orders: payload };
    case 'SHOPS_FETCHED':
      return { ...state, shops: payload };
    case 'SET_TIME_FILTER':
      return { ...state, timeFilter: payload };
    case 'SET_CUSTOM_START_DATE':
      return { ...state, customStartDate: payload };
    case 'SET_CUSTOM_END_DATE':
      return { ...state, customEndDate: payload };
    case 'SET_SELECTED_SHOP':
      return { ...state, selectedShop: payload };
    default:
      return state;
  }
};

export default function OrdersPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filter } = useParams();
  const { user } = useAuth();

  const loadOrders = async () => {
    const filters = {};
    
    // Add date filters
    if (state.timeFilter === 'custom') {
      if (state.customStartDate) filters.startDate = state.customStartDate;
      if (state.customEndDate) filters.endDate = state.customEndDate;
    } else if (state.timeFilter !== 'all') {
      const now = new Date();
      switch (state.timeFilter) {
        case 'today':
          filters.startDate = now.toISOString().split('T')[0];
          filters.endDate = filters.startDate;
          break;
        case 'last7days': {
          const last7Days = new Date(now);
          last7Days.setDate(last7Days.getDate() - 6);
          filters.startDate = last7Days.toISOString().split('T')[0];
          filters.endDate = now.toISOString().split('T')[0];
          break;
        }
        case 'last30days': {
          const last30Days = new Date(now);
          last30Days.setDate(last30Days.getDate() - 29);
          filters.startDate = last30Days.toISOString().split('T')[0];
          filters.endDate = now.toISOString().split('T')[0];
          break;
        }
      }
    }
    
    // Add shop filter
    if (state.selectedShop !== 'all') {
      filters.shopId = state.selectedShop;
    }

    const orders = await getAll(filter, filters);
    dispatch({ type: 'ORDERS_FETCHED', payload: orders });
  };

  useEffect(() => {
    getAllStatus().then(status => {
      // If user is delivery personnel, only show relevant statuses
      if (user?.isDelivery && !user?.isAdmin && !user?.isOwner) {
        status = status.filter(s => DeliveryVisibleStatus.includes(s));
      }
      dispatch({ type: 'ALL_STATUS_FETCHED', payload: status });
    });

    getAllShops().then(shops => {
      dispatch({ type: 'SHOPS_FETCHED', payload: shops });
    });
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [filter, state.timeFilter, state.customStartDate, state.customEndDate, state.selectedShop]);

  return (
    <div className={classes.container}>
      <Title
        title="Orders"
        margin="1.5rem 0 0 .2rem"
        fontSize="1.9rem"
      />

      <div className={classes.filters}>
        <div className={classes.filter_group}>
          <label>Time Period:</label>
          <select 
            value={state.timeFilter} 
            onChange={(e) => dispatch({ type: 'SET_TIME_FILTER', payload: e.target.value })}
            className={classes.filter_select}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {state.timeFilter === 'custom' && (
          <div className={classes.date_range}>
            <div className={classes.date_input}>
              <label>From:</label>
              <input 
                type="date" 
                value={state.customStartDate} 
                onChange={(e) => dispatch({ type: 'SET_CUSTOM_START_DATE', payload: e.target.value })}
                max={state.customEndDate || undefined}
              />
            </div>
            <div className={classes.date_input}>
              <label>To:</label>
              <input 
                type="date" 
                value={state.customEndDate} 
                onChange={(e) => dispatch({ type: 'SET_CUSTOM_END_DATE', payload: e.target.value })}
                min={state.customStartDate || undefined}
              />
            </div>
          </div>
        )}
        
        <div className={classes.filter_group}>
          <label>Shop:</label>
          <select 
            value={state.selectedShop} 
            onChange={(e) => dispatch({ type: 'SET_SELECTED_SHOP', payload: e.target.value })}
            className={classes.filter_select}
          >
            <option value="all">All Shops</option>
            {state.shops.map(shop => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.allStatus && (
        <div className={classes.all_status}>
          <Link to="/orders" className={!filter ? classes.selected : ''}>
            All
          </Link>
          {state.allStatus.map(state => (
            <Link
              key={state}
              className={state === filter ? classes.selected : ''}
              to={`/orders/${state}`}
            >
              {state}
            </Link>
          ))}
        </div>
      )}

      {state.orders?.length === 0 && (
        <NotFound
          linkRoute={filter ? '/orders' : '/'}
          linkText={filter ? 'Show All' : 'Go To Home Page'}
        />
      )}

      {state.orders &&
        state.orders.map(order => (
          <div key={order.id} className={classes.order_summary}>
            <div className={classes.header}>
              <span>{order.id}</span>
              <span>
                <DateTime date={order.createdAt} />
              </span>
              <span>{order.status}</span>
            </div>
            <div className={classes.details_section}>
              <div className={classes.shop_info}>
                <strong>Shop:</strong> {order.shopName}
              </div>
              <div className={classes.customer_info}>
                <div><strong>Name:</strong> {order.name}</div>
                <div><strong>Contact:</strong> {order.contact || 'N/A'}</div>
                <div><strong>Address:</strong> {order.address}</div>
              </div>
            </div>
            <div className={classes.items}>
              {order.items.map(item => (
                <div key={item.food.id} className={classes.item_container}>
                  <Link to={`/food/${item.food.id}`}>
                    <img src={item.food.imageUrl} alt={item.food.name} />
                  </Link>
                  <div className={classes.quantity}>x{item.quantity}</div>
                </div>
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