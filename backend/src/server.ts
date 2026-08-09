import "dotenv/config";
// Load environment variables immediately before importing other modules
import { Server } from "socket.io";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { appLogger } from './config/logger.js';


import {
  registerAuctionSocket,
} from "./sockets/auction.socket.js";

import "./workers/auction.worker.js";
import { startFallbackCron } from "./jobs/fallback-cleanup.js";

const PORT: string | number = process.env.PORT || 5050;

const logger = appLogger;

const server: http.Server = http.createServer(app);





const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

export const io = new Server(
  server,
  {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    },
  }
);

// Connect to MongoDB Database
connectDB();

registerAuctionSocket(io);
startFallbackCron();

// Start the Server
server.listen(PORT, () => {
  logger.info(`[server]: Server is running seamlessly on port ${PORT}`);
});