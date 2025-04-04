import { model, Schema } from 'mongoose';

const OTPSchema = new Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // OTP expires after 5 minutes
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

export const OTPModel = model('otp', OTPSchema);