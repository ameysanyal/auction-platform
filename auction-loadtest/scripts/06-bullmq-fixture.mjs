import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGO_URI is required");
const delaySeconds = Number(process.env.DELAY_SECONDS || 20);
const count = Number(process.env.COUNT || 50);

const userSchema = new mongoose.Schema({}, { strict: false });
const auctionSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);
const AuctionItem = mongoose.models.AuctionItem || mongoose.model("AuctionItem", auctionSchema);

await mongoose.connect(mongoUri);
const users = JSON.parse(await fs.readFile("data/users.json", "utf8"));
const sellerIds = (await User.find({ _id: { $in: users.slice(0, 10).map(u => u.id) } }, { _id: 1 }).lean()).map(u => u._id);
if (!sellerIds.length) throw new Error("Load-test users are missing. Run npm run seed first.");

const now = Date.now();
const docs = [];
for (let i = 0; i < count; i++) {
  docs.push({
    title: `BullMQ Fixture ${now}-${i + 1}`,
    description: "BullMQ auction expiry load-test fixture.",
    images: ["https://example.com/load-test.jpg"],
    seller: sellerIds[i % sellerIds.length],
    startingPrice: 100,
    currentBid: 0,
    endTime: new Date(now + delaySeconds * 1000 + i * 250),
    status: "active",
  });
}
const inserted = await AuctionItem.insertMany(docs);
console.log(JSON.stringify({ count: inserted.length, firstEndTime: inserted[0]?.endTime, lastEndTime: inserted.at(-1)?.endTime }, null, 2));
console.log("Important: direct DB insertion does NOT schedule BullMQ jobs. Use the backend POST /auctions endpoint for a true queue-throughput test.");
await mongoose.disconnect();
