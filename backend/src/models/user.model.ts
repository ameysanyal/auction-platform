import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define an interface representing a User document in MongoDB
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string; // Optional field
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  stripeCustomerId?: string;
  defaultPaymentMethodId?: string;
  hasPaymentProfile?: boolean;
  isEmailVerified?: boolean;
  status?: string;
}

// 2. Create the Schema corresponding to the document interface
const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Good practice: cleans up accidental spaces in emails
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    refreshToken: { type: String },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    stripeCustomerId: {
      type: String,
    },
    defaultPaymentMethodId: {
      type: String,
    },
    hasPaymentProfile: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: "ACTIVE",
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

// 3. Create and export the Model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
