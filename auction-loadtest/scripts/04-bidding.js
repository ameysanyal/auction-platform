// ============================================================================
// Load Test Script 04: High Concurrency Bidding
// Purpose: Simulates active bidding wars on auctions.
// Measures how well the platform handles concurrent bid submissions, database
// transactions, and race conditions.
// ============================================================================

import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";
import { BASE_URL, users, auctions, jsonHeaders } from "./lib.js";

// Custom metrics to track bidding performance specifically:
// 1. bid_success_rate: tracks what percentage of bids were accepted (HTTP 201)
const bidSuccessRate = new Rate("bid_success_rate");
// 2. bid_latency: measures the time taken specifically for bid submissions
const bidLatency = new Trend("bid_latency", true);

// Inform k6 that HTTP 201 (Created), 400 (Bad Request), and 409 (Conflict) are expected responses.
// In an auction, when multiple users bid simultaneously, only one can win each price step.
// The other bids get rejected with 400 or 409. These are expected business logic rejections,
// not server crashes.
http.setResponseCallback(http.expectedStatuses(201, 400, 409));

// Configuration from environment variables
const rate = Number(__ENV.BID_RATE || 100); // Bids to attempt per second (default: 100)
const duration = __ENV.DURATION || "1m";     // Test duration (default: 1 minute)
// Scenario type:
// - "hot": all users bid on a SINGLE auction item (extreme contention test)
// - "distributed": users bid across multiple different auctions (typical traffic)
const scenario = (__ENV.SCENARIO || "distributed").toLowerCase();
const hotAuction = auctions[0];

export const options = {
  scenarios: {
    bids: {
      // Keeps a constant bid submission rate
      executor: "constant-arrival-rate",
      rate,
      timeUnit: "1s",
      duration,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.max(100, rate)),
      maxVUs: Number(__ENV.MAX_VUS || Math.max(500, rate * 5)),
    },
  },
  thresholds: {
    // Overall unexpected HTTP errors (like 500 internal errors or connection drops) must be under 20%
    http_req_failed: ["rate<0.20"],

    // At least 1% of bids should succeed (under heavy hot-auction contention, many will be outbid)
    bid_success_rate: ["rate>0.01"],

    // 95% of bids must complete in under 1.5 seconds, and 99% under 3 seconds
    bid_latency: ["p(95)<1500", "p(99)<3000"],
  },
};

// Main function executed on each bid attempt
export default function () {
  // Use users starting from index 10 onward as bidders (leaving the first 10 as sellers)
  const bidderPoolSize = Math.max(1, users.length - 10);
  const user = users[10 + ((__ITER + __VU * 1009) % bidderPoolSize)];

  // Choose the target auction: either the single "hot" auction or spread across the list
  const auction = scenario === "hot" ? hotAuction : auctions[(__ITER + __VU) % auctions.length];

  // Calculate a unique, escalating bid amount to ensure it's higher than the starting price.
  // Under high contention, some bids will still be rejected if another request arrives first.
  const amount = 101 + (__VU * 1000000) + __ITER;

  // Track start time to calculate latency
  const started = Date.now();

  // Send POST request to place the bid
  const res = http.post(
    `${BASE_URL}/bids/${auction.id}`,
    JSON.stringify({ amount }),
    {
      headers: jsonHeaders(user.token),
      tags: { endpoint: "place-bid", scenario },
    },
  );

  // Status 201 means bid accepted; 400 or 409 means business logic rejection (e.g. outbid)
  const businessRejection = [400, 409].includes(res.status);
  const ok = res.status === 201;

  // Check that the request either succeeded or was cleanly rejected by auction business rules
  check(res, {
    "bid succeeded or was a business rejection": r => ok || businessRejection,
  });

  // Record metrics
  bidSuccessRate.add(ok);
  bidLatency.add(Date.now() - started);
}
