import { BASE_URL } from "./config.js";
import { users, auctions, userForVU, auctionForVU, randomAuction } from "./fixtures.js";

export { BASE_URL };
export { users, auctions, userForVU, auctionForVU, randomAuction, auctionForAuthenticatedVU };

export function jsonHeaders(token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function auctionForAuthenticatedVU() {
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  const auctionIndex = (userIndex + 10) % auctions.length;

  let auction = auctions[auctionIndex];

  if (auction.sellerId === user.id) {
    auction = auctions[(auctionIndex + 1) % auctions.length];
  }

  return auction;
}