import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { "health is 200": r => r.status === 200 });
}
