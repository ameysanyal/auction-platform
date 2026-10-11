// ============================================================================
// Load Test Script 02: Auction Browsing (List & Detail)
// Purpose: Simulates public visitor traffic.
// Users fetch a paginated list of auctions, and about 35% of the time, they
// click on an auction to view its full details.
// ============================================================================

import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

// Target requests per second (default: 100 RPS)
const target = Number(__ENV.TARGET_RPS || 100);

// Total test duration (default: 1 minute)
const duration = __ENV.DURATION || "1m";

// k6 test execution options
export const options = {
  scenarios: {
    auction_reads: {
      // "constant-arrival-rate" ensures a steady number of requests are sent per second,
      // even if the server starts responding slower.
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,

      // Initial number of virtual users ready to send requests
      preAllocatedVUs: Number(
        __ENV.PRE_VUS || Math.max(50, Math.ceil(target / 5))
      ),

      // Maximum number of virtual users k6 can spawn if requests take longer
      maxVUs: Number(
        __ENV.MAX_VUS || Math.max(200, target * 2)
      ),
    },
  },

  // Performance thresholds to consider the test successful
  thresholds: {
    // Less than 1% failure rate
    http_req_failed: ["rate<0.01"],

    // 95% of requests must finish within 500ms, and 99% within 1000ms
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

// Main function executed on each iteration
export default function () {
  // Pick a random page number between 1 and 20 to test pagination cache and database indexes
  const page = 1 + Math.floor(Math.random() * 20);

  // Step 1: Request a page of auctions (12 items per page)
  const list = http.get(
    `${BASE_URL}/auctions?page=${page}&limit=12`,
    {
      tags: {
        endpoint: "auction-list", // Tag used for grouping metrics in k6 reports
      },
    }
  );

  // Check that the listing request succeeded (HTTP 200)
  check(list, {
    "auction list is 200": (r) => r.status === 200,
  });

  // Step 2: About 35% of the time, simulate a user clicking to view auction details
  if (Math.random() < 0.35) {
    const auction = auctionFromList(list);

    // If no auction ID could be extracted, skip detail view
    if (!auction?._id) {
      return;
    }

    // Fetch details for the selected auction
    const detail = http.get(
      `${BASE_URL}/auctions/${auction._id}`,
      {
        tags: {
          endpoint: "auction-detail", // Tag for detail endpoint metrics
        },
      }
    );

    // Check that the auction detail request succeeded (HTTP 200)
    check(detail, {
      "auction detail is 200": (r) => r.status === 200,
    });
  }
}

// Helper function to extract a random auction object from the API list response
function auctionFromList(res) {
  try {
    const body = res.json();

    // Support different response formats (direct array, or wrapped inside data/auctions/items/results)
    const auctions =
      Array.isArray(body)
        ? body
        : body?.data ||
          body?.auctions ||
          body?.items ||
          body?.results;

    if (!Array.isArray(auctions) || auctions.length === 0) {
      return null;
    }

    // Return a random auction from the page results
    return auctions[
      Math.floor(Math.random() * auctions.length)
    ];
  } catch {
    // Return null if JSON parsing fails
    return null;
  }
}
