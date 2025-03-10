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
            
            await OrderModel.deleteOne({
                user: req.user.id,
                status: OrderStatus.NEW,
            });
            
            const newOrder = new OrderModel({
                ...order,
                user: req.user.id,
                status: OrderStatus.NEW,
                shopName: shop.name
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
            
            // Check if user exists and is not admin, then filter by user
            if (user) {
                if (!user.isAdmin) {
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

router.get(
    '/:status?',
    handler(async (req, res) => {
        try {
            const status = req.params.status;
            const filter = {};
            
            // Try to find the user
            const user = await UserModel.findById(req.user.id);
            
            // If user doesn't exist, just filter by the user ID we have
            if (!user) {
                filter.user = req.user.id;
            } else {
                // If user exists and is not admin, filter by user
                if (!user.isAdmin) {
                    filter.user = user._id;
                }
            }
            
            // Apply status filter if provided
            if (status) {
                filter.status = status;
            }
            
            const orders = await OrderModel.find(filter)
                .populate('shopId')
                .sort('-createdAt');

            res.send(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(BAD_REQUEST).send('Failed to fetch orders');
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