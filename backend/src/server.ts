import "dotenv/config";
// Load environment variables immediately before importing other modules
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import app from "./app.js";
import connectDB from "./config/db.js";
import { appLogger } from "./config/logger.js";
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

let socketPubClient: Redis | null = null;
let socketSubClient: Redis | null = null;

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

    if (socketPubClient) {
      await socketPubClient.quit().catch((err) => {
        logger.error("Error closing Socket.IO Redis Pub client:", err);
      });
      logger.info("Socket.IO Redis Pub client closed.");
    }

    if (socketSubClient) {
      await socketSubClient.quit().catch((err) => {
        logger.error("Error closing Socket.IO Redis Sub client:", err);
      });
      logger.info("Socket.IO Redis Sub client closed.");
    }

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

  // Socket.IO Redis adapter for cross-instance broadcasts
  const redisHost: string = (process.env.REDIS_HOST || "127.0.0.1").trim();
  const redisPort: number = process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : 6385;
  const redisPassword: string = (process.env.REDIS_PASSWORD || "auctionbidding").trim();
  const isTls = process.env.REDIS_TLS === "true" || redisPort === 6380;

  socketPubClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
    ...(isTls ? { tls: {} } : {}),
  });

  socketSubClient = socketPubClient.duplicate();

  socketPubClient.on("error", (err: Error) => {
    logger.error("❌ Socket.IO Redis Pub Client Error:", err);
  });

  socketSubClient.on("error", (err: Error) => {
    logger.error("❌ Socket.IO Redis Sub Client Error:", err);
  });

  await Promise.all([
    socketPubClient.ping(),
    socketSubClient.ping(),
  ]);

  io.adapter(createAdapter(socketPubClient, socketSubClient));
  logger.info("✅ Socket.IO Redis adapter attached.");

  // Run the fallback cleanup cron only on the designated instance
  if (process.env.ENABLE_FALLBACK_CRON === "true") {
    startFallbackCron();
    logger.info("⏰ Fallback cron scheduler enabled on this instance.");
  } else {
    logger.info("ℹ️ Fallback cron scheduler disabled on this instance (ENABLE_FALLBACK_CRON != true).");
  }

  server.listen(PORT, () => {
    logger.info(`[server]: Server is running seamlessly on port ${PORT}`);
  });
};

void startServer();
