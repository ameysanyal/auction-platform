// ============================================================================
// Load Test Script 02a: Auction List Only
// Purpose: Tests ONLY the auction listing endpoint (/auctions?page=X&limit=12)
// without clicking into individual auction details.
// This is great for measuring pure database query and pagination performance.
// ============================================================================

import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

// Target requests per second (default: 100 RPS)
const target = Number(__ENV.TARGET_RPS || 100);

// Total test duration (default: 1 minute)
const duration = __ENV.DURATION || "1m";

// k6 scenario configuration
export const options = {
  scenarios: {
    auction_list: {
      // Keeps a steady request rate independent of response latency
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,

      // Initial pool of virtual users
      preAllocatedVUs: Number(
        __ENV.PRE_VUS || Math.max(50, Math.ceil(target / 5))
      ),

      // Maximum pool of virtual users to handle slow responses or backpressure
      maxVUs: Number(
        __ENV.MAX_VUS || Math.max(200, target * 2)
      ),
    },
  },

  // Performance thresholds to pass the test
  thresholds: {
    // Less than 1% failure rate
    http_req_failed: ["rate<0.01"],

    // 95% of list requests must respond within 500ms, and 99% within 1000ms
    http_req_duration: [
      "p(95)<500",
      "p(99)<1000",
    ],
  },
};

// Main function executed on each iteration
export default function () {
  // Request a random page between 1 and 20
  const page = 1 + Math.floor(Math.random() * 20);

  // Send GET request for the paginated auction list
  const res = http.get(
    `${BASE_URL}/auctions?page=${page}&limit=12`,
    {
      tags: {
        endpoint: "auction-list-only",
      },
    }
  );

  // Verify that the response code is 200 OK
  check(res, {
    "auction list is 200": (r) => r.status === 200,
  });
}