import AuctionItem from "../models/auction-item.model.js";
import { Types } from "mongoose";
import { auctionQueue } from "../jobs/auction.queue.js";
import { appLogger } from "../config/logger.js";
import { io } from "../server.js";

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

  async processAuctionEnd(auctionId: string | Types.ObjectId) {
    const idStr = auctionId.toString();
    appLogger.info(`[AuctionService] Ending auction ${idStr} and determining highest bidder`);

    const auction = await AuctionItem.findById(idStr).exec();
    if (!auction) {
      appLogger.warn(`[AuctionService] Auction ${idStr} not found during processAuctionEnd`);
      return;
    }

    if (auction.status !== "active") {
      appLogger.info(`[AuctionService] Auction ${idStr} is already in status "${auction.status}". Skipping.`);
      return;
    }

    // Case 1: No bids
    if (!auction.highestBidder) {
      auction.status = AuctionStatus.EXPIRED_NO_BIDS;
      await auction.save();

      appLogger.info(`[AuctionService] Auction ${idStr} expired with no bids`);

      // Socket.IO events
      io.to(idStr).emit("auction-expired", { auctionId: idStr });
      io.to(idStr).emit("auction:ended", { auctionId: idStr, winner: null, amount: 0, status: "expired_no_bids" });
      return;
    }

    // Case 2: Winning bidder present
    const winnerId = auction.highestBidder.toString();
    const amount = auction.currentBid;

    // Load bidder user with default payment method
    const User = (await import("../models/user.model.js")).default;
    const Order = (await import("../models/order.model.js")).default;
    const notificationService = (await import("./notification.service.js")).default;
    const { NotificationType } = await import("../models/notification.model.js");
    const stripe = (await import("../config/stripe.js")).default;

    const winner = await User.findById(winnerId).exec();

    let order;
    let paymentSucceeded = false;
    let paymentIntentId = "";

    if (winner && winner.hasPaymentProfile && winner.defaultPaymentMethodId && winner.stripeCustomerId) {
      appLogger.info(
        `[AuctionService] Attempting automatic off-session charge of $${amount} for winner ${winnerId} on auction ${idStr}`
      );
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          customer: winner.stripeCustomerId,
          payment_method: winner.defaultPaymentMethodId,
          off_session: true,
          confirm: true,
        });

        if (paymentIntent.status === "succeeded") {
          paymentSucceeded = true;
          paymentIntentId = paymentIntent.id;
          appLogger.info(
            `[AuctionService] Automatic off-session charge succeeded: paymentIntentId=${paymentIntentId}`
          );
        } else {
          appLogger.warn(
            `[AuctionService] Automatic charge status is "${paymentIntent.status}" (not succeeded) for auction ${idStr}`
          );
        }
      } catch (err: any) {
        appLogger.error(
          `[AuctionService] Automatic off-session charge failed for winner ${winnerId}: ${err.message}`
        );
      }
    } else {
      appLogger.info(
        `[AuctionService] Winner ${winnerId} does not have a complete payment profile. Falling back to unpaid order.`
      );
    }

    if (paymentSucceeded) {
      // Create PAID order
      order = await Order.create({
        auction: auction._id,
        winner: winnerId,
        seller: auction.seller,
        amount,
        paymentStatus: "PAID",
        stripeSessionId: paymentIntentId,
        paidAt: new Date(),
      });

      auction.status = AuctionStatus.COMPLETED;
      await auction.save();

      // Notify winner of success
      await notificationService.create({
        userId: winnerId,
        type: NotificationType.AUCTION_WON,
        title: "Auction Won & Paid Successfully",
        message: `Congratulations! You won "${auction.title}" and your card was charged $${amount} automatically.`,
        metadata: {
          auctionId: auction._id,
          orderId: order._id,
        },
      });

      // Broadcast Socket events
      io.to(idStr).emit("auction-ended", {
        auctionId: idStr,
        winner: winnerId,
        amount,
        paid: true,
      });
      io.to(idStr).emit("auction:ended", {
        auctionId: idStr,
        winner: winnerId,
        amount,
        paid: true,
      });
    } else {
      // Create PENDING order
      order = await Order.create({
        auction: auction._id,
        winner: winnerId,
        seller: auction.seller,
        amount,
        paymentStatus: "PENDING",
      });

      auction.status = AuctionStatus.PENDING_PAYMENT;
      await auction.save();

      // Notify winner of pending payment
      await notificationService.create({
        userId: winnerId,
        type: NotificationType.AUCTION_WON,
        title: "Auction Won - Payment Action Required",
        message: `You won "${auction.title}"! Automatic payment failed or profile setup was incomplete. Please click here to complete payment of $${amount}.`,
        metadata: {
          auctionId: auction._id,
          orderId: order._id,
        },
      });

      // Broadcast Socket events
      io.to(idStr).emit("auction-ended", {
        auctionId: idStr,
        winner: winnerId,
        amount,
        paid: false,
      });
      io.to(idStr).emit("auction:ended", {
        auctionId: idStr,
        winner: winnerId,
        amount,
        paid: false,
      });

      // Emit payment:required event
      io.to(`user:${winnerId}`).emit("payment:required", {
        auctionId: idStr,
        orderId: order._id.toString(),
        amount,
      });
    }

    return { auction, order };
  }
}

// Export a singleton instance of the service
export default new AuctionService();
