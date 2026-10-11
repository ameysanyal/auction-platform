/**
 * Worker process entry point.
 *
 * Role: BullMQ job consumer.
 * - Connects to MongoDB and Redis.
 * - Consumes "close-auction" jobs from the "auction-queue".
 * - Does NOT start an HTTP server or Socket.IO listener.
 * - Socket.IO events are emitted via the shared `io` instance which,
 *   in this role, is a lightweight emitter-only instance backed by
 *   the same Redis channel — so broadcasts reach all API instances.
 *
 * Scaling: Run 1–N instances independently.
 *          BullMQ ensures each job is consumed by exactly one worker.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { appLogger } from "./config/logger.js";
import redis from "./config/redis.js";
import { auctionWorker } from "./workers/auction.worker.js";
import { auctionQueue } from "./jobs/auction.queue.js";

const logger = appLogger;
let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    logger.warn(`[Worker] ${signal} received while shutdown is already in progress.`);
    return;
  }

  isShuttingDown = true;
  logger.info(`[Worker] ${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("[Worker] Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 15_000);

  try {
    // Closes the BullMQ worker cleanly — waits for the current job to finish
    await auctionWorker.close();
    logger.info("[Worker] BullMQ worker closed.");

    await auctionQueue.close();
    logger.info("[Worker] BullMQ queue (producer handle) closed.");

    await redis.quit();
    logger.info("[Worker] Redis connection closed.");

    await mongoose.disconnect();
    logger.info("[Worker] MongoDB connection closed.");

    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error("[Worker] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

const startWorker = async () => {
  logger.info("🔨 [Worker] Starting BullMQ worker process...");

  await connectDB();

  auctionWorker.on("ready", () => {
    logger.info("✅ [Worker] BullMQ worker is ready and consuming jobs from 'auction-queue'.");
  });

  auctionWorker.on("active", (job) => {
    logger.info(`[Worker] Job ${job.id} (${job.name}) picked up — auctionId=${job.data.auctionId as string}`);
  });

  auctionWorker.on("completed", (job) => {
    logger.info(`[Worker] Job ${job.id} (${job.name}) completed successfully.`);
  });

  auctionWorker.on("failed", (job, err) => {
    logger.error(`[Worker] Job ${job?.id ?? "unknown"} (${job?.name ?? "unknown"}) failed: ${err.message}`);
  });

  auctionWorker.on("error", (err) => {
    logger.error("[Worker] BullMQ worker error:", err);
  });

  logger.info("🔨 [Worker] BullMQ worker is initializing...");
};

void startWorker();
