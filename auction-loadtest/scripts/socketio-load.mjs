// ============================================================================
// Socket.io Real-Time Load Test
// Purpose: Simulates multiple concurrent WebSocket/Socket.io client connections.
// Each client connects using a JWT token, joins an auction room ("join-auction"),
// listens for real-time bid updates ("new-bid"), and tests server connection limits.
// ============================================================================

import "dotenv/config";
import fs from "node:fs";
import { io } from "socket.io-client";

// Configuration options from environment variables
const socketUrl = process.env.SOCKET_URL || "http://localhost:5050";
const users = JSON.parse(fs.readFileSync(process.env.USERS_FILE || "./data/users.json", "utf8"));
const auctionId = process.env.AUCTION_ID;
const clients = Number(process.env.CLIENTS || 100);             // Total socket connections to open
const durationMs = Number(process.env.DURATION_MS || 120000);   // How long to keep connections open (2 minutes)
const rampMs = Number(process.env.RAMP_MS || 10000);           // Time to ramp up all connections (10 seconds)

// Validation
if (!auctionId) throw new Error("AUCTION_ID is required");
if (!users.length) throw new Error("users.json is empty");

// Tracking metrics
let connected = 0;
let connectionErrors = 0;
let disconnected = 0;
let newBidEvents = 0;
const sockets = [];

// Helper function to pause execution for a given number of milliseconds
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Function to establish a Socket.io connection for a virtual user
function connectClient(index) {
  const user = users[index % users.length];

  // Initialize socket connection forcing pure WebSocket transport and passing auth token
  const socket = io(socketUrl, {
    transports: ["websocket"],
    auth: { token: user.token },
    reconnection: false, // Don't auto-reconnect to keep test counts accurate
  });

  // When connection succeeds, increment counter and subscribe to the auction room
  socket.on("connect", () => {
    connected++;
    socket.emit("join-auction", auctionId);
  });

  // Event handlers to track errors, disconnects, and broadcasted bids
  socket.on("connect_error", () => { connectionErrors++; });
  socket.on("disconnect", () => { disconnected++; });
  socket.on("new-bid", () => { newBidEvents++; });

  sockets.push(socket);
}

// ----------------------------------------------------------------------------
// Execution Flow
// ----------------------------------------------------------------------------
console.log(JSON.stringify({ socketUrl, auctionId, clients, durationMs, rampMs }));

// Step 1: Ramp up connections smoothly over rampMs
for (let i = 0; i < clients; i++) {
  connectClient(i);
  if (rampMs > 0) await delay(rampMs / clients);
}

// Step 2: Hold all connections open for the test duration
await delay(durationMs);

// Step 3: Gracefully close all socket connections
for (const socket of sockets) socket.disconnect();
await delay(1000);

// Step 4: Output summary results
console.log(JSON.stringify({ clients, connected, connectionErrors, disconnected, newBidEvents }));

// Fail the test process if more than 1% of connection attempts resulted in error
if (connectionErrors > clients * 0.01) process.exitCode = 1;

/*
Parameter Breakdown
Parameter	Required?	Default Value	Description
AUCTION_ID	Yes	None	The MongoDB ID of the auction room to join (e.g. from data/auctions.json).
SOCKET_URL	No	http://localhost:5050	The Socket.io server endpoint.
CLIENTS	No	100	Number of concurrent WebSocket connections to open.
RAMP_MS	No	10000 (10s)	Time taken to gradually open all connections.
DURATION_MS	No	120000 (2m)	How long to keep all connections connected and listening for bids.
USERS_FILE	No	./data/users.json	Path to the file containing pre-seeded users and auth tokens.


command = AUCTION_ID="6ac935a3e9874cf0c506646e" \
CLIENTS=100 \                       
RAMP_MS=10000 \
DURATION_MS=60000 \
node scripts/socketio-load.mjs


result = {"socketUrl":"https://api-auction.ameydev.in/","auctionId":"6ac935a3e9874cf0c506646e","clien
ts":100,"durationMs":60000,"rampMs":10000}
{"clients":100,"connected":100,"connectionErrors":0,"disconnected":100,"newBidEvents":0}

*/