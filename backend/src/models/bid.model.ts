import mongoose, { Document, Schema, Model } from "mongoose";

// 1. Define an interface representing a document in MongoDB
export interface IBid extends Document {
  auction: mongoose.Types.ObjectId;
  bidder: mongoose.Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema corresponding to the document interface
const bidSchema: Schema<IBid> = new Schema(
  {
    auction: {
      type: Schema.Types.ObjectId,
      ref: "AuctionItem",
      required: true,
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

bidSchema.index({
  auction: 1,
  createdAt: -1,
});

bidSchema.index({
  bidder: 1,
});

// 3. Create and export the Model
const Bid: Model<IBid> = mongoose.model<IBid>("Bid", bidSchema);

export default Bid;
