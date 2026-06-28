import { Worker, type ConnectionOptions } from "bullmq";

import redis from "../config/redis.js";

import AuctionItem from "../models/auction-item.model.js";

import orderService from "../services/order.service.js";

import notificationService from "../services/notification.service.js";

import { NotificationType } from "../models/notification.model.js"; // Adjust path if necessary

import { io } from "../server.js";

const redisHost: string = process.env.REDIS_HOST || "127.0.0.1";
const redisPort: number = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6385;

const redisPassword: string = (process.env.REDIS_PASSWORD || "auctionbidding").trim();

// Use ConnectionOptions instead of RedisOptions
export const redisConnection: ConnectionOptions = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
};

export const auctionWorker = new Worker(
  "auction-queue",
  async (job) => {
    if (job.name !== "close-auction") return;

    const { auctionId } = job.data;

    const auction = await AuctionItem.findById(auctionId);

    if (!auction) return;

    if (auction.status !== "active") return;

    if (!auction.highestBidder) {
      auction.status = "expired_no_bids";

      await auction.save();

      io.to(auctionId).emit("auction-expired", {
        auctionId,
      });

      return;
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

      message: `You won ${auction.title}`,

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
  },
  {
    connection: redisConnection,
  },
);
