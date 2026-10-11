// ============================================================================
// Load Test Script 01: Server Health Check
// Purpose: Pings the server's root ("/") endpoint to verify that the server is
// alive, healthy, and responds quickly under load.
// ============================================================================

import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./config.js";

//__ENV is specifically used in k6 load-testing scripts

// Test configuration settings for k6
export const options = {
  // Number of concurrent virtual users (VUs), default is 10
  vus: Number(__ENV.VUS || 10),

  // How long the test should run, default is 30 seconds
  duration: __ENV.DURATION || "30s",

  // Success criteria (thresholds): the test passes only if these conditions are met
  thresholds: {
    // Less than 1% of requests are allowed to fail
    http_req_failed: ["rate<0.01"],

    // 95% of requests must respond in under 500ms, and 99% under 1000ms
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

// Main function that runs continuously for each virtual user during the test
export default function () {
  // Send a GET request to the server root URL
  const res = http.get(`${BASE_URL}/`);

  // Verify that the response status code is 200 OK
  check(res, { "health is 200": r => r.status === 200 });
}
