import AuctionItem from "../models/auction-item.model.js";
import { Types } from "mongoose";
import { auctionQueue } from "../jobs/auction.queue.js";
import { appLogger } from "../config/logger.js";

// Define an enum for the explicit auction statuses
export enum AuctionStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  EXPIRED_NO_BIDS = "expired_no_bids",
  PENDING_PAYMENT = "pending_payment",
}

// Interface for creating a new auction item
interface ICreateAuctionInput {
  title: string;
  description?: string;
  startingPrice: number;
  currentPrice?: number;
  seller: string | Types.ObjectId;
  endsAt: Date;
  [key: string]: any; // Allows for additional flexible fields from data payload
}

class AuctionService {
  /**
   * Creates a new auction item
   */
  async createAuction(data: ICreateAuctionInput) {
    appLogger.info(`[AuctionService] Creating auction: "${data.title}" by seller ${data.seller}`);

    const auction = await AuctionItem.create(data);

    const delay = new Date(auction.endTime).getTime() - Date.now();

    appLogger.info(
      `[AuctionService] Auction ${auction._id} created. Scheduling BullMQ close-auction job with delay=${delay}ms`
    );

    await auctionQueue.add(
      "close-auction",
      {
        auctionId: auction._id.toString(),
      },
      {
        delay,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );

    appLogger.info(`[AuctionService] BullMQ job queued for auction ${auction._id}`);
    return auction;
  }

  /**
   * Fetches an auction by ID and populates seller and bidder details
   */
  async getAuctionById(id: string | Types.ObjectId) {
    appLogger.debug(`[AuctionService] Fetching auction by ID: ${id}`);
    return AuctionItem.findById(id)
      .populate("seller", "name")
      .populate("highestBidder", "name email")
      .exec();
  }

  /**
   * Closes an auction and marks it as pending_payment or expired_no_bids depending on bidder presence
   */
  async closeAuction(auctionId: string | Types.ObjectId) {
    appLogger.info(`[AuctionService] Closing auction ${auctionId}`);

    const auction = await AuctionItem.findById(auctionId).exec();

    if (!auction) {
      appLogger.warn(`[AuctionService] Auction ${auctionId} not found during closeAuction`);
      throw new Error("Auction not found");
    }

    // If there's a highest bidder, the item is pending_payment; otherwise, it has expired_no_bids
    const newStatus = auction.highestBidder
      ? AuctionStatus.PENDING_PAYMENT
      : AuctionStatus.EXPIRED_NO_BIDS;

    auction.status = newStatus;
    await auction.save();

    appLogger.info(`[AuctionService] Auction ${auctionId} status → ${newStatus}`);
    return auction;
  }

  /**
   * Retrieves all active auctions sorted by newest first
   */
  async getActiveAuctions(page = 1, limit = 10) {
    appLogger.debug(`[AuctionService] Fetching active auctions — page=${page}, limit=${limit}`);

    const skip = (page - 1) * limit;

    const auctions = await AuctionItem.find({
      status: "active",
    })
      .skip(skip)
      .limit(limit)
      .sort({
        createdAt: -1,
      });

    const total = await AuctionItem.countDocuments({
      status: "active",
    });

    appLogger.debug(`[AuctionService] Found ${total} active auction(s) (page ${page})`);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: auctions,
    };
  }
}

// Export a singleton instance of the service
export default new AuctionService();
