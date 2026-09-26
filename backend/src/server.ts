import "dotenv/config";
// Load environment variables immediately before importing other modules
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import { appLogger } from './config/logger.js';
import redis from "./config/redis.js";
import { auctionQueue } from "./jobs/auction.queue.js";
import { auctionWorker } from "./workers/auction.worker.js";


import {
  registerAuctionSocket,
} from "./sockets/auction.socket.js";

import { startFallbackCron, stopFallbackCron } from "./jobs/fallback-cleanup.js";

const PORT: string | number = process.env.PORT || 5050;

const logger = appLogger;

const server: http.Server = http.createServer(app);
let isShuttingDown = false;

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
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  }
);

registerAuctionSocket(io);

const closeHttpServer = () =>
  new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

const closeSocketServer = () =>
  new Promise<void>((resolve) => {
    io.close(() => resolve());
  });

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    logger.warn(`${signal} received while shutdown is already in progress.`);
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);

  try {
    stopFallbackCron();

    await closeSocketServer();
    logger.info("Socket.IO server closed.");

    await closeHttpServer();
    logger.info("HTTP server closed.");

    await auctionWorker.close();
    logger.info("BullMQ worker closed.");

    await auctionQueue.close();
    logger.info("BullMQ queue closed.");

    await redis.quit();
    logger.info("Redis connection closed.");

    await mongoose.disconnect();
    logger.info("MongoDB connection closed.");

    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

const startServer = async () => {
  await connectDB();
  startFallbackCron();

  server.listen(PORT, () => {
    logger.info(`[server]: Server is running seamlessly on port ${PORT}`);
  });
};

void startServer();
