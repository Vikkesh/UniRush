import { Router } from 'express';
import handler from 'express-async-handler';
import auth from '../middleware/auth.mid.js';
import { BAD_REQUEST, UNAUTHORIZED } from '../constants/httpStatus.js';
import { OrderModel } from '../models/order.model.js';
import { OrderStatus } from '../constants/orderStatus.js';
import { UserModel } from '../models/user.model.js';
import { ShopModel } from '../models/shop.model.js';

const router = Router();
router.use(auth);

router.post(
    '/create',
    handler(async (req, res) => {
        try {
            const order = req.body;
            
            if (!order.items || order.items.length <= 0) {
                return res.status(BAD_REQUEST).send('Cart Is Empty!');
            }

            // Ensure shop information is included
            if (!order.shopId) {
                return res.status(BAD_REQUEST).send('Shop information is required!');
            }

            // Get shop details to ensure we have the correct name
            const shop = await ShopModel.findById(order.shopId);
            if (!shop) {
                return res.status(BAD_REQUEST).send('Shop not found!');
            }
            
            // Delete any existing NEW orders for this user
            await OrderModel.deleteOne({
                user: req.user.id,
                status: OrderStatus.NEW,
            });

            // Validate order totals
            const itemsTotal = order.itemsTotal || order.items.reduce((total, item) => total + item.price, 0);
            const deliveryFee = order.deliveryFee || 0;
            const totalPrice = itemsTotal + deliveryFee;
            
            // Create new order with validated totals
            const newOrder = new OrderModel({
                ...order,
                user: req.user.id,
                status: OrderStatus.NEW,
                shopName: shop.name,
                itemsTotal,
                deliveryFee,
                totalPrice
            });
            
            await newOrder.save();
            res.send(newOrder);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(BAD_REQUEST).send('Failed to create order');
        }
    })
);

router.put(
    '/pay',
    handler(async (req, res) => {
        try {
            const { paymentId } = req.body;
            const order = await getNewOrderForCurrentUser(req);
            if (!order) {
                return res.status(BAD_REQUEST).send('Order Not Found!');
            }
            
            order.paymentId = paymentId;
            order.status = OrderStatus.PAID;
            await order.save();
            
            res.send(order._id);
        } catch (error) {
            console.error('Error processing payment:', error);
            res.status(BAD_REQUEST).send('Payment failed');
        }
    })
);

router.get(
    '/track/:orderId',
    handler(async (req, res) => {
        try {
            const { orderId } = req.params;
            const user = await UserModel.findById(req.user.id);
            
            const filter = { _id: orderId };
            
            // Check if user exists and is not admin, owner or delivery, then filter by user
            if (user) {
                if (!user.isAdmin && !user.isDelivery && !user.isOwner) {
                    filter.user = user._id;
                }
            } else {
                filter.user = req.user.id;
            }
            
            const order = await OrderModel.findOne(filter).populate('shopId');
            if (!order) {
                return res.status(UNAUTHORIZED).send('Order not found');
            }
            
            return res.send(order);
        } catch (error) {
            console.error('Error tracking order:', error);
            res.status(BAD_REQUEST).send('Failed to track order');
        }
    })
);

router.get(
    '/newOrderForCurrentUser',
    handler(async (req, res) => {
        try {
            const order = await getNewOrderForCurrentUser(req);
            if (order) {
                res.send(order);
            } else {
                res.status(BAD_REQUEST).send('No active order found');
            }
        } catch (error) {
            console.error('Error fetching new order:', error);
            res.status(BAD_REQUEST).send('Failed to fetch order');
        }
    })
);

router.get('/allstatus', (req, res) => {
    try {
        const allStatus = Object.values(OrderStatus);
        res.send(allStatus);
    } catch (error) {
        console.error('Error fetching status options:', error);
        res.status(BAD_REQUEST).send('Failed to fetch status options');
    }
});

// New endpoint for fetching sales statistics with filtering options
router.get(
    '/statistics',
    handler(async (req, res) => {
        try {
            // Verify user is admin or owner
            const user = await UserModel.findById(req.user.id);
            if (!user || (!user.isAdmin && !user.isOwner)) {
                return res.status(UNAUTHORIZED).send('Only admins or owners can access statistics');
            }

            // Parse query parameters
            const { 
                startDate, 
                endDate, 
                status, 
                shopId 
            } = req.query;

            // Build filter object
            const filter = {};

            // Date range filter with proper UTC handling
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    // Set to start of day in UTC
                    const startDateTime = new Date(startDate);
                    startDateTime.setUTCHours(0, 0, 0, 0);
                    filter.createdAt.$gte = startDateTime;
                }
                if (endDate) {
                    // Set to end of day in UTC
                    const endDateTime = new Date(endDate);
                    endDateTime.setUTCHours(23, 59, 59, 999);
                    filter.createdAt.$lte = endDateTime;
                }
            }

            // Status filter
            if (status && status !== 'ALL') {
                filter.status = status;
            }

            // Shop filter (for owner view)
            if (shopId && shopId !== 'all') {
                filter.shopId = shopId;
            }

            // Fetch filtered orders
            const orders = await OrderModel.find(filter)
                .populate('shopId', 'name')
                .sort('-createdAt');

            // Get all active shops for proper categorization
            const activeShops = await ShopModel.find({}, '_id name');
            const activeShopIds = new Set(activeShops.map(shop => shop._id.toString()));

            // Calculate aggregated statistics
            let itemsTotalFee = 0;
            let deliveryFee = 0;
            let totalSalesRevenue = 0;
            let orderCount = orders.length;

            // Group orders by shop
            const shopStats = {};
            const statusStats = {};
            const dailyStats = {};

            // Create a special category for orders with missing/deleted shops
            shopStats['deleted'] = {
                shopId: 'deleted',
                shopName: 'Deleted/Unknown Shops',
                orderCount: 0,
                revenue: 0,
                deliveryFee: 0,
                itemsTotal: 0
            };

            // Process orders for statistics
            orders.forEach(order => {
                // Use stored values directly
                const orderTotalPrice = Number(order.totalPrice) || 0;
                const orderDeliveryFee = Number(order.deliveryFee) || 0;
                const orderItemsTotal = Number(order.itemsTotal) || 0;
                
                // Add to aggregated totals
                itemsTotalFee += orderItemsTotal;
                deliveryFee += orderDeliveryFee;
                totalSalesRevenue += orderTotalPrice;

                // Determine shop category
                let shopId;
                let shopName;
                
                if (order.shopId && activeShopIds.has(order.shopId._id.toString())) {
                    // This is an active shop
                    shopId = order.shopId._id.toString();
                    shopName = order.shopId.name;
                } else {
                    // This is a deleted/unknown shop
                    shopId = 'deleted';
                    shopName = order.shopName || 'Unknown Shop';
                }
                
                if (!shopStats[shopId] && shopId !== 'deleted') {
                    // Only create new entries for active shops
                    shopStats[shopId] = {
                        shopId,
                        shopName,
                        orderCount: 0,
                        revenue: 0,
                        deliveryFee: 0,
                        itemsTotal: 0
                    };
                }
                
                shopStats[shopId].orderCount += 1;
                shopStats[shopId].revenue += orderTotalPrice;
                shopStats[shopId].deliveryFee += orderDeliveryFee;
                shopStats[shopId].itemsTotal += orderItemsTotal;

                // Group by status
                const status = order.status;
                if (!statusStats[status]) {
                    statusStats[status] = {
                        status,
                        count: 0,
                        revenue: 0
                    };
                }
                statusStats[status].count += 1;
                statusStats[status].revenue += orderTotalPrice;

                // Group by day for time-series data
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                if (!dailyStats[orderDate]) {
                    dailyStats[orderDate] = {
                        date: orderDate,
                        orders: 0,
                        revenue: 0
                    };
                }
                dailyStats[orderDate].orders += 1;
                dailyStats[orderDate].revenue += orderTotalPrice;
            });

            // If no deleted shop orders, remove the category
            if (shopStats['deleted'].orderCount === 0) {
                delete shopStats['deleted'];
            }

            // Convert shops object to array for easier frontend processing
            const shopStatsArray = Object.values(shopStats);
            const statusStatsArray = Object.values(statusStats);
            
            // Convert daily stats to array and sort by date
            const dailyStatsArray = Object.values(dailyStats)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            const result = {
                summary: {
                    orderCount,
                    itemsTotalFee,
                    deliveryFee,
                    totalSalesRevenue
                },
                shopStats: shopStatsArray,
                statusStats: statusStatsArray,
                dailyStats: dailyStatsArray,
                orders: orders.map(order => ({
                    id: order._id,
                    createdAt: order.createdAt,
                    status: order.status,
                    totalPrice: Number(order.totalPrice) || 0,
                    deliveryFee: Number(order.deliveryFee) || 0,
                    itemsTotal: Number(order.itemsTotal) || 0,
                    shopName: order.shopId ? order.shopId.name : order.shopName || 'Unknown Shop',
                    items: order.items ? order.items.length : 0
                })),
                totalOrderCount: orders.length
            };

            res.send(result);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            res.status(BAD_REQUEST).send('Failed to fetch statistics');
        }
    })
);

router.get(
    '/:status?',
    handler(async (req, res) => {
        try {
            const status = req.params.status;
            const { startDate, endDate, shopId } = req.query;
            const filter = {};
            
            // Try to find the user
            const user = await UserModel.findById(req.user.id);
            
            // If user doesn't exist, just filter by the user ID we have
            if (!user) {
                filter.user = req.user.id;
            } else {
                // If user is delivery personnel, admin, or owner, don't filter by user
                if (!user.isAdmin && !user.isDelivery && !user.isOwner) {
                    filter.user = user._id;
                }
            }
            
            // Apply status filter if provided
            if (status) {
                filter.status = status;
            }

            // Apply date range filter if provided
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    filter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    const endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    filter.createdAt.$lte = endDateTime;
                }
            }

            // Apply shop filter if provided
            if (shopId && shopId !== 'all') {
                filter.shopId = shopId;
            }
            
            const orders = await OrderModel.find(filter)
                .populate('shopId')
                .populate('user', 'name contact')
                .sort('-createdAt');
            
            // Format orders to include contact info for admin/delivery view
            const formattedOrders = orders.map(order => {
                const orderObj = order.toObject();
                if (orderObj.user && orderObj.user.contact) {
                    orderObj.contact = orderObj.user.contact;
                }
                return orderObj;
            });
            res.send(formattedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(BAD_REQUEST).send('Failed to fetch orders');
        }
    })
);

// Add endpoint to update order status (admin, owner, or delivery personnel only)
router.put(
    '/:orderId/status',
    handler(async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            
            // Check if user is admin, owner, or delivery personnel
            const user = await UserModel.findById(req.user.id);
            if (!user || (!user.isAdmin && !user.isDelivery && !user.isOwner)) {
                return res.status(UNAUTHORIZED).send('Only admins, owners, or delivery personnel can update order status');
            }
            
            // Validate the status
            if (!Object.values(OrderStatus).includes(status)) {
                return res.status(BAD_REQUEST).send('Invalid order status');
            }

            const order = await OrderModel.findById(orderId);
            if (!order) {
                return res.status(BAD_REQUEST).send('Order not found');
            }
            
            order.status = status;
            await order.save();
            
            res.send({ success: true, order });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(BAD_REQUEST).send('Failed to update order status');
        }
    })
);

const getNewOrderForCurrentUser = async req => {
    return await OrderModel.findOne({
        user: req.user.id,
        status: OrderStatus.NEW,
    });
};

export default router;