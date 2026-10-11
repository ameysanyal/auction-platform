// ============================================================================
// Fixture Script 06: BullMQ Auction Expiry Fixtures
// Purpose: Seeds MongoDB with auctions that expire very soon (e.g., 20 seconds
// from now). This allows developers to test how the background queue (BullMQ)
// processes auction expirations and settles winners under load.
// ============================================================================

import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";

// Read MongoDB connection string from environment
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is required");

// How many seconds into the future the first auction should expire (default: 20s)
const delaySeconds = Number(process.env.DELAY_SECONDS || 20);

// How many expiring auction records to create (default: 50)
const count = Number(process.env.COUNT || 50);

// Define flexible mongoose schemas to interact with existing collections
const userSchema = new mongoose.Schema({}, { strict: false });
const auctionSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);
const AuctionItem = mongoose.models.AuctionItem || mongoose.model("AuctionItem", auctionSchema);

// Connect to the database
await mongoose.connect(mongoUri);

// Read test users previously created by the seed script
const users = JSON.parse(await fs.readFile("data/users.json", "utf8"));

// Pick up to 10 user IDs to serve as the sellers for these auctions
const sellerIds = (await User.find({ _id: { $in: users.slice(0, 10).map(u => u.id) } }, { _id: 1 }).lean()).map(u => u._id);
if (!sellerIds.length) throw new Error("Load-test users are missing. Run npm run seed first.");

// Current timestamp
const now = Date.now();
const docs = [];

// Generate auction documents with staggered expiration times
for (let i = 0; i < count; i++) {
  docs.push({
    title: `BullMQ Fixture ${now}-${i + 1}`,
    description: "BullMQ auction expiry load-test fixture.",
    images: ["https://example.com/load-test.jpg"],
    seller: sellerIds[i % sellerIds.length],
    startingPrice: 100,
    currentBid: 0,
    // Stagger end times so they expire 250ms apart starting after delaySeconds
    endTime: new Date(now + delaySeconds * 1000 + i * 250),
    status: "active",
  });
}

// Insert all created auction documents into MongoDB
const inserted = await AuctionItem.insertMany(docs);

// Print summary showing total inserted and the range of expiry times
console.log(JSON.stringify({
  count: inserted.length,
  firstEndTime: inserted[0]?.endTime,
  lastEndTime: inserted.at(-1)?.endTime
}, null, 2));

// Note for developers:
console.log("Important: direct DB insertion does NOT schedule BullMQ jobs. Use the backend POST /auctions endpoint for a true queue-throughput test.");

// Disconnect cleanly from the database
await mongoose.disconnect();
