import "dotenv/config";
import fs from "node:fs";
import { io } from "socket.io-client";

const socketUrl = process.env.SOCKET_URL || "http://localhost:5050";
const users = JSON.parse(fs.readFileSync(process.env.USERS_FILE || "./data/users.json", "utf8"));
const auctionId = process.env.AUCTION_ID;
const clients = Number(process.env.CLIENTS || 100);
const durationMs = Number(process.env.DURATION_MS || 120000);
const rampMs = Number(process.env.RAMP_MS || 10000);

if (!auctionId) throw new Error("AUCTION_ID is required");
if (!users.length) throw new Error("users.json is empty");

let connected = 0;
let connectionErrors = 0;
let disconnected = 0;
let newBidEvents = 0;
const sockets = [];

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function connectClient(index) {
  const user = users[index % users.length];
  const socket = io(socketUrl, {
    transports: ["websocket"],
    auth: { token: user.token },
    reconnection: false,
  });

  socket.on("connect", () => {
    connected++;
    socket.emit("join-auction", auctionId);
  });
  socket.on("connect_error", () => { connectionErrors++; });
  socket.on("disconnect", () => { disconnected++; });
  socket.on("new-bid", () => { newBidEvents++; });
  sockets.push(socket);
}

console.log(JSON.stringify({ socketUrl, auctionId, clients, durationMs, rampMs }));
for (let i = 0; i < clients; i++) {
  connectClient(i);
  if (rampMs > 0) await delay(rampMs / clients);
}

await delay(durationMs);

for (const socket of sockets) socket.disconnect();
await delay(1000);

console.log(JSON.stringify({ clients, connected, connectionErrors, disconnected, newBidEvents }));
if (connectionErrors > clients * 0.01) process.exitCode = 1;
