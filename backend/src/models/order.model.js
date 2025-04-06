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
      // Use Schema.Types.ObjectId instead of direct schema reference
      food: { type: Schema.Types.ObjectId, required: true, ref: 'food' },
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
  if (this.isNew || this.isModified('items') || this.isModified('deliveryFee')) {
    // Validate that itemsTotal matches the sum of item prices
    const calculatedItemsTotal = this.items.reduce((total, item) => total + item.price, 0);
    if (Math.abs(calculatedItemsTotal - this.itemsTotal) > 0.01) { // Allow for minor floating point differences
      this.itemsTotal = calculatedItemsTotal;
    }
    // Ensure totalPrice is the sum of itemsTotal and deliveryFee
    this.totalPrice = this.itemsTotal + this.deliveryFee;
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