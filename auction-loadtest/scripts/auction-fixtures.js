// This file provides pre-seeded auction data to k6 tests.

import { SharedArray } from "k6/data";

// SharedArray loads all auctions from JSON file once and shares them across all virtual users.
// This prevents high RAM usage during load tests.
export const auctions = new SharedArray("auctions", () => JSON.parse(open(__ENV.AUCTIONS_FILE || "../data/auctions.json")));

// Helper function to pick an auction deterministically for the current virtual user (VU).
// Uses the VU index (__VU) so each worker tests a consistent auction.
export function auctionForVU() {
  return auctions[(__VU - 1) % auctions.length];
}

// Helper function to pick a completely random auction from the loaded list.
export function randomAuction() {
  return auctions[Math.floor(Math.random() * auctions.length)];
}
