import { Router } from 'express';
import Razorpay from 'razorpay';
import handler from 'express-async-handler';
import crypto from 'crypto';

const router = Router();

router.post(
  '/order',
  handler(async (req, res) => {
    const { orderItems, totalPrice } = req.body;
    
    // Validate payload existence
    if (!orderItems || !totalPrice) {
      return res.status(400).json({ error: "Missing orderItems or totalPrice in request body" });
    }
    
    // Convert price to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(totalPrice * 100);
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      notes: {
        orderItems: JSON.stringify(orderItems)
      }
    };

    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).send("Error");
    res.json(order);
  })
);

// New verify endpoint integrated here
router.post(
  '/verify',
  handler(async (req, res) => {
    const { order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (generated_signature === razorpay_signature) {
      return res.json({ valid: true });
    } else {
      return res.json({ valid: false });
    }
  })
);

export default router;
