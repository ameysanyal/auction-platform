// ============================================================================
// Load Test Script 03: Authenticated User Requests
// Purpose: Simulates actions performed by logged-in users.
// Tests two key authenticated endpoints:
// 1. GET /auth/me - Verifies user token authentication and session profile loading.
// 2. POST /auctions/:id/check-eligibility - Checks if the user is allowed to bid on an item.
// ============================================================================

import http from "k6/http";
import { check } from "k6";
import {
  BASE_URL,
  userForVU,
  auctionForAuthenticatedVU,
  jsonHeaders,
} from "./lib.js";

// Target requests per second (default: 100 RPS)
const target = Number(__ENV.TARGET_RPS || 100);

// Total test duration (default: 1 minute)
const duration = __ENV.DURATION || "1m";

// k6 scenario settings
export const options = {
  scenarios: {
    authenticated_reads: {
      // Keeps a steady request rate
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,

      // Initial virtual user count
      preAllocatedVUs: Number(
        __ENV.PRE_VUS || Math.max(50, Math.ceil(target / 5))
      ),

      // Max virtual users allowed if requests take longer than expected
      maxVUs: Number(
        __ENV.MAX_VUS || Math.max(200, target * 2)
      ),
    },
  },

  // Performance thresholds
  thresholds: {
    // Less than 1% failure rate allowed
    http_req_failed: ["rate<0.01"],

    // 95% of responses under 500ms, 99% under 1000ms
    http_req_duration: [
      "p(95)<500",
      "p(99)<1000",
    ],
  },
};

// Main function run by each virtual user
export default function () {
  // Grab a unique pre-seeded user and set up authorization headers with their JWT token
  const user = userForVU();
  const headers = jsonHeaders(user.token);

  // --------------------------------------------------------------------------
  // Step 1: Verify authentication with GET /auth/me
  // --------------------------------------------------------------------------
  const me = http.get(
    `${BASE_URL}/auth/me`,
    {
      headers,
      tags: {
        endpoint: "auth-me", // Tag for grouping metrics
      },
    }
  );

  // Check that the profile call succeeded
  check(me, {
    "auth/me is 200": r => r.status === 200,
  });

  // --------------------------------------------------------------------------
  // Step 2: Check bidding eligibility with POST /auctions/:id/check-eligibility
  // --------------------------------------------------------------------------
  // Pick an auction where this user is NOT the seller
  const auction = auctionForAuthenticatedVU();

  const eligibility = http.post(
    `${BASE_URL}/auctions/${auction.id}/check-eligibility`,
    JSON.stringify({}),
    {
      headers,
      tags: {
        endpoint: "bid-eligibility", // Tag for eligibility metrics
      },
    }
  );

  // Check that the eligibility check succeeded
  check(eligibility, {
    "eligibility is 200": r => r.status === 200,
  });
}