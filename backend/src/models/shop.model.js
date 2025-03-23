import { model, Schema } from 'mongoose';

export const ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false }, // Changed to optional
    address: { type: String, required: true },
    tags: { type: [String] },
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

export const ShopModel = model('shop', ShopSchema);