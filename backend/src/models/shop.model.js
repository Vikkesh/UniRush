import { model, Schema } from 'mongoose';

export const ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false }, // Changed to optional
    address: { type: String, required: true },
    tags: { type: [String] },
    openingTime: { type: String, default: '12:00' }, // 24-hour format (HH:MM)
    closingTime: { type: String, default: '00:00' }, // 24-hour format (HH:MM)
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