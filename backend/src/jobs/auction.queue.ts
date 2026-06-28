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