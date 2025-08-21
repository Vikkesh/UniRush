import React, { useEffect, useReducer } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAll, getAllStatus, updateOrderStatus } from '../../../services/orderService';
import { getAdminShops } from '../../../services/shopService';
import classes from './manageOrders.module.css';
import Title from '../../../components/Title/Title';
import DateTime from '../../../components/DateTime/DateTime';
import Price from '../../../components/Price/Price';
import NotFound from '../../../components/NotFound/NotFound';
import * as userService from '../../../services/userService';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import { OrderStatus, DeliveryVisibleStatus } from '../../../constants/orderStatus';

const initialState = {
  allStatus: [],
  filteredStatus: [], // New state to hold filtered statuses
  orders: [],
  shops: [],
  timeFilter: 'all',
  customStartDate: '',
  customEndDate: '',
  selectedShop: 'all',
  showAllOrders: false, // New state for show all toggle
};

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'ALL_STATUS_FETCHED':
      return { ...state, allStatus: payload };
    case 'FILTERED_STATUS_SET':
      return { ...state, filteredStatus: payload };
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
    case 'ORDER_UPDATED':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === payload.id ? { ...order, status: payload.status } : order
        )
      };
    case 'TOGGLE_SHOW_ALL':
      return { ...state, showAllOrders: !state.showAllOrders };
    default:
      return state;
  }
};

export default function ManageOrders() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine if the user is a shop admin without admin/owner privileges
  const isShopAdminOnly = user?.isShopAdmin && !user?.isAdmin && !user?.isOwner;
  
  // Get filter from query params
  const queryParams = new URLSearchParams(location.search);
  const queryFilter = queryParams.get('filter');
  
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
    
    const orders = await getAll(queryFilter, filters);
    dispatch({ type: 'ORDERS_FETCHED', payload: orders });
  };
  
  useEffect(() => {
    // Set auth token for admin requests
    const user = userService.getUser();
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
    
    // Get all statuses and filter them for delivery personnel
    getAllStatus().then(statuses => {
      dispatch({ type: 'ALL_STATUS_FETCHED', payload: statuses });
      
      // If user is delivery personnel and not admin/owner, filter the statuses
      if (user && user.isDelivery && !user.isAdmin && !user.isOwner) {
        const deliveryStatuses = statuses.filter(status => DeliveryVisibleStatus.includes(status));
        dispatch({ type: 'FILTERED_STATUS_SET', payload: deliveryStatuses });
      } else {
        dispatch({ type: 'FILTERED_STATUS_SET', payload: statuses });
      }
    });
    
    // Load shops for the filter - Use the admin endpoint to get filtered shops by permission
    const loadShops = async () => {
      const shops = await getAdminShops();
      dispatch({ type: 'SHOPS_FETCHED', payload: shops });
      
      // If shop admin with only one shop, pre-select it in the filter
      if (isShopAdminOnly && user.managedShops && user.managedShops.length === 1 && shops.length === 1) {
        dispatch({ type: 'SET_SELECTED_SHOP', payload: shops[0]._id });
      }
    };
    
    loadShops();
  }, [user, isShopAdminOnly]);
  
  useEffect(() => {
    loadOrders();
  }, [queryFilter, state.timeFilter, state.customStartDate, state.customEndDate, state.selectedShop]);
  
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      // If delivery personnel, validate status change
      if (user && user.isDelivery && !user.isAdmin && !user.isOwner) {
        if (!DeliveryVisibleStatus.includes(newStatus)) {
          toast.error('You are not authorized to set this status');
          return;
        }
      }
      
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
  
  // Helper function to handle order acceptance
  const handleAcceptOrder = async (orderId) => {
    await handleUpdateStatus(orderId, OrderStatus.ACCEPTED);
  };
  
  // Helper function to handle order cancellation
  const handleCancelOrder = async (orderId) => {
    await handleUpdateStatus(orderId, OrderStatus.CANCELLED);
  };
  
  const handleFilterClick = (status) => {
    // Ensure navigation sets both the section to 'orders' and the selected filter.
    // This will correctly update the URL even if this function is somehow triggered
    // while the URL's section parameter is different.
    navigate(`/admin/dashboard?section=orders&filter=${status}`);
  };
  
  const getRoleLabel = () => {
    if (user?.isOwner) return "Owner";
    if (user?.isAdmin) return "Admin";
    if (user?.isShopAdmin) return "Shop Admin";
    if (user?.isDelivery) return "Delivery Personnel";
    return "";
  };

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
            disabled={isShopAdminOnly && state.shops.length === 1}
          >
            {/* Only show "All Shops" option if not a shop admin with single shop */}
            {(!isShopAdminOnly || state.shops.length > 1) && (
              <option value="all">All Shops</option>
            )}
            {state.shops.map(shop => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {state.filteredStatus && (
        <div className={classes.all_status}>
          <Link
            to="/admin/dashboard?section=orders"
            className={!queryFilter ? classes.active : ''}
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin/dashboard?section=orders');
            }}
          >
            <span>All</span>
          </Link>
          {state.filteredStatus.map(status => (
            <Link
              key={status}
              to={`/admin/dashboard?section=orders&filter=${status}`}
              className={`${status === queryFilter ? classes.active : ''} ${classes['status_' + status.toLowerCase()]}`}
              onClick={(e) => {
                e.preventDefault();
                handleFilterClick(status);
              }}
            >
              <span>{status}</span>
            </Link>
          ))}
        </div>
      )}
      
      {state.orders?.length === 0 && (
        <NotFound
          linkRoute="/admin/dashboard?section=orders"
          linkText="Show All Orders"
        />
      )}
      
      <div className={classes.orders_scrollable_container}>
        {getDisplayedOrders().map(order => (
          <div key={order.id} className={classes.order_summary}>
            <div className={classes.header}>
              <div className={classes.order_id}>
                <span className={classes.label}>Order ID:</span> 
                <span className={classes.value}>{order.orderId || order.id}</span>
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
              
              {/* Shop admin quick action buttons for PAID orders */}
              {user?.isShopAdmin && order.status === OrderStatus.PAID && (
                <div className={classes.shop_admin_actions}>
                  <button 
                    className={`${classes.action_button} ${classes.accept_button}`}
                    onClick={() => handleAcceptOrder(order.orderId || order.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className={`${classes.action_button} ${classes.cancel_button}`}
                    onClick={() => handleCancelOrder(order.orderId || order.id)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <div className={classes.status_dropdown}>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.orderId || order.id, e.target.value)}
                >
                  {state.filteredStatus?.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={classes.shop_info}>
              <strong>Shop:</strong> {order.shopName}
            </div>
           {user && (user.isAdmin || user.isOwner || user.isDelivery  ) && ( 
            <div className={classes.customer_info}>
              <div><strong>Name:</strong> {order.name}</div>
              <div><strong>Phone:</strong> {order.contact }</div>
              <div><strong>Address:</strong> {order.address}</div>
            </div>
           )}
            {user && (user.isAdmin || user.isOwner || user.isShopAdmin  ) && (  
            <div className={classes.items_section}>
              <h3>Order Items</h3>
              <div className={classes.items_list}>
                {order.items.map(item => (
                  <div key={item.food?._id || item._id || `item-${Math.random()}`} className={classes.item_row}>
                    <div className={classes.item_name}>
                      {item.food? (
                        <Link to={`/food/${item.food._id}`}>{item.food.name}</Link>
                      ) : item.name ? (
                        <span>{item.name}</span>
                      ) : (
                        <span>Deleted Food Item</span>
                      )}
                    </div>
                    <div className={classes.item_quantity}>
                      x{item.quantity}
                    </div>
                    <div className={classes.item_price}>
                      <Price price={item.price} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
            
            <div className={classes.footer}>
              <div>
                <Link to={`/track/${order.orderId || order.id}`}>Show Order</Link>
              </div>
              <div className={classes.total_price}>
                <span className={classes.total_label}>Total: </span>
                <span className={classes.price}>
                  <Price price={order.totalPrice} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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