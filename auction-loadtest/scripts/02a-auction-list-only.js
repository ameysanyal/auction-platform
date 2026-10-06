import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

const target = Number(__ENV.TARGET_RPS || 100);
const duration = __ENV.DURATION || "1m";

export const options = {
  scenarios: {
    auction_list: {
      executor: "constant-arrival-rate",
      rate: target,
      timeUnit: "1s",
      duration,

      preAllocatedVUs: Number(
        __ENV.PRE_VUS || Math.max(50, Math.ceil(target / 5))
      ),

      maxVUs: Number(
        __ENV.MAX_VUS || Math.max(200, target * 2)
      ),
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: [
      "p(95)<500",
      "p(99)<1000",
    ],
  },
};

export default function () {
  const page = 1 + Math.floor(Math.random() * 20);

  const res = http.get(
    `${BASE_URL}/auctions?page=${page}&limit=12`,
    {
      tags: {
        endpoint: "auction-list-only",
      },
    }
  );

  check(res, {
    "auction list is 200": (r) => r.status === 200,
  });
}