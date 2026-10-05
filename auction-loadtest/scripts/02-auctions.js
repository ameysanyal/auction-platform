import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

const target = Number(__ENV.TARGET_RPS || 100);
const duration = __ENV.DURATION || "1m";

export const options = {
  scenarios: {
    auction_reads: {
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
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const page = 1 + Math.floor(Math.random() * 20);

  const list = http.get(
    `${BASE_URL}/auctions?page=${page}&limit=12`,
    {
      tags: {
        endpoint: "auction-list",
      },
    }
  );

  check(list, {
    "auction list is 200": (r) => r.status === 200,
  });

  if (Math.random() < 0.35) {
    const auction = auctionFromList(list);

    if (!auction?._id) {
      return;
    }

    const detail = http.get(
      `${BASE_URL}/auctions/${auction._id}`,
      {
        tags: {
          endpoint: "auction-detail",
        },
      }
    );

    check(detail, {
      "auction detail is 200": (r) => r.status === 200,
    });
  }
}

function auctionFromList(res) {
  try {
    const body = res.json();

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

    return auctions[
      Math.floor(Math.random() * auctions.length)
    ];
  } catch {
    return null;
  }
}
