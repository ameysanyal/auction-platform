// Imports the Worker class and ConnectionOptions type from the 'bullmq' library.
// The Worker processes jobs from a queue, and ConnectionOptions ensures strict typing for the Redis connection configuration.
import { Worker, type ConnectionOptions } from "bullmq";

// Imports the core auction service module that contains the business logic for managing auctions.
import auctionService from "../services/auction.service.js";

// Retrieves the Redis host from environment variables, defaulting to '127.0.0.1' (localhost) if not provided.
const redisHost: string = process.env.REDIS_HOST || "127.0.0.1";

// Retrieves the Redis port from environment variables, parses it into a base-10 integer, 
// or defaults to 6385 if the environment variable is missing.
const redisPort: number = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6385;

// Retrieves the Redis password from environment variables (defaulting to 'auctionbidding') and strips any accidental whitespace.
const redisPassword: string = (process.env.REDIS_PASSWORD || "auctionbidding").trim();

// Creates and exports a strongly-typed configuration object for the Redis connection.
export const redisConnection: ConnectionOptions = {
  host: redisHost,                                  // Sets the Redis server host address.
  port: redisPort,                                  // Sets the Redis server port.
  password: redisPassword,                          // Sets the password authentication for Redis.
  maxRetriesPerRequest: null,                       // Crucial BullMQ setting: disables retry limits on commands so BullMQ can handle its block-waiting mechanisms without throwing errors.
};

// Instantiates and exports a BullMQ Worker instance named 'auctionWorker'.
export const auctionWorker = new Worker(
  "auction-queue",                                  // The name of the specific queue this worker will listen to for incoming jobs.
  async (job) => {                                  // The asynchronous processor function that executes every time a job is picked up.
    if (job.name !== "close-auction") return;       // Guard clause: Ignores and skips the job if its name isn't explicitly "close-auction".

    const { auctionId } = job.data;                 // Destructures and extracts the payload 'auctionId' sent alongside the queue job.

    try {
      // Calls the service layer to execute the business logic for finalizing the auction.
      await auctionService.processAuctionEnd(auctionId);
    } catch (err: any) {
      // Logs a clean error message to the console if the auction closure process fails.
      console.error(`[auctionWorker] Failed to process closure for auction ${auctionId}:`, err);
      
      // Re-throws the error so BullMQ knows the job failed, allowing it to move to the 'failed' state or trigger automatic retries.
      throw err;
    }
  },
  {
    connection: redisConnection,                    // Passes the predefined Redis connection settings to the worker.
  },
);