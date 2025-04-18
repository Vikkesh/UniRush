import { model, Schema } from 'mongoose';

export const ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false }, // Changed to optional
    address: { type: String, required: true },
    contact: { type: String, required: true }, // Added contact field
    tags: { type: [String] },
    openingTime: { type: String, default: '12:00' }, // 24-hour format (HH:MM)
    closingTime: { type: String, default: '00:00' }, // 24-hour format (HH:MM)
    enabled: { type: Boolean, default: true }, // Added field to control visibility
    manualOverride: { type: Boolean, default: false }, // Track if shop status was manually overridden
    lastOverrideTime: { type: Date, default: null }, // Track when the last override occurred
    taxable: { type: Boolean, default: false }, // Flag to determine if GST is applicable
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