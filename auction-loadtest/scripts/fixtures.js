// This file combines user and auction fixtures into a single place.
// Other test scripts can import everything they need from here instead of multiple files.

// Export user data and helper functions
export { users, userForVU } from "./user-fixtures.js";

// Export auction data and helper functions
export { auctions, auctionForVU, randomAuction } from "./auction-fixtures.js";
