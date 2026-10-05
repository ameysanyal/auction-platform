import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, users, auctions, jsonHeaders, randomAuction } from "./lib.js";

http.setResponseCallback(http.expectedStatuses(200, 201, 400, 409));

const target = Number(__ENV.TARGET_RPS || 200);
const duration = __ENV.DURATION || "2m";

export const options = {
  scenarios: {
    mixed: {
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.max(100, Math.ceil(target / 5))),
      maxVUs: Number(__ENV.MAX_VUS || Math.max(500, target * 3)),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
  },
};

export default function () {
  const bidderPoolSize = Math.max(1, users.length - 10);
  const user = users[10 + ((__ITER + __VU * 17) % bidderPoolSize)];
  const headers = jsonHeaders(user.token);
  const roll = Math.random();

  if (roll < 0.60) {
    const res = http.get(`${BASE_URL}/auctions?page=${1 + Math.floor(Math.random() * 10)}&limit=12`, { tags: { endpoint: "auction-list" } });
    check(res, { "list ok": r => r.status === 200 });
  } else if (roll < 0.80) {
    const auction = randomAuction();
    const res = http.get(`${BASE_URL}/auctions/${auction.id}`, { tags: { endpoint: "auction-detail" } });
    check(res, { "detail ok": r => r.status === 200 });
  } else if (roll < 0.90) {
    const res = http.get(`${BASE_URL}/auth/me`, { headers, tags: { endpoint: "auth-me" } });
    check(res, { "me ok": r => r.status === 200 });
  } else {
    const auction = auctions[(__ITER + __VU) % auctions.length];
    const amount = 101 + (__VU * 1000000) + __ITER;
    const res = http.post(`${BASE_URL}/bids/${auction.id}`, JSON.stringify({ amount }), { headers, tags: { endpoint: "place-bid" } });
    check(res, { "bid success or business rejection": r => r.status === 201 || r.status === 400 || r.status === 409 });
  }

  sleep(0.05);
}
