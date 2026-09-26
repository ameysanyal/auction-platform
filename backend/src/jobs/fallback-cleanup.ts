//This code is a **failsafe timer** that runs every 15 minutes to automatically close expired auctions.
//It checks the database for any auctions that are still marked as "active" even though their end time has passed (which can happen if your primary job queue, BullMQ, crashes or restarts). If it finds any, 
//it loops through them and processes their closure one by one.

import AuctionItem from "../models/auction-item.model.js";
import auctionService from "../services/auction.service.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

const runCleanup = async () => {
  console.log("⏰ [fallback-cron] Running cleanup for expired auctions...");
  try {
    const expiredAuctions = await AuctionItem.find({
      status: "active",
      endTime: { $lte: new Date() },
    });

    if (expiredAuctions.length === 0) {
      console.log("[fallback-cron] No expired auctions found.");
      return;
    }

    console.log(`[fallback-cron] Found ${expiredAuctions.length} expired auction(s) to close.`);

    for (const auction of expiredAuctions) {
      const auctionId = auction._id.toString();
      try {
        await auctionService.processAuctionEnd(auctionId);
        console.log(`[fallback-cron] Auction ${auctionId} closed successfully.`);
      } catch (auctionErr) {
        console.error(`[fallback-cron] Failed to close auction ${auctionId} in fallback cleanup:`, auctionErr);
      }
    }
  } catch (err) {
    console.error("[fallback-cron] Error during cleanup:", err);
  }
};

export const stopFallbackCron = () => {
  if (!cleanupInterval) return;

  clearInterval(cleanupInterval);
  cleanupInterval = null;
  console.log("[fallback-cron] Scheduler stopped.");
};

/**
 * Starts the fallback cleanup scheduler.
 * Runs every 15 minutes using native setInterval (no external dependencies).
 * Closes any auctions that BullMQ missed due to server restarts.
 */
export const startFallbackCron = () => {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(runCleanup, FIFTEEN_MINUTES_MS);
  console.log("⏰ [fallback-cron] Scheduler started — running every 15 minutes.");
};
