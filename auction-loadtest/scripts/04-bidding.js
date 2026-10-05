import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const bidSuccessRate = new Rate("bid_success_rate");
const bidLatency = new Trend("bid_latency", true);
import { BASE_URL, users, auctions, jsonHeaders } from "./lib.js";

http.setResponseCallback(http.expectedStatuses(201, 400, 409));

const rate = Number(__ENV.BID_RATE || 100);
const duration = __ENV.DURATION || "1m";
const scenario = (__ENV.SCENARIO || "distributed").toLowerCase();
const hotAuction = auctions[0];

export const options = {
  scenarios: {
    bids: {
      executor: "constant-arrival-rate",
      rate,
      timeUnit: "1s",
      duration,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.max(100, rate)),
      maxVUs: Number(__ENV.MAX_VUS || Math.max(500, rate * 5)),
    },
  },
  thresholds: {
    // Business rejections are handled in the script; transport/5xx failures are not.
    http_req_failed: ["rate<0.20"],
    bid_success_rate: ["rate>0.01"],
    bid_latency: ["p(95)<1500", "p(99)<3000"],
  },
};

export default function () {
  const bidderPoolSize = Math.max(1, users.length - 10);
  const user = users[10 + ((__ITER + __VU * 1009) % bidderPoolSize)];
  const auction = scenario === "hot" ? hotAuction : auctions[(__ITER + __VU) % auctions.length];

  // Make every attempt larger than the fixture starting price. Under contention,
  // some will still be rejected because another request has already advanced the bid.
  const amount = 101 + (__VU * 1000000) + __ITER;
  const started = Date.now();
  const res = http.post(
    `${BASE_URL}/bids/${auction.id}`,
    JSON.stringify({ amount }),
    {
      headers: jsonHeaders(user.token),
      tags: { endpoint: "place-bid", scenario },
    },
  );

  const businessRejection = [400, 409].includes(res.status);
  const ok = res.status === 201;
  check(res, {
    "bid succeeded or was a business rejection": r => ok || businessRejection,
  });

  bidSuccessRate.add(ok);
  bidLatency.add(Date.now() - started);
}
