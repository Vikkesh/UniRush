import { model, Schema } from 'mongoose';
import { OrderStatus } from '../constants/orderStatus.js';
import { FoodModel } from './food.model.js';

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
      food: { type: FoodModel.schema, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
    {
      _id: false,
    }
  );

OrderItemSchema.pre('validate', function (next) {
    this.price = this.food.price * this.quantity;
    next();
});
  
const orderSchema = new Schema(
    {
      name: { type: String, required: true },
      address: { type: String, required: true },
      addressLatLng: { type: LatLngSchema, required: true },
      paymentId: { type: String },
      totalPrice: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      items: { type: [OrderItemSchema], required: true },
      status: { type: String, default: OrderStatus.NEW },
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

// Add a pre-save hook to ensure shopName is set
orderSchema.pre('save', async function(next) {
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