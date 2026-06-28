import redis from "../config/redis.js"; 

/**
 * Acquires a distributed lock using Redis.
 * @param key The unique key string to lock.
 * @param ttl Time-to-live in milliseconds (defaults to 5000ms).
 * @returns Promise<boolean> Returns true if the lock was acquired, false otherwise.
 */
export const acquireLock = async (
  key: string,
  ttl: number = 5000
): Promise<boolean> => {
  // 'PX' specifies milliseconds, 'NX' ensures it only sets if the key doesn't exist
  const result = await redis.set(
    key, 
    "locked", 
    "PX", 
    ttl, 
    "NX"
  );

  return result === "OK";
};

/**
 * Releases a distributed lock by deleting the key.
 * @param key The unique key string to unlock.
 */
export const releaseLock = async (key: string): Promise<void> => {
  await redis.del(key);
};