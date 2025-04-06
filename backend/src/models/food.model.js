import { model, Schema } from 'mongoose';
// Remove the circular import
// import { OrderModel } from './order.model.js';

export const FoodSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    tags: { type: [String] },
    shop: { type: Schema.Types.ObjectId, ref: 'shop', required: true }, 
    favorite: { type: Boolean, default: false },
    imageUrl: { type: String, required: false }, // Changed to optional
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