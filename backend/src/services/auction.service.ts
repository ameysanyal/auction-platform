import AuctionItem from "../models/auction-item.model.js";
import { Types } from "mongoose";
import { performance } from "node:perf_hooks";
import { auctionQueue } from "../jobs/auction.queue.js";
import { appLogger } from "../config/logger.js";
import { io } from "../sockets/io.js";
import { acquireLock, releaseLock } from "../utils/redis-lock.util.js";

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
  endTime: Date;
  images?: string[];
  [key: string]: any; // Allows for additional flexible fields from data payload
}

class AuctionService {
  /**
   * Creates a new auction item
   */
  async createAuction(data: ICreateAuctionInput) {
    appLogger.info(`[AuctionService] Creating auction: "${data.title}" by seller ${data.seller}`);

    const auction = await AuctionItem.create(data);

    // auction.endTime is a MongoDB Date; subtract epoch ms directly — no timezone involved.
    const delay = auction.endTime.getTime() - Date.now();

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
    const shouldMeasure = Math.random() < 0.01;

    const findStart = performance.now();
    const findPromise = AuctionItem.find({
      status: "active",
    })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()
      .then((result) => ({
        result,
        ms: performance.now() - findStart,
      }));

    const countStart = performance.now();
    const countPromise = AuctionItem.countDocuments({
      status: "active",
    })
      .exec()
      .then((result) => ({
        result,
        ms: performance.now() - countStart,
      }));

    const [findResult, countResult] = await Promise.all([
      findPromise,
      countPromise,
    ]);

    const auctions = findResult.result;
    const total = countResult.result;

    if (shouldMeasure) {
      console.log({
        page,
        limit,
        total,
        findMs: +findResult.ms.toFixed(2),
        countMs: +countResult.ms.toFixed(2),
        totalMs: +(Math.max(findResult.ms, countResult.ms)).toFixed(2),
      });
    }

    appLogger.debug(`[AuctionService] Found ${total} active auction(s) (page ${page})`);

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: auctions,
    };
  }

  /**
   * Finalizes an auction idempotently.
   * Safe for multiple workers and retries:
   * 1. Uses distributed lock and atomic state transition in MongoDB.
   * 2. Uses Stripe idempotency keys to ensure card is charged at most once.
   * 3. Uses unique order constraint to prevent duplicate order generation.
   */
  async processAuctionEnd(auctionId: string | Types.ObjectId) {
    const idStr = auctionId.toString();
    appLogger.info(`[AuctionService] Ending auction ${idStr} and determining highest bidder`);

    const Order = (await import("../models/order.model.js")).default;
    const existingOrder = await Order.findOne({ auction: idStr }).exec();

    const initialAuction = await AuctionItem.findById(idStr).exec();
    if (!initialAuction) {
      appLogger.warn(`[AuctionService] Auction ${idStr} not found during processAuctionEnd`);
      return;
    }

    // If an order already exists, ensure the auction status is properly aligned and return (idempotency check)
    if (existingOrder) {
      appLogger.info(
        `[AuctionService] Order ${existingOrder._id} already exists for auction ${idStr}. Ensuring auction status is updated.`
      );
      const expectedStatus =
        existingOrder.paymentStatus === "PAID"
          ? AuctionStatus.COMPLETED
          : AuctionStatus.PENDING_PAYMENT;

      if (initialAuction.status !== expectedStatus) {
        initialAuction.status = expectedStatus;
        await initialAuction.save();
      }
      return { auction: initialAuction, order: existingOrder };
    }

    // If already finalized with no bids, skip
    if (initialAuction.status === AuctionStatus.EXPIRED_NO_BIDS) {
      appLogger.info(`[AuctionService] Auction ${idStr} is already marked as expired_no_bids. Skipping.`);
      return;
    }

    // If already completed and no bids/orders to process
    if (initialAuction.status === AuctionStatus.COMPLETED) {
      appLogger.info(`[AuctionService] Auction ${idStr} is already completed. Skipping.`);
      return;
    }

    // Acquire a distributed lock for finalization to serialize concurrent workers
    const lockKey = `finalize:${idStr}`;
    const lockToken = await acquireLock(lockKey, 15000); // 15s TTL

    if (!lockToken) {
      appLogger.warn(
        `[AuctionService] Finalization lock already held for auction ${idStr}. Another worker is finalizing.`
      );
      return;
    }

    try {
      // Re-verify existing order inside the lock to handle races where competing worker just finished
      const postLockOrder = await Order.findOne({ auction: idStr }).exec();
      if (postLockOrder) {
        appLogger.info(
          `[AuctionService] Order already created for auction ${idStr} by competing worker. Exiting.`
        );
        return { auction: initialAuction, order: postLockOrder };
      }

      // Case 1: No bids — Atomically transition status from active to expired_no_bids
      if (!initialAuction.highestBidder) {
        const expiredAuction = await AuctionItem.findOneAndUpdate(
          {
            _id: idStr,
            status: "active",
            $or: [{ highestBidder: { $exists: false } }, { highestBidder: null }],
          },
          {
            $set: { status: AuctionStatus.EXPIRED_NO_BIDS },
          },
          { new: true }
        ).exec();

        if (!expiredAuction) {
          appLogger.info(
            `[AuctionService] Auction ${idStr} was already transitioned or received a bid. Skipping expiration.`
          );
          return;
        }

        appLogger.info(`[AuctionService] Auction ${idStr} expired with no bids`);

        // Socket.IO events
        io.to(idStr).emit("auction-expired", { auctionId: idStr });
        io.to(idStr).emit("auction:ended", {
          auctionId: idStr,
          winner: null,
          amount: 0,
          status: "expired_no_bids",
        });
        return { auction: expiredAuction };
      }

      // Case 2: Winning bidder present — Atomically transition auction out of "active"
      // This immediately claims finalization and guards against race conditions
      const claimedAuction = await AuctionItem.findOneAndUpdate(
        {
          _id: idStr,
          status: { $in: ["active", "pending_payment"] },
          highestBidder: { $exists: true, $ne: null },
        },
        {
          $set: { status: AuctionStatus.PENDING_PAYMENT },
        },
        { new: true }
      ).exec();

      if (!claimedAuction) {
        appLogger.info(
          `[AuctionService] Auction ${idStr} could not be claimed for finalization (status changed). Exiting.`
        );
        return;
      }

      const winnerId = claimedAuction.highestBidder!.toString();
      const amount = claimedAuction.currentBid;

      // Load bidder user with default payment method
      const User = (await import("../models/user.model.js")).default;
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
          // Idempotent Stripe charge: Passing idempotencyKey prevents double charging on retries or concurrent calls
          const paymentIntent = await stripe.paymentIntents.create(
            {
              amount: Math.round(amount * 100),
              currency: "usd",
              customer: winner.stripeCustomerId,
              payment_method: winner.defaultPaymentMethodId,
              off_session: true,
              confirm: true,
            },
            {
              idempotencyKey: `auction_final_charge_${idStr}`,
            }
          );

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
        // Create PAID order idempotently
        try {
          order = await Order.create({
            auction: claimedAuction._id,
            winner: winnerId,
            seller: claimedAuction.seller,
            amount,
            paymentStatus: "PAID",
            stripeSessionId: paymentIntentId,
            paidAt: new Date(),
          });
        } catch (err: any) {
          if (err.code === 11000) {
            appLogger.warn(
              `[AuctionService] Order already created concurrently for auction ${idStr}. Fetching existing order.`
            );
            order = await Order.findOne({ auction: claimedAuction._id });
          } else {
            throw err;
          }
        }

        claimedAuction.status = AuctionStatus.COMPLETED;
        await claimedAuction.save();

        // Notify winner of success
        if (order) {
          await notificationService.create({
            userId: winnerId,
            type: NotificationType.AUCTION_WON,
            title: "Auction Won & Paid Successfully",
            message: `Congratulations! You won "${claimedAuction.title}" and your card was charged $${amount} automatically.`,
            metadata: {
              auctionId: claimedAuction._id,
              orderId: order._id,
            },
          });
        }

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
        // Create PENDING order idempotently
        try {
          order = await Order.create({
            auction: claimedAuction._id,
            winner: winnerId,
            seller: claimedAuction.seller,
            amount,
            paymentStatus: "PENDING",
          });
        } catch (err: any) {
          if (err.code === 11000) {
            appLogger.warn(
              `[AuctionService] Order already created concurrently for auction ${idStr}. Fetching existing order.`
            );
            order = await Order.findOne({ auction: claimedAuction._id });
          } else {
            throw err;
          }
        }

        claimedAuction.status = AuctionStatus.PENDING_PAYMENT;
        await claimedAuction.save();

        // Notify winner of pending payment
        if (order) {
          await notificationService.create({
            userId: winnerId,
            type: NotificationType.AUCTION_WON,
            title: "Auction Won - Payment Action Required",
            message: `You won "${claimedAuction.title}"! Automatic payment failed or profile setup was incomplete. Please click here to complete payment of $${amount}.`,
            metadata: {
              auctionId: claimedAuction._id,
              orderId: order._id,
            },
          });
        }

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

        if (order) {
          // Emit payment:required event
          io.to(`user:${winnerId}`).emit("payment:required", {
            auctionId: idStr,
            orderId: order._id.toString(),
            amount,
          });
        }
      }

      return { auction: claimedAuction, order };
    } finally {
      await releaseLock(lockKey, lockToken);
      appLogger.debug(`[AuctionService] Released finalization lock for auction ${idStr}`);
    }
  }
}

// Export a singleton instance of the service
export default new AuctionService();
