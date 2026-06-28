import { Redis } from "ioredis";

// 1. Ensure configuration details are typed correctly and TRIM strings
const redisHost: string = (process.env.REDIS_HOST || "127.0.0.1").trim();
const redisPort: number = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6385;

// The .trim() method wipes out hidden spaces or \r carriage returns!
const redisPassword: string = (process.env.REDIS_PASSWORD || "auctionbidding").trim();

// console.log("Sanitized values:");
// console.log(`Host: '${redisHost}'`);
// console.log(`Port: ${redisPort}`);
// console.log(`Password: '${redisPassword}'`);
// 2. Initialize the Redis client instance directly
const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
});

// 3. Setup event listeners
redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

redis.on("error", (err: Error) => {
  console.error("❌ Redis Error:", err);
});

export default redis;
