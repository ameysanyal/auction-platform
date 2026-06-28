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





export const io = new Server(
  server,
  {
    cors: {
      origin: "*",
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