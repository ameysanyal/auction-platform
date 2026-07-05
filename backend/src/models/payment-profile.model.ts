import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  defaultPaymentMethodId: string;
  paymentMethodType: string;
  cardBrand: string;
  last4: string;
  billingName: string;
  billingPhone?: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  termsAccepted: boolean;
  termsAcceptedAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentProfileSchema: Schema<IPaymentProfile> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    defaultPaymentMethodId: {
      type: String,
      required: true,
    },
    paymentMethodType: {
      type: String,
      required: true,
    },
    cardBrand: {
      type: String,
      required: true,
    },
    last4: {
      type: String,
      required: true,
    },
    billingName: {
      type: String,
      required: true,
    },
    billingPhone: {
      type: String,
    },
    billingAddress: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    termsAccepted: {
      type: Boolean,
      required: true,
    },
    termsAcceptedAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const PaymentProfile: Model<IPaymentProfile> = mongoose.model<IPaymentProfile>(
  "PaymentProfile",
  paymentProfileSchema
);

export default PaymentProfile;
