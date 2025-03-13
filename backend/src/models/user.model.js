import { model, Schema } from "mongoose";
export const UserSchema = new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      address: { type: String, required: true },
      contact: { type: String, required: true, unique: true }, // Updated to make it required and unique
      isAdmin: { type: Boolean, default: false },
      isDelivery: { type: Boolean, default: false }, // Added delivery role
      isBlocked: { type: Boolean, default: false },
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
  
  export const UserModel = model('user', UserSchema);