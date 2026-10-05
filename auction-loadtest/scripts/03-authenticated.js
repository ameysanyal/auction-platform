import http from "k6/http";
import { check } from "k6";
import { BASE_URL, userForVU, auctionForVU, jsonHeaders } from "./lib.js";

const target = Number(__ENV.TARGET_RPS || 100);
const duration = __ENV.DURATION || "1m";

export const options = {
  scenarios: {
    authenticated_reads: {
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.max(50, Math.ceil(target / 5))),
      maxVUs: Number(__ENV.MAX_VUS || Math.max(200, target * 2)),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const user = userForVU();
  const headers = jsonHeaders(user.token);
  const me = http.get(`${BASE_URL}/auth/me`, { headers, tags: { endpoint: "auth-me" } });
  check(me, { "me is 200": r => r.status === 200 });

  const auction = auctionForVU();
  const eligibility = http.post(
    `${BASE_URL}/auctions/${auction.id}/check-eligibility`,
    JSON.stringify({}),
    { headers, tags: { endpoint: "bid-eligibility" } },
  );
  check(eligibility, { "eligibility is expected": r => [200, 400].includes(r.status) });
}
