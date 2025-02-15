import { Router } from 'express';
import Razorpay from 'razorpay';
import handler from 'express-async-handler';

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

export default router;
