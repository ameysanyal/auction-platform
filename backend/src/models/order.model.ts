import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IOrder
  extends Document {
  auction: mongoose.Types.ObjectId;

  winner: mongoose.Types.ObjectId;

  seller: mongoose.Types.ObjectId;

  amount: number;

  paymentStatus:
    | "PENDING"
    | "PAID"
    | "FAILED";

  stripeSessionId?: string;

  paidAt?: Date;
}

const orderSchema =
  new Schema<IOrder>(
    {
      auction: {
        type:
          Schema.Types.ObjectId,
        ref: "AuctionItem",
        required: true,
      },

      winner: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      seller: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "PENDING",
          "PAID",
          "FAILED",
        ],
        default: "PENDING",
      },

      stripeSessionId: String,

      paidAt: Date,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<IOrder>(
  "Order",
  orderSchema
);