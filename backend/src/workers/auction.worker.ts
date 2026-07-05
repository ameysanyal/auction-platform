import { Worker, type ConnectionOptions } from "bullmq";

import redis from "../config/redis.js";

import AuctionItem from "../models/auction-item.model.js";

import orderService from "../services/order.service.js";

import notificationService from "../services/notification.service.js";

import { NotificationType } from "../models/notification.model.js"; // Adjust path if necessary

import { io } from "../server.js";
import auctionService from "../services/auction.service.js";

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

    try {
      await auctionService.processAuctionEnd(auctionId);
    } catch (err: any) {
      console.error(`[auctionWorker] Failed to process closure for auction ${auctionId}:`, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
  },
);
