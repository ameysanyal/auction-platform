import Bid from "../models/bid.model.js";
import AuctionItem from "../models/auction-item.model.js";
import { acquireLock, releaseLock } from "../utils/redis-lock.util.js";
import { Types } from "mongoose";
import { io } from "../server.js";
import mongoose from "mongoose";
import { appLogger } from "../config/logger.js";

// Interface for the placeBid input payload
interface IPlaceBidInput {
  auctionId: string | Types.ObjectId;
  bidderId: string | Types.ObjectId;
  amount: number;
}

class BidService {
  async placeBid({ auctionId, bidderId, amount }: IPlaceBidInput) {
    const lockKey = `bid:${auctionId.toString()}`;

    appLogger.info(
      `[BidService] placeBid — auctionId=${auctionId} bidderId=${bidderId} amount=$${amount}`
    );

    // Acquire lock to avoid race conditions during hot bidding
    const locked = await acquireLock(lockKey);

    if (!locked) {
      appLogger.warn(`[BidService] Lock contention on auction ${auctionId}. Bid rejected.`);
      throw new Error("Another bid is processing");
    }

    appLogger.debug(`[BidService] Lock acquired for auction ${auctionId}`);

    // Start the MongoDB session for the transaction
    const session = await mongoose.startSession();

    try {
      const auction = await AuctionItem.findById(auctionId).exec();

      if (!auction) {
        appLogger.warn(`[BidService] Auction ${auctionId} not found`);
        throw new Error("Auction not found");
      }

      if (new Date() > auction.endTime) {
        appLogger.warn(`[BidService] Bid rejected — auction ${auctionId} has already ended`);
        throw new Error("Auction has ended");
      }

      // Safeguard against anti-shill bidding (converting IDs safely to strings)
      if (auction.seller.toString() === bidderId.toString()) {
        appLogger.warn(
          `[BidService] Bid rejected — seller ${bidderId} attempted to bid on their own auction ${auctionId}`
        );
        throw new Error("Cannot bid on your own auction");
      }

      if (auction.status !== "active") {
        appLogger.warn(
          `[BidService] Bid rejected — auction ${auctionId} status is "${auction.status}" (not active)`
        );
        throw new Error("Auction closed");
      }

      // Check current bid or fallback to the initial starting price
      const minimumBid = auction.currentBid || auction.startingPrice;

      if (amount <= minimumBid) {
        appLogger.warn(
          `[BidService] Bid rejected — amount $${amount} ≤ current minimum $${minimumBid} for auction ${auctionId}`
        );
        throw new Error("Bid must be higher than current bid");
      }

      // Store the previous highest bidder before overriding it
      const previousHighestBidder = auction.highestBidder;

      // --- TRANSACTION START ---
      session.startTransaction();
      appLogger.debug(`[BidService] Transaction started for auction ${auctionId}`);

      // Create the bid document within the transaction
      const bid = await Bid.create(
        [
          {
            auction: auctionId,
            bidder: bidderId,
            amount,
          },
        ],
        { session },
      );

      // Update state on the auction item document
      auction.currentBid = amount;
      auction.highestBidder = bidderId as any; // Cast safely if document interface requires explicit structural binding

      // Save the auction updates within the transaction
      await auction.save({ session });

      // Commit the transaction changes to the database
      await session.commitTransaction();
      // --- TRANSACTION END ---

      appLogger.info(
        `[BidService] Bid committed — auction ${auctionId} new highest bid=$${amount} by bidder ${bidderId}`
      );

      // 1. Notify the specific user who just got outbid (if there was one and it wasn't the current bidder)
      if (
        previousHighestBidder &&
        previousHighestBidder.toString() !== bidderId.toString()
      ) {
        appLogger.debug(
          `[BidService] Emitting outbid event to user ${previousHighestBidder.toString()}`
        );
        io.to(`user:${previousHighestBidder.toString()}`).emit("outbid", {
          auctionId,
          newAmount: amount,
        });
      }

      // 2. Broadcast general room update for the new bid
      appLogger.debug(`[BidService] Broadcasting new-bid event to room ${auctionId}`);
      io.to(auctionId.toString()).emit("new-bid", {
        auctionId,
        amount,
        bidderId,
      });

      // Bid.create returns an array when passed an array payload
      return bid[0];
    } catch (error) {
      // If a transaction was active, abort it
      if (session.inTransaction()) {
        await session.abortTransaction();
        appLogger.warn(`[BidService] Transaction aborted for auction ${auctionId}`);
      }

      appLogger.error(
        `[BidService] placeBid failed for auction ${auctionId}: ${(error as Error).message}`
      );
      throw error;
    } finally {
      // Always clean up the session and release the concurrency lock
      session.endSession();
      await releaseLock(lockKey);
      appLogger.debug(`[BidService] Session ended and lock released for auction ${auctionId}`);
    }
  }
}

// Export a singleton instance of the service
export default new BidService();
