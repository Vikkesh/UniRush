import { model, Schema } from 'mongoose';
import { OrderStatus } from '../constants/orderStatus.js';
// Remove the circular import
// import { FoodModel } from './food.model.js';

export const LatLngSchema = new Schema(
    {
      lat: { type: String, required: true },
      lng: { type: String, required: true },
    },
    {
      _id: false,
    }
  );

export const OrderItemSchema = new Schema(
    {
      // Make food field optional for custom orders
      food: { type: Schema.Types.ObjectId, required: false, ref: 'food' },
      name: { type: String, required: true }, // Add name field which is required
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
    {
      _id: false,
    }
  );

const orderSchema = new Schema(
    {
      name: { type: String, required: true },
      address: { type: String, required: true },
      addressLatLng: { type: LatLngSchema, required: true },
      paymentId: { type: String, required: true },
      totalPrice: { type: Number, required: true },
      itemsTotal: { type: Number, required: true },
      gstAmount: { type: Number, default: 0 }, // Added GST field with default value 0
      deliveryFee: { type: Number, required: true },
      items: { type: [OrderItemSchema], required: true },
      status: { type: String, default: OrderStatus.PAID },
      user: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
      shopId: { type: Schema.Types.ObjectId, required: true, ref: 'shop' },
      shopName: { type: String, required: true }
    },
    {
      timestamps: true,
      toJSON: {
        virtuals: true,
      },
      toObject: {
        virtuals: true,
      },
    }
);

// Add a pre-save hook to validate totals
orderSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('items') || this.isModified('deliveryFee') || this.isModified('gstAmount')) {
    // Validate that itemsTotal matches the sum of item prices
    const calculatedItemsTotal = this.items.reduce((total, item) => total + item.price, 0);
    if (Math.abs(calculatedItemsTotal - this.itemsTotal) > 0.01) { // Allow for minor floating point differences
      this.itemsTotal = calculatedItemsTotal;
    }
    // Initialize gstAmount to 0 if not defined
    if (this.gstAmount === undefined) {
      this.gstAmount = 0;
    }
    // Ensure totalPrice is the sum of itemsTotal, gstAmount, and deliveryFee
    this.totalPrice = this.itemsTotal + (this.gstAmount || 0) + this.deliveryFee;
  }

  // Handle shop name
  if (this.isNew || this.isModified('shopId')) {
    try {
      const shop = await model('shop').findById(this.shopId);
      if (shop) {
        this.shopName = shop.name;
      }
    } catch (error) {
      console.error('Error fetching shop name:', error);
    }
  }
  next();
});

export const OrderModel = model('order', orderSchema);