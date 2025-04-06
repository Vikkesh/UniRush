import React, { useEffect, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAll, getAllStatus } from '../../services/orderService';
import { getAll as getAllShops } from '../../services/shopService';
import { useAuth } from '../../hooks/useAuth';
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
  selectedShop: 'all',
  showAllOrders: false // New state for show all toggle
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
    case 'TOGGLE_SHOW_ALL':
      return { ...state, showAllOrders: !state.showAllOrders };
    default:
      return state;
  }
};

export default function OrdersPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filter } = useParams();
  const { user } = useAuth();

  // Toggle between showing all orders and limited orders
  const toggleShowAll = () => {
    dispatch({ type: 'TOGGLE_SHOW_ALL' });
  };

  // Get orders to display based on showAllOrders state
  const getDisplayedOrders = () => {
    if (state.showAllOrders || state.orders.length <= 10) {
      return state.orders;
    }
    return state.orders.slice(0, 10);
  };

  // Helper function to format dates in YYYY-MM-DD format
  // This format works correctly with backend filtering
  const formatDate = (date) => {
    // Ensure we're working with a copy of the date
    const d = new Date(date);
    
    // Format with YYYY-MM-DD for API consistency
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  // Calculate date ranges based on time filter
  const getDateRange = () => {
    // Create dates based on current time in local timezone
    const now = new Date();
    
    switch (state.timeFilter) {
      case 'today': {
        // Just use the date part for "today" to include all orders from the current date
        const todayDate = formatDate(now);
        return {
          startDate: todayDate,
          endDate: todayDate
        };
      }
      
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: formatDate(yesterday),
          endDate: formatDate(yesterday)
        };
      }
        
      case 'last7days': {
        const last7Days = new Date(now);
        last7Days.setDate(last7Days.getDate() - 6);
        return {
          startDate: formatDate(last7Days),
          endDate: formatDate(now)
        };
      }
        
      case 'last30days': {
        const last30Days = new Date(now);
        last30Days.setDate(last30Days.getDate() - 29);
        return {
          startDate: formatDate(last30Days),
          endDate: formatDate(now)
        };
      }
      
      case 'custom':
        return {
          startDate: state.customStartDate,
          endDate: state.customEndDate
        };
        
      default:
        return {};
    }
  };

  const loadOrders = async () => {
    if (!user || !user.id) {
      console.log('User not loaded yet, skipping order fetch');
      return;
    }

    const filters = {};
    
    // Add date filters
    if (state.timeFilter === 'custom') {
      if (state.customStartDate) filters.startDate = state.customStartDate;
      if (state.customEndDate) filters.endDate = state.customEndDate;
    } else if (state.timeFilter !== 'all') {
      const dateRange = getDateRange();
      filters.startDate = dateRange.startDate;
      filters.endDate = dateRange.endDate;
    }
    
    // Add shop filter
    if (state.selectedShop !== 'all') {
      filters.shopId = state.selectedShop;
    }
    
    // CRITICAL: Always add the current user ID as a filter
    // This ensures OrdersPage only shows the current user's orders
    // regardless of their role
    filters.userId = user.id;

    console.log('Fetching orders with filters:', filters);
    const orders = await getAll(filter, filters);
    console.log('Orders fetched:', orders.length);
    dispatch({ type: 'ORDERS_FETCHED', payload: orders });
  };

  useEffect(() => {
    // Load all order statuses without any role-based filtering
    getAllStatus().then(statuses => {
      dispatch({ type: 'ALL_STATUS_FETCHED', payload: statuses });
    });

    // Fetch all shops for the filter dropdown, regardless of user role
    const loadShops = async () => {
      try {
        // Get all shops for the user to filter their orders by
        const shops = await getAllShops();
        dispatch({ type: 'SHOPS_FETCHED', payload: shops });
      } catch (error) {
        console.error('Error fetching shops:', error);
        dispatch({ type: 'SHOPS_FETCHED', payload: [] });
      }
    };
    
    loadShops();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      loadOrders();
    }
  }, [filter, state.timeFilter, state.customStartDate, state.customEndDate, state.selectedShop, user]);

  return (
    <div className={classes.container}>
      <Title
        title="My Orders"
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
        <div className={classes.status_filter_container}>
          <div className={classes.all_status}>
            <Link to="/orders" className={`${classes.status_pill} ${!filter ? classes.selected : ''}`}>
              <span>All</span>
            </Link>
            {state.allStatus.map(status => (
              <Link
                key={status}
                className={`${classes.status_pill} ${status === filter ? classes.selected : ''} ${classes['status_' + status.toLowerCase()]}`}
                to={`/orders/${status}`}
              >
                <span>{status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {state.orders?.length === 0 && (
        <NotFound
          linkRoute={filter ? '/orders' : '/'}
          linkText={filter ? 'Show All' : 'Go To Home Page'}
        />
      )}

      {getDisplayedOrders().map(order => (
        <div key={order.id} className={classes.order_summary}>
          <div className={classes.header}>
            <div className={classes.order_id}>
              <span className={classes.label}>Order ID:</span> 
              <span className={classes.value}>{order.id}</span>
            </div>
            <div className={classes.order_date}>
              <span className={classes.label}>Date:</span>
              <span className={classes.value}>
                <DateTime date={order.createdAt} />
              </span>
            </div>
            <div className={classes.order_status}>
              <span className={`${classes.status_badge} ${classes['status_' + order.status.toLowerCase()]}`}>
                {order.status}
              </span>
            </div>
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
          
          <div className={classes.items_section}>
            <h3>Order Items</h3>
            <div className={classes.items_list}>
              {order.items.map(item => (
                <div key={item.food?.id || `item-${Math.random()}`} className={classes.item_row}>
                  <div className={classes.item_name}>
                    {item.food ? (
                      <Link to={`/food/${item.food.id}`}>{item.food.name}</Link>
                    ) : (
                      <span>Deleted Food Item</span>
                    )}
                  </div>
                  <div className={classes.item_quantity}>
                    x{item.quantity}
                  </div>
                  <div className={classes.item_price}>
                    <Price price={item.price * item.quantity} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={classes.footer}>
            <div className={classes.track_button}>
              <Link to={`/track/${order.id}`} className={classes.track_link}>
                Track Order
              </Link>
            </div>
            <div className={classes.total_price}>
              <span className={classes.total_label}>Total:</span>
              <span className={classes.price}>
                <Price price={order.totalPrice} />
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Show All / Show Less button */}
      {state.orders && state.orders.length > 10 && (
        <div className={classes.show_all_container}>
          <button 
            onClick={toggleShowAll}
            className={classes.toggle_button}
          >
            {state.showAllOrders ? 'Show Less' : 'Show All'}
          </button>
          {!state.showAllOrders && (
            <div className={classes.show_more}>
              <span>{state.orders.length - 10} more orders match your filters</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}