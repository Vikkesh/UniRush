import { Router } from 'express';
import handler from 'express-async-handler';
import { verifyToken as auth } from '../middleware/auth.mid.js';
import { BAD_REQUEST, UNAUTHORIZED } from '../constants/httpStatus.js';
import { OrderModel } from '../models/order.model.js';
import { OrderStatus, DeliveryVisibleStatus } from '../constants/orderStatus.js';
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

            if (!order.shopId) {
                return res.status(BAD_REQUEST).send('Shop information is required!');
            }

            // Get shop details
            const shop = await ShopModel.findById(order.shopId);
            if (!shop) {
                return res.status(BAD_REQUEST).send('Shop not found!');
            }

            // Validate order totals
            const itemsTotal = order.itemsTotal || order.items.reduce((total, item) => total + item.price, 0);
            const deliveryFee = order.deliveryFee || 0;
            const totalPrice = itemsTotal + deliveryFee;
            
            // Create paid order
            const newOrder = new OrderModel({
                ...order,
                user: req.user.id,
                status: OrderStatus.PAID,
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
            // Verify user is admin, owner, or shop admin
            const user = await UserModel.findById(req.user.id);
            if (!user || (!user.isAdmin && !user.isOwner && !user.isShopAdmin)) {
                return res.status(UNAUTHORIZED).send('Only admins, owners, or shop admins can access statistics');
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
                    // Create a date object in IST timezone (UTC+5:30)
                    const startDateTime = new Date(startDate);
                    // Adjust for IST timezone offset (UTC+5:30 = 330 minutes)
                    const istOffset = 330; // minutes
                    const localOffset = startDateTime.getTimezoneOffset(); // negative for timezones ahead of UTC
                    const totalOffset = istOffset + localOffset;
                    
                    // Set to beginning of day in IST timezone
                    startDateTime.setHours(0, 0, 0, 0);
                    // Adjust for timezone differences to get correct UTC time
                    startDateTime.setMinutes(startDateTime.getMinutes() - totalOffset);
                    
                    filter.createdAt.$gte = startDateTime;
                }
                if (endDate) {
                    // Create a date object in IST timezone (UTC+5:30)
                    const endDateTime = new Date(endDate);
                    // Adjust for IST timezone offset (UTC+5:30 = 330 minutes)
                    const istOffset = 330; // minutes
                    const localOffset = endDateTime.getTimezoneOffset(); // negative for timezones ahead of UTC
                    const totalOffset = istOffset + localOffset;
                    
                    // Set to end of day in IST timezone
                    endDateTime.setHours(23, 59, 59, 999);
                    // Adjust for timezone differences to get correct UTC time
                    endDateTime.setMinutes(endDateTime.getMinutes() - totalOffset);
                    
                    filter.createdAt.$lte = endDateTime;
                }
            }

            // Status filter
            if (status && status !== 'ALL') {
                filter.status = status;
            }
            
            // Shop filter based on user role
            if (user.isShopAdmin && !user.isAdmin && !user.isOwner) {
                // Shop admins can only see data for their managed shops
                if (shopId && shopId !== 'all') {
                    // Check if this shop is in their managed shops
                    if (!user.managedShops.some(managedShop => managedShop.toString() === shopId)) {
                        return res.status(UNAUTHORIZED).send('You do not have permission to view this shop');
                    }
                    filter.shopId = shopId;
                } else {
                    // No specific shop selected, filter by all managed shops
                    filter.shopId = { $in: user.managedShops };
                }
            } else if (shopId && shopId !== 'all') {
                // Admin/owner can filter by any shop
                filter.shopId = shopId;
            }

            // Fetch filtered orders
            const orders = await OrderModel.find(filter)
                .populate('shopId', 'name')
                .sort('-createdAt');

            // Get all active shops for proper categorization
            let activeShops;
            if (user.isShopAdmin && !user.isAdmin && !user.isOwner) {
                // Shop admins only see their managed shops
                activeShops = await ShopModel.find({ _id: { $in: user.managedShops } }, '_id name');
            } else {
                // Admins and owners see all shops
                activeShops = await ShopModel.find({}, '_id name');
            }

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

                // Group by day for time-series data with proper IST timezone handling
                const orderDateObj = new Date(order.createdAt);
                
                // Convert to IST (UTC+5:30)
                const istDateTime = new Date(orderDateObj.getTime() + (5.5 * 60 * 60 * 1000));
                const orderDate = istDateTime.toISOString().split('T')[0];
                
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
                if (!user.isAdmin && !user.isDelivery && !user.isOwner && !user.isShopAdmin) {
                    filter.user = user._id;
                }

                // For delivery personnel, only show allowed statuses
                if (user.isDelivery && !user.isAdmin && !user.isOwner && !user.isShopAdmin) {
                    if (status) {
                        if (!DeliveryVisibleStatus.includes(status)) {
                            return res.status(BAD_REQUEST).send('Status not accessible for delivery personnel');
                        }
                        filter.status = status;
                    } else {
                        filter.status = { $in: DeliveryVisibleStatus };
                    }
                } else if (status) {
                    filter.status = status;
                }

                // For shop admins, only show orders for their managed shops
                if (user.isShopAdmin && !user.isAdmin && !user.isOwner) {
                    if (shopId && shopId !== 'all') {
                        // Check if this shop is in their managed shops
                        if (!user.managedShops.some(managedShop => managedShop.toString() === shopId)) {
                            return res.status(UNAUTHORIZED).send('You do not have permission to view this shop');
                        }
                        filter.shopId = shopId;
                    } else {
                        // No specific shop selected, filter by all managed shops
                        filter.shopId = { $in: user.managedShops };
                    }
                } else if (shopId && shopId !== 'all') {
                    // Admin/owner can filter by any shop
                    filter.shopId = shopId;
                }
            }

            // Apply date range filter if provided
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    // Create a date object in IST timezone (UTC+5:30)
                    const startDateTime = new Date(startDate);
                    // Adjust for IST timezone offset (UTC+5:30 = 330 minutes)
                    const istOffset = 330; // minutes
                    const localOffset = startDateTime.getTimezoneOffset(); // negative for timezones ahead of UTC
                    const totalOffset = istOffset + localOffset;
                    
                    // Set to beginning of day in IST timezone
                    startDateTime.setHours(0, 0, 0, 0);
                    // Adjust for timezone differences to get correct UTC time
                    startDateTime.setMinutes(startDateTime.getMinutes() - totalOffset);
                    
                    filter.createdAt.$gte = startDateTime;
                }
                if (endDate) {
                    // Create a date object in IST timezone (UTC+5:30)
                    const endDateTime = new Date(endDate);
                    // Adjust for IST timezone offset (UTC+5:30 = 330 minutes)
                    const istOffset = 330; // minutes
                    const localOffset = endDateTime.getTimezoneOffset(); // negative for timezones ahead of UTC
                    const totalOffset = istOffset + localOffset;
                    
                    // Set to end of day in IST timezone
                    endDateTime.setHours(23, 59, 59, 999);
                    // Adjust for timezone differences to get correct UTC time
                    endDateTime.setMinutes(endDateTime.getMinutes() - totalOffset);
                    
                    filter.createdAt.$lte = endDateTime;
                }
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
            if (!user || (!user.isAdmin && !user.isDelivery && !user.isOwner && !user.isShopAdmin)) {
                return res.status(UNAUTHORIZED).send('Only admins, owners, shop admins, or delivery personnel can update order status');
            }
            
            // Validate the status
            if (!Object.values(OrderStatus).includes(status)) {
                return res.status(BAD_REQUEST).send('Invalid order status');
            }

            const order = await OrderModel.findById(orderId);
            if (!order) {
                return res.status(BAD_REQUEST).send('Order not found');
            }
            
            // If user is shop admin, check if they have permission for this order's shop
            if (user.isShopAdmin && !user.isAdmin && !user.isOwner) {
                // Convert to string for comparison
                const orderShopId = order.shopId ? order.shopId.toString() : null;
                
                if (!orderShopId || !user.managedShops.some(managedShop => managedShop.toString() === orderShopId)) {
                    return res.status(UNAUTHORIZED).send('You do not have permission to update orders for this shop');
                }
            }
            
            // Only update the status field
            const updatedOrder = await OrderModel.findByIdAndUpdate(
                orderId,
                { $set: { status: status } },
                { new: true, runValidators: false }
            );
            
            res.send({ success: true, order: updatedOrder });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(BAD_REQUEST).send('Failed to update order status');
        }
    })
);

export default router;