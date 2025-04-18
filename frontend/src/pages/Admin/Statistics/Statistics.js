import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStatistics } from '../../../services/orderService';
import { getAdminShops } from '../../../services/shopService';
import { getAllStatus } from '../../../services/orderService';
import classes from './statistics.module.css';
import Title from '../../../components/Title/Title';
import DateTime from '../../../components/DateTime/DateTime';
import Price from '../../../components/Price/Price';
import { toast } from 'react-toastify';
import { useAuth } from '../../../hooks/useAuth';

export default function Statistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for statistics data
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('all');
  const [showAllOrders, setShowAllOrders] = useState(false);

  // State for available options
  const [shops, setShops] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  
  // Load shops and status options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [shopsData, statusData] = await Promise.all([
          getAdminShops(),
          getAllStatus()
        ]);
        
        setShops(shopsData || []);
        setStatusOptions(['ALL', ...(statusData || [])]);
      } catch (error) {
        console.error('Error loading filter options:', error);
        toast.error('Failed to load filter options');
      }
    };
    
    loadFilterOptions();
  }, []);
  
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
    
    switch (timeFilter) {
      case 'today': {
        // Just use the date part for "today" to include all orders from the current date
        // This will be converted to proper IST timezone range in the backend
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
        
      case 'thisMonth': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: formatDate(firstDayOfMonth),
          endDate: formatDate(now)
        };
      }
        
      case 'lastMonth': {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: formatDate(firstDayLastMonth),
          endDate: formatDate(lastDayLastMonth)
        };
      }
        
      case 'custom':
        return {
          startDate: customStartDate,
          endDate: customEndDate
        };
        
      default:
        return {};
    }
  };
  
  // Fetch statistics based on current filters
  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dateRange = getDateRange();
      const filters = {
        ...dateRange,
        status: statusFilter,
        shopId: shopFilter
      };
      
      const data = await getStatistics(filters);
      console.log('Statistics data received:', data);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setError('Failed to load sales statistics. Please try again later.');
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };
  
  // Load statistics when filters change
  useEffect(() => {
    if (
      (timeFilter !== 'custom') || 
      (timeFilter === 'custom' && customStartDate && customEndDate)
    ) {
      loadStatistics();
    }
  }, [timeFilter, statusFilter, shopFilter, customStartDate, customEndDate]);
  
  // Handle custom date range changes
  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      loadStatistics();
    }
  };
  
  // Calculate percentage change between two values
  const calculatePercentage = (current, previous) => {
    if (!previous) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
  };
  
  // Get class name based on percentage
  const getChangeClass = (change) => {
    if (!change) return '';
    return change.startsWith('+') ? classes.positive_change : classes.negative_change;
  };

  // Ensure statistics and summary exist before rendering the chart
  const renderStatusChart = () => {
    if (!statistics?.summary?.orderCount || !statistics?.statusStats?.length) {
      return null;
    }
    
    return statistics.statusStats.map(status => (
      <div 
        key={status.status}
        className={`${classes.status_bar} ${classes[`status_${status.status.toLowerCase()}`]}`}
        style={{ 
          width: `${(status.count / statistics.summary.orderCount) * 100}%`,
        }}
        title={`${status.status}: ${status.count} orders (${((status.count / statistics.summary.orderCount) * 100).toFixed(1)}%)`}
      >
        <span className={classes.status_label}>
          {status.status} ({status.count})
        </span>
      </div>
    ));
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Title title="Sales Statistics" margin="1rem 0" fontSize="1.9rem" />
        <button onClick={loadStatistics} className={classes.refresh_button}>
          Refresh Data
        </button>
      </div>
      
      <div className={classes.filters}>
        <div className={classes.filter_group}>
          <label>Time Period:</label>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className={classes.filter_select}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {timeFilter === 'custom' && (
          <div className={classes.custom_date_range}>
            <div className={classes.date_input}>
              <label>From:</label>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate || undefined}
              />
            </div>
            <div className={classes.date_input}>
              <label>To:</label>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate || undefined}
              />
            </div>
            <button 
              onClick={handleCustomDateSubmit}
              className={classes.apply_button}
              disabled={!customStartDate || !customEndDate}
            >
              Apply
            </button>
          </div>
        )}
        
        <div className={classes.filter_group}>
          <label>Order Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={classes.filter_select}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        
        <div className={classes.filter_group}>
          <label>Shop:</label>
          <select 
            value={shopFilter} 
            onChange={(e) => setShopFilter(e.target.value)}
            className={classes.filter_select}
          >
            <option value="all">All Shops</option>
            {shops
              .filter(shop => user.isAdmin || shop.adminId === user._id)
              .map(shop => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className={classes.loading}>Loading statistics...</div>
      ) : error ? (
        <div className={classes.error}>{error}</div>
      ) : statistics ? (
        <div className={classes.statistics_container}>
          <div className={classes.summary_cards}>
            <div className={classes.summary_card}>
              <h3>Orders</h3>
              <div className={classes.card_content}>
                <div className={classes.card_value}>{statistics.summary?.orderCount || 0}</div>
              </div>
            </div>
            
            <div className={classes.summary_card}>
              <h3>Items Total (incl. GST)</h3>
              <div className={classes.card_content}>
                <div className={classes.card_value}>
                  <Price price={(statistics.summary?.itemsTotalFee || 0) + (statistics.summary?.gstAmount || 0)} />
                </div>
              </div>
            </div>
            
            <div className={classes.summary_card}>
              <h3>Delivery Fees</h3>
              <div className={classes.card_content}>
                <div className={classes.card_value}>
                  <Price price={statistics.summary?.deliveryFee || 0} />
                </div>
              </div>
            </div>
            
            <div className={classes.summary_card}>
              <h3>Total Revenue</h3>
              <div className={classes.card_content}>
                <div className={classes.card_value}>
                  <Price price={statistics.summary?.totalSalesRevenue || 0} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Shop performance section */}
          {statistics.shopStats && statistics.shopStats.length > 0 && (
            <div className={classes.section}>
              <h3>Shop Performance</h3>
              <div className={classes.shop_stats_container}>
                <table className={classes.stats_table}>
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Orders</th>
                      <th>Items Total (incl. GST)</th>
                      <th>Delivery Fees</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.shopStats.map(shop => (
                      <tr key={shop.shopId}>
                        <td>{shop.shopName}</td>
                        <td>{shop.orderCount}</td>
                        <td><Price price={(shop.itemsTotal || 0) + (shop.gstAmount || 0)} /></td>
                        <td><Price price={shop.deliveryFee} /></td>
                        <td><Price price={shop.revenue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Status breakdown section */}
          {statistics.statusStats && statistics.statusStats.length > 0 && (
            <div className={classes.section}>
              <h3>Orders by Status</h3>
              <div className={classes.status_stats_container}>
                <div className={classes.status_chart}>
                  {renderStatusChart()}
                </div>
                
                <table className={classes.stats_table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.statusStats.map(status => (
                      <tr key={status.status}>
                        <td>
                          <span className={`${classes.status_indicator} ${classes[`status_${status.status.toLowerCase()}`]}`}></span>
                          {status.status}
                        </td>
                        <td>{status.count}</td>
                        <td><Price price={status.revenue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Daily trends section */}
          {statistics.dailyStats && statistics.dailyStats.length > 0 && (
            <div className={classes.section}>
              <h3>Daily Revenue Trends</h3>
              <div className={classes.daily_stats_container}>
                <div className={classes.chart_container}>
                  <div className={classes.chart_bars}>
                    {statistics.dailyStats.map(day => {
                      // Find the maximum revenue value for scaling
                      const maxRevenue = Math.max(...statistics.dailyStats.map(d => d.revenue));
                      return (
                        <div key={day.date} className={classes.chart_bar_container}>
                          <div 
                            className={classes.chart_bar}
                            style={{ 
                              height: maxRevenue > 0 ? 
                                `${(day.revenue / maxRevenue) * 100}%` : '0%' 
                            }}
                            title={`${day.date}: ₹${day.revenue.toFixed(2)} from ${day.orders} orders`}
                          ></div>
                          <div className={classes.chart_label}>{day.date.split('-').slice(1).join('/')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Recent orders section */}
          {statistics.orders && statistics.orders.length > 0 && (
            <div className={classes.section}>
              <div className={classes.section_header}>
                <h3>Recent Orders</h3>
                <button 
                  onClick={() => setShowAllOrders(!showAllOrders)}
                  className={classes.toggle_button}
                >
                  {showAllOrders ? 'Show Recent' : 'Show All'}
                </button>
              </div>
              <div className={classes.recent_orders}>
                <table className={classes.stats_table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Shop</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Items Total (incl. GST)</th>
                      <th>Delivery Fee</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllOrders ? statistics.orders : statistics.orders.slice(0, 10)).map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td><DateTime date={order.createdAt} options={{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></td>
                        <td>{order.shopName}</td>
                        <td>
                          <span className={`${classes.status_pill} ${classes[`status_${order.status.toLowerCase()}`]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.items}</td>
                        <td><Price price={(order.itemsTotal || 0) + (order.gstAmount || 0)} /></td>
                        <td><Price price={order.deliveryFee} /></td>
                        <td><Price price={order.totalPrice} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!showAllOrders && statistics.orders.length > 10 && (
                  <div className={classes.show_more}>
                    <span>{statistics.orders.length - 10} more orders match your filters</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={classes.no_data}>No sales data available for the selected filters.</div>
      )}
    </div>
  );
}