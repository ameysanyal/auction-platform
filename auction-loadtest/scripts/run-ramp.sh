#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:?Set BASE_URL first}"

for rate in 100 500 1000 2000 5000; do
  echo "============================================================"
  echo "Auction read test: ${rate} requests/sec"
  echo "============================================================"
  TARGET_RPS="$rate" DURATION="1m" k6 run scripts/02-auctions.js
  sleep 15
done
