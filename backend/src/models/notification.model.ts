import mongoose, { Schema, Document, Types } from "mongoose";

// 1. Define an enum for the notification types for better type safety in TS
export enum NotificationType {
  OUTBID = "OUTBID",
  AUCTION_WON = "AUCTION_WON",
  AUCTION_ENDED = "AUCTION_ENDED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
}

// 2. Define the Interface representing the document in MongoDB
export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    auctionId?: Types.ObjectId;
    orderId?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 3. Create the Schema corresponding to the interface
const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      auctionId: {
        type: Schema.Types.ObjectId,
        ref: "AuctionItem",
      },

      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    },
  },
  {
    timestamps: true,
  }
);

// 4. Export the Model
const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;