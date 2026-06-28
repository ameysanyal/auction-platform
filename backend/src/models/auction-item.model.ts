import mongoose, { Document, Schema, Model } from "mongoose";

// 1. Define an interface representing a document in MongoDB
export interface IAuctionItem extends Document {
  title: string;
  description?: string;
  images: string[];
  seller: mongoose.Types.ObjectId;
  startingPrice: number;
  currentBid: number;
  highestBidder?: mongoose.Types.ObjectId;
  endTime: Date;
  status: "active" | "completed" | "expired_no_bids" | "pending_payment";
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema corresponding to the document interface
const auctionItemSchema: Schema<IAuctionItem> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    highestBidder: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired_no_bids", "pending_payment"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

auctionItemSchema.index({
  status: 1,
  endTime: 1,
});

auctionItemSchema.index({
  seller: 1,
});

// 3. Create and export the Model
const AuctionItem: Model<IAuctionItem> = mongoose.model<IAuctionItem>(
  "AuctionItem",
  auctionItemSchema
);

export default AuctionItem;