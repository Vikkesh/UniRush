import { model, Schema } from 'mongoose';

const BypassSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    reason: { type: String, default: '' },
    addedBy: { type: Schema.Types.ObjectId, ref: 'user', required: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

export const BypassModel = model('bypass', BypassSchema);