// ============================================================================
// Seed Script: Prepare Test Data for Load Testing
// Purpose: Seeds MongoDB with realistic users and auctions.
// Pre-generates valid JWT tokens for each user so load test scripts don't
// have to waste time calling /auth/login repeatedly.
// Saves data to data/users.json and data/auctions.json for k6 scripts.
// ============================================================================

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Validate required environment variables
const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
if (!mongoUri) throw new Error("MONGO_URI is required");
if (!jwtSecret) throw new Error("JWT_SECRET is required");

// How many users and auctions to generate
const usersCount = Number(process.env.USERS || 1000);
const auctionsCount = Number(process.env.AUCTIONS || 200);
const password = process.env.PASSWORD || "LoadTest123!Secure";

// Mongoose schema for User
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

// Mongoose schema for Auction Item
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

// Ensure the local "data" folder exists
await fs.mkdir(path.resolve("data"), { recursive: true });

// Connect to MongoDB
await mongoose.connect(mongoUri);
console.log(`Connected to MongoDB: ${mongoUri.replace(/:\/\/.*@/, "://***@")}`);

// Unique ID for this seed run to avoid naming collisions
const runId = Date.now().toString(36);

// Hash the default password once to avoid expensive hashing inside the loop
const hash = await bcrypt.hash(password, 10);
const users = [];
const userDocs = [];

// ----------------------------------------------------------------------------
// Step 1: Create user documents
// ----------------------------------------------------------------------------
for (let i = 0; i < usersCount; i++) {
  const email = `loadtest-${runId}-${String(i + 1).padStart(6, "0")}@example.test`;
  const doc = {
    name: `Load Test User ${i + 1}`,
    email,
    password: hash,
    role: "USER",
    hasPaymentProfile: true, // Configured so they pass bidding eligibility checks
    isEmailVerified: true,
    status: "ACTIVE",
    refreshToken: "",
  };
  userDocs.push(doc);
}

// Bulk insert users into the database
const insertedUsers = await User.insertMany(userDocs, { ordered: true });

// ----------------------------------------------------------------------------
// Step 2: Sign JWT tokens for each inserted user
// ----------------------------------------------------------------------------
for (const user of insertedUsers) {
  const token = jwt.sign(
    { _id: user._id.toString(), email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: "7d" },
  );
  users.push({ id: user._id.toString(), email: user.email, token });
}

// ----------------------------------------------------------------------------
// Step 3: Create auction items
// ----------------------------------------------------------------------------
// Designate the first 1 to 10 users as auction sellers
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
    // Set auction end time to expire 24 hours into the future
    endTime: new Date(now + 24 * 60 * 60 * 1000 + i * 1000),
    status: "active",
  });
}

// Bulk insert auctions into the database
const insertedAuctions = await AuctionItem.insertMany(auctionDocs, { ordered: true });
const auctions = insertedAuctions.map(a => ({
  id: a._id.toString(),
  sellerId: a.seller.toString(),
  startingPrice: a.startingPrice,
}));

// ----------------------------------------------------------------------------
// Step 4: Save JSON fixture files for k6 and other load test scripts
// ----------------------------------------------------------------------------
await fs.writeFile(path.resolve("data/users.json"), JSON.stringify(users, null, 2));
await fs.writeFile(path.resolve("data/auctions.json"), JSON.stringify(auctions, null, 2));
await fs.writeFile(
  path.resolve("data/seed-manifest.json"),
  JSON.stringify({ runId, usersCount, auctionsCount, password, createdAt: new Date().toISOString() }, null, 2)
);

console.log(`Seeded ${users.length} users and ${auctions.length} auctions.`);
console.log(`Hot auction: ${auctions[0]?.id}`);

// Disconnect from MongoDB
await mongoose.disconnect();
