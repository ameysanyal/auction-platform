/**
 * Scheduler process entry point.
 *
 * Role: Fallback cleanup cron — guaranteed singleton.
 * - Connects to MongoDB.
 * - Runs the fallback cleanup cron every 15 minutes to catch any auctions
 *   that BullMQ missed (e.g. after a crash or delayed restart).
 * - Does NOT start an HTTP server, Socket.IO server, or BullMQ worker.
 * - Must run as exactly ONE process. In PM2 this is enforced by
 *   `instances: 1` and `exec_mode: "fork"` in ecosystem.config.cjs.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { appLogger } from "./config/logger.js";
import { startFallbackCron, stopFallbackCron } from "./jobs/fallback-cleanup.js";

const logger = appLogger;
let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    logger.warn(`[Scheduler] ${signal} received while shutdown is already in progress.`);
    return;
  }

  isShuttingDown = true;
  logger.info(`[Scheduler] ${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("[Scheduler] Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);

  try {
    stopFallbackCron();
    logger.info("[Scheduler] Fallback cron stopped.");

    await mongoose.disconnect();
    logger.info("[Scheduler] MongoDB connection closed.");

    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error("[Scheduler] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

const startScheduler = async () => {
  logger.info("⏰ [Scheduler] Starting dedicated fallback scheduler process...");

  await connectDB();

  startFallbackCron();

  logger.info("✅ [Scheduler] Fallback cron is running. Scans every 15 minutes for missed expired auctions.");
};

void startScheduler();
