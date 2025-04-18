import { model, Schema } from 'mongoose';
import { OrderStatus } from '../constants/orderStatus.js';

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
      orderId: { type: String, unique: true, sparse: true }, // Custom order ID in format YYYYMMxxxxx
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

// Add a pre-save hook to validate totals and generate custom order ID
orderSchema.pre('save', async function(next) {
  // Generate custom order ID for new orders
  if (this.isNew && !this.orderId) {
    const date = new Date();
    const year = date.getFullYear();
    // Month is 0-based, so add 1 and pad with leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // Generate a random 5 digit number between 00000 and 99999
    const randomNum = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    // Combine to create the order ID: YYYYMMxxxxx format
    this.orderId = `${year}${month}${randomNum}`;
  }

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