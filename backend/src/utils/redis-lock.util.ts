import redis from "../config/redis.js";
import { randomUUID } from "crypto";

// Lua script for atomic compare-and-delete.
// Only deletes the key if its value matches the caller's token,
// preventing a slow request from releasing a lock it no longer owns.
const RELEASE_LOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

/**
 * Acquires a distributed lock using Redis with a unique token.
 *
 * A UUID token is stored as the lock value so that only the original
 * acquirer can release it — even if the TTL has already expired and
 * another caller has re-acquired the same key.
 *
 * @param key The unique key string to lock.
 * @param ttl Time-to-live in milliseconds (defaults to 5000ms).
 * @returns The unique lock token if acquired, or null if the lock is
 *          already held by another caller.
 */
export const acquireLock = async (
  key: string,
  ttl: number = 5000
): Promise<string | null> => {
  const token = randomUUID();
  // 'PX' specifies milliseconds, 'NX' ensures it only sets if the key doesn't exist
  const result = await redis.set(key, token, "PX", ttl, "NX");
  return result === "OK" ? token : null;
};

/**
 * Releases a distributed lock only if the provided token matches the stored value.
 *
 * Uses an atomic Lua script to guarantee that a request cannot delete a lock
 * it no longer owns (e.g., after its TTL expired and another request re-acquired it).
 *
 * @param key   The unique key string to unlock.
 * @param token The token returned by {@link acquireLock} when the lock was acquired.
 * @returns     true if the lock was released by this caller, false if the token
 *              did not match (lock was already expired or owned by someone else).
 */
export const releaseLock = async (
  key: string,
  token: string
): Promise<boolean> => {
  const result = await redis.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
  return result === 1;
};