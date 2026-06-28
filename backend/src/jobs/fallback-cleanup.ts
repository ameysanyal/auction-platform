import AuctionItem from "../models/auction-item.model.js";
import orderService from "../services/order.service.js";
import notificationService from "../services/notification.service.js";
import { NotificationType } from "../models/notification.model.js";
import { io } from "../server.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

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
        if (!auction.highestBidder) {
          auction.status = "expired_no_bids";
          await auction.save();
          io.to(auctionId).emit("auction-expired", { auctionId });
          console.log(`[fallback-cron] Auction ${auctionId} → expired_no_bids.`);
          continue;
        }

        auction.status = "pending_payment";
        await auction.save();

        const order = await orderService.createOrder({
          auctionId,
          winnerId: auction.highestBidder.toString(),
          amount: auction.currentBid,
        });

        await notificationService.create({
          userId: auction.highestBidder.toString(),
          type: NotificationType.AUCTION_WON,
          title: "Auction Won",
          message: `You won the auction: ${auction.title}`,
          metadata: {
            auctionId: auction._id,
            orderId: order._id,
          },
        });

        io.to(auctionId).emit("auction-ended", {
          auctionId,
          winner: auction.highestBidder,
          amount: auction.currentBid,
        });

        console.log(`[fallback-cron] Auction ${auctionId} → pending_payment (winner: ${auction.highestBidder}).`);
      } catch (auctionErr) {
        console.error(`[fallback-cron] Failed to close auction ${auctionId}:`, auctionErr);
      }
    }
  } catch (err) {
    console.error("[fallback-cron] Error during cleanup:", err);
  }
};

/**
 * Starts the fallback cleanup scheduler.
 * Runs every 15 minutes using native setInterval (no external dependencies).
 * Closes any auctions that BullMQ missed due to server restarts.
 */
export const startFallbackCron = () => {
  setInterval(runCleanup, FIFTEEN_MINUTES_MS);
  console.log("⏰ [fallback-cron] Scheduler started — running every 15 minutes.");
};
