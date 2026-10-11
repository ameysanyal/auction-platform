// ============================================================================
// Cross-Instance Socket.IO Redis Adapter Verification Test
// ============================================================================
// Purpose: Proves that Socket.IO events broadcast on Node #2 are received by
// clients connected to Node #1 via the Redis Adapter.
//
// Test Flow:
// 1. Client A connects to Node #1 (e.g. http://localhost:5050)
// 2. Client A joins auction room: socketA.emit("join-auction", auctionId)
// 3. User B places a bid directly on Node #2 (e.g. POST http://localhost:5051/bids/:id)
// 4. Node #2 processes the bid and emits "new-bid" to room auctionId
// 5. Redis Adapter publishes the event through Redis
// 6. Node #1 receives the Redis pub/sub message and emits it to Client A
// 7. Client A receives "new-bid" with matching payload -> PASS!
// ============================================================================

import "dotenv/config";
import fs from "node:fs";
import { io } from "socket.io-client";

const usersFile = process.env.USERS_FILE || "./data/users.json";
const auctionsFile = process.env.AUCTIONS_FILE || "./data/auctions.json";

if (!fs.existsSync(usersFile)) throw new Error(`Users file not found: ${usersFile}`);
if (!fs.existsSync(auctionsFile)) throw new Error(`Auctions file not found: ${auctionsFile}`);

const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
const auctions = JSON.parse(fs.readFileSync(auctionsFile, "utf8"));

// Pick an active auction and two distinct users
const auctionId = process.env.AUCTION_ID || auctions[0]?.id || auctions[0]?._id;
const userA = users[10]; // Client A (listener)
const userB = users[11]; // Bidder B

if (!auctionId) throw new Error("No auction found for test.");
if (!userA || !userB) throw new Error("At least two valid users required in users.json.");

// Target URLs: can be distinct ports (Node 1 & Node 2) or same Nginx URL
const node1Url = process.env.NODE1_URL || process.env.SOCKET_URL || "http://localhost:5050";
const node2Url = process.env.NODE2_URL || process.env.BASE_URL || "http://localhost:5051";
const timeoutMs = Number(process.env.TIMEOUT_MS || 8000);

console.log("==========================================================");
console.log("🚀 Starting Cross-Instance Socket.IO Delivery Test");
console.log("==========================================================");
console.log(`Target Auction ID: ${auctionId}`);
console.log(`Client A Socket Target (Node #1): ${node1Url}`);
console.log(`Bidder B HTTP Target   (Node #2): ${node2Url}`);
console.log(`Timeout: ${timeoutMs}ms`);
console.log("----------------------------------------------------------");

async function runTest() {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`❌ TIMEOUT: Client A on Node #1 did NOT receive event within ${timeoutMs}ms! Cross-instance delivery failed.`));
    }, timeoutMs);

    // Step 1: Connect Client A to Node #1
    console.log(`[Step 1] Connecting Client A to Node #1 (${node1Url})...`);
    const socketA = io(node1Url, {
      transports: ["websocket"],
      auth: { token: userA.token },
      reconnection: false,
    });

    function cleanup() {
      clearTimeout(timer);
      if (socketA.connected) socketA.disconnect();
    }

    socketA.on("connect_error", (err) => {
      cleanup();
      reject(new Error(`Failed to connect Client A to Node #1: ${err.message}`));
    });

    socketA.on("connect", async () => {
      console.log(`✅ Client A connected (socket id: ${socketA.id}) on Node #1`);

      // Step 2: Client A joins the auction room
      console.log(`[Step 2] Client A joining auction room: ${auctionId}`);
      socketA.emit("join-auction", auctionId);

      // Listen for the "new-bid" event on Client A
      socketA.on("new-bid", (data) => {
        console.log(`\n🎉 [Step 5 - SUCCESS] Client A on Node #1 received "new-bid" event!`);
        console.log("Payload received:", JSON.stringify(data, null, 2));

        if (String(data.auctionId) === String(auctionId)) {
          console.log("\n==========================================================");
          console.log("✅ VERIFICATION PASSED: Cross-instance event delivered!");
          console.log("==========================================================");
          cleanup();
          resolve(true);
        } else {
          cleanup();
          reject(new Error(`Received event for unexpected auction: ${data.auctionId}`));
        }
      });

      // Wait a short moment to ensure room join is registered in Redis/Socket.IO
      await new Promise((r) => setTimeout(r, 500));

      // Step 3 & 4: Submit a bid via HTTP to Node #2
      console.log(`[Step 3 & 4] Submitting bid via HTTP to Node #2 (${node2Url})...`);
      
      // Determine bid amount higher than current
      const bidAmount = Math.floor(Date.now() / 1000) % 1000000 + 500;

      try {
        const bidRes = await fetch(`${node2Url}/bids/${auctionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userB.token}`,
          },
          body: JSON.stringify({ amount: bidAmount }),
        });

        const bidData = await bidRes.json();
        console.log(`HTTP Bid Response Status: ${bidRes.status}`, bidData);

        if (!bidRes.ok && bidRes.status !== 400 && bidRes.status !== 409) {
          throw new Error(`Bid submission failed with status ${bidRes.status}: ${JSON.stringify(bidData)}`);
        }
        console.log(`Waiting for Client A on Node #1 to receive the broadcasted event...`);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  });
}

try {
  await runTest();
  process.exit(0);
} catch (err) {
  console.error("\n" + err.message);
  process.exit(1);
}
