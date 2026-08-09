//This code initializes a BullMQ job queue named "auction-queue" powered by a Redis database.
import { Queue, type ConnectionOptions } from "bullmq"; 

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

export const auctionQueue = new Queue("auction-queue", {
  connection: redisConnection,
});

/*
Setting	                                         Behavior when Redis disconnects
maxRetriesPerRequest: 20 (default)	             Retries 20 times, then throws a fatal error and crashes the worker.
maxRetriesPerRequest: null (BullMQ requirement)	 Fails immediately or waits for reconnection without aborting blocking commands. BullMQ safely manages the retry lifecycle itself. */
