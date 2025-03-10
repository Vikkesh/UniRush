import { model, Schema } from 'mongoose';

export const ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    address: { type: String, required: true },
    tags: { type: [String] },
    stars: { type: Number, default: 3 },
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