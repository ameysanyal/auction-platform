import { BASE_URL } from "./config.js";
import { users, auctions, userForVU, auctionForVU, randomAuction } from "./fixtures.js";

export { BASE_URL };
export { users, auctions, userForVU, auctionForVU, randomAuction };

export function jsonHeaders(token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
