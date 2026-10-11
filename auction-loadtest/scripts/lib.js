// This file contains shared helper functions and configuration for k6 load tests.

import { BASE_URL } from "./config.js";
import { users, auctions, userForVU, auctionForVU, randomAuction } from "./fixtures.js";

// Re-export common configuration and fixture data so test scripts can import from one place
export { BASE_URL };
export { users, auctions, userForVU, auctionForVU, randomAuction };

// Helper function to build standard HTTP headers for JSON requests.
// If a JWT token is passed, it adds the "Authorization: Bearer <token>" header for authenticated requests.
export function jsonHeaders(token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Helper function to pick an auction for an authenticated virtual user (VU).
// Important: In this auction system, a user cannot bid on their own auction.
// This function picks an auction offset from the user's index, and if the user happens
// to be the seller, it shifts to the next auction to avoid self-bidding errors.
export function auctionForAuthenticatedVU() {
  // Find the user assigned to this virtual user (VU)
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  // Pick an auction with an offset (+10) so the user is usually not the seller
  const auctionIndex = (userIndex + 10) % auctions.length;
  let auction = auctions[auctionIndex];

  // Double check: if this user is the seller of this auction, pick the next auction instead
  if (auction.sellerId === user.id) {
    auction = auctions[(auctionIndex + 1) % auctions.length];
  }

  return auction;
}
