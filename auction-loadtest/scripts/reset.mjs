import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is required");
const userSchema = new mongoose.Schema({}, { strict: false });
const auctionSchema = new mongoose.Schema({}, { strict: false });
const bidSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);
const AuctionItem = mongoose.models.AuctionItem || mongoose.model("AuctionItem", auctionSchema);
const Bid = mongoose.models.Bid || mongoose.model("Bid", bidSchema);
await mongoose.connect(mongoUri);
const manifest = JSON.parse(await fs.readFile("data/seed-manifest.json", "utf8"));
const userPrefix = `loadtest-${manifest.runId}-`;
const users = await User.find({ email: { $regex: `^${userPrefix}` } }, { _id: 1 }).lean();
const userIds = users.map(u => u._id);
const auctions = await AuctionItem.find({ seller: { $in: userIds } }, { _id: 1 }).lean();
const auctionIds = auctions.map(a => a._id);
const [bids, deletedAuctions, deletedUsers] = await Promise.all([
  Bid.deleteMany({ auction: { $in: auctionIds } }),
  AuctionItem.deleteMany({ _id: { $in: auctionIds } }),
  User.deleteMany({ _id: { $in: userIds } }),
]);
console.log({ bidsDeleted: bids.deletedCount, auctionsDeleted: deletedAuctions.deletedCount, usersDeleted: deletedUsers.deletedCount });
await mongoose.disconnect();
