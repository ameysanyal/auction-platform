import { SharedArray } from "k6/data";

export const auctions = new SharedArray("auctions", () => JSON.parse(open(__ENV.AUCTIONS_FILE || "../data/auctions.json")));

export function auctionForVU() {
  return auctions[(__VU - 1) % auctions.length];
}

export function randomAuction() {
  return auctions[Math.floor(Math.random() * auctions.length)];
}
