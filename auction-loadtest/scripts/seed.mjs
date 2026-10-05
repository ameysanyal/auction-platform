import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
if (!mongoUri) throw new Error("MONGO_URI is required");
if (!jwtSecret) throw new Error("JWT_SECRET is required");

const usersCount = Number(process.env.USERS || 1000);
const auctionsCount = Number(process.env.AUCTIONS || 200);
const password = process.env.PASSWORD || "LoadTest123!Secure";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  hasPaymentProfile: Boolean,
  isEmailVerified: Boolean,
  status: String,
  refreshToken: String,
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const auctionSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [String],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startingPrice: Number,
  currentBid: Number,
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  endTime: Date,
  status: String,
}, { timestamps: true });
const AuctionItem = mongoose.models.AuctionItem || mongoose.model("AuctionItem", auctionSchema);

await fs.mkdir(path.resolve("data"), { recursive: true });
await mongoose.connect(mongoUri);
console.log(`Connected to MongoDB: ${mongoUri.replace(/:\/\/.*@/, "://***@")}`);

const runId = Date.now().toString(36);
const hash = await bcrypt.hash(password, 10);
const users = [];
const userDocs = [];

for (let i = 0; i < usersCount; i++) {
  const email = `loadtest-${runId}-${String(i + 1).padStart(6, "0")}@example.test`;
  const doc = {
    name: `Load Test User ${i + 1}`,
    email,
    password: hash,
    role: "USER",
    hasPaymentProfile: true,
    isEmailVerified: true,
    status: "ACTIVE",
    refreshToken: "",
  };
  userDocs.push(doc);
}

const insertedUsers = await User.insertMany(userDocs, { ordered: true });
for (const user of insertedUsers) {
  const token = jwt.sign(
    { _id: user._id.toString(), email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "7d" },
  );
  users.push({ id: user._id.toString(), email: user.email, token });
}

const sellerIds = insertedUsers.slice(0, Math.max(1, Math.min(10, insertedUsers.length))).map(u => u._id);
const now = Date.now();
const auctionDocs = [];
for (let i = 0; i < auctionsCount; i++) {
  auctionDocs.push({
    title: `Load Test Auction ${runId}-${i + 1}`,
    description: "Dedicated auction-platform load-test fixture.",
    images: ["https://example.com/load-test.jpg"],
    seller: sellerIds[i % sellerIds.length],
    startingPrice: 100,
    currentBid: 0,
    endTime: new Date(now + 24 * 60 * 60 * 1000 + i * 1000),
    status: "active",
  });
}
const insertedAuctions = await AuctionItem.insertMany(auctionDocs, { ordered: true });
const auctions = insertedAuctions.map(a => ({ id: a._id.toString(), sellerId: a.seller.toString(), startingPrice: a.startingPrice }));

await fs.writeFile(path.resolve("data/users.json"), JSON.stringify(users, null, 2));
await fs.writeFile(path.resolve("data/auctions.json"), JSON.stringify(auctions, null, 2));
await fs.writeFile(path.resolve("data/seed-manifest.json"), JSON.stringify({ runId, usersCount, auctionsCount, password, createdAt: new Date().toISOString() }, null, 2));

console.log(`Seeded ${users.length} users and ${auctions.length} auctions.`);
console.log(`Hot auction: ${auctions[0]?.id}`);
await mongoose.disconnect();
