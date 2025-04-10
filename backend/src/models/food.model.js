import { model, Schema } from 'mongoose';
// Remove the circular import
// import { OrderModel } from './order.model.js';

export const FoodSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    tags: { type: [String] },
    shop: { type: Schema.Types.ObjectId, ref: 'shop', required: true }, 
    imageUrl: { type: String, required: false }, // Changed to optional
    description: { type: String, required: false }, // Added optional description field
    enabled: { type: Boolean, default: true }, // Added field to control visibility
    // Removed stars field
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

export const FoodModel = model('food', FoodSchema);