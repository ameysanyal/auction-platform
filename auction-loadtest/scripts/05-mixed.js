// ============================================================================
// Load Test Script 05: Mixed Real-World Workload
// Purpose: Simulates a realistic mixture of user activities happening at the same time:
// - 60% Browsing auction listings (GET /auctions)
// - 20% Viewing auction details (GET /auctions/:id)
// - 10% Checking profile/account status (GET /auth/me)
// - 10% Submitting bids (POST /bids/:id)
// ============================================================================

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, users, auctions, jsonHeaders, randomAuction } from "./lib.js";

// Accept standard success and expected auction rejection response codes
http.setResponseCallback(http.expectedStatuses(200, 201, 400, 409));

// Total target requests per second (default: 200 RPS across all actions combined)
const target = Number(__ENV.TARGET_RPS || 200);

// Total test duration (default: 2 minutes)
const duration = __ENV.DURATION || "2m";

export const options = {
  scenarios: {
    mixed: {
      // Keeps a steady request rate throughout the test duration
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.max(100, Math.ceil(target / 5))),
      maxVUs: Number(__ENV.MAX_VUS || Math.max(500, target * 3)),
    },
  },
  thresholds: {
    // Under 10% failure rate overall
    http_req_failed: ["rate<0.10"],

    // 95% of all requests within 1 second, 99% within 2 seconds
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
  },
};

// Main function executed on each iteration
export default function () {
  // Select a user from the pool (skipping the first 10 seller accounts)
  const bidderPoolSize = Math.max(1, users.length - 10);
  const user = users[10 + ((__ITER + __VU * 17) % bidderPoolSize)];
  const headers = jsonHeaders(user.token);

  // Generate a random number from 0.0 to 1.0 to decide which action to simulate
  const roll = Math.random();

  if (roll < 0.60) {
    // ------------------------------------------------------------------------
    // Action 1 (60% probability): Browse auction list with pagination
    // ------------------------------------------------------------------------
    const res = http.get(`${BASE_URL}/auctions?page=${1 + Math.floor(Math.random() * 10)}&limit=12`, {
      tags: { endpoint: "auction-list" },
    });
    check(res, { "list ok": r => r.status === 200 });

  } else if (roll < 0.80) {
    // ------------------------------------------------------------------------
    // Action 2 (20% probability): View details of a specific auction
    // ------------------------------------------------------------------------
    const auction = randomAuction();
    const res = http.get(`${BASE_URL}/auctions/${auction.id}`, {
      tags: { endpoint: "auction-detail" },
    });
    check(res, { "detail ok": r => r.status === 200 });

  } else if (roll < 0.90) {
    // ------------------------------------------------------------------------
    // Action 3 (10% probability): Authenticated user checks their profile
    // ------------------------------------------------------------------------
    const res = http.get(`${BASE_URL}/auth/me`, {
      headers,
      tags: { endpoint: "auth-me" },
    });
    check(res, { "me ok": r => r.status === 200 });

  } else {
    // ------------------------------------------------------------------------
    // Action 4 (10% probability): Place a competitive bid
    // ------------------------------------------------------------------------
    const auction = auctions[(__ITER + __VU) % auctions.length];
    const amount = 101 + (__VU * 1000000) + __ITER;
    const res = http.post(`${BASE_URL}/bids/${auction.id}`, JSON.stringify({ amount }), {
      headers,
      tags: { endpoint: "place-bid" },
    });

    // Check that the bid either succeeded (201) or was a business rejection (400 or 409)
    check(res, {
      "bid success or business rejection": r => r.status === 201 || r.status === 400 || r.status === 409,
    });
  }

  // Brief pause (50ms) to simulate natural user pacing
  sleep(0.05);
}
