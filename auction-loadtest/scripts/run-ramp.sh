#!/usr/bin/env bash
# ============================================================================
# Ramp-Up Load Test Runner
# Purpose: Automatically tests the auction reading endpoint across escalating
# traffic levels (100 -> 500 -> 1,000 -> 2,000 -> 5,000 requests/sec) to find
# the breaking point and maximum capacity of the system.
# ============================================================================

# Exit immediately if any command fails or if an unset variable is accessed
set -euo pipefail

# Make sure BASE_URL is defined before starting
BASE_URL="${BASE_URL:?Set BASE_URL first}"

# Loop through increasing request rates
for rate in 100 500 1000 2000 5000; do
  echo "============================================================"
  echo "Auction read test: ${rate} requests/sec"
  echo "============================================================"

  # Run the k6 auction test for 1 minute at the current rate
  TARGET_RPS="$rate" DURATION="1m" k6 run scripts/02-auctions.js

  # Pause for 15 seconds between runs to let the server and database cool down
  sleep 15
done
