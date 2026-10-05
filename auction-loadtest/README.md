# Auction Platform Load Test Suite

This suite targets the single-instance Auction Platform backend.

## Scope

- k6 HTTP tests for health, public auction reads, authenticated reads, mixed traffic, and bidding.
- MongoDB seed/reset utility that creates dedicated load-test users and auctions.
- Node.js Socket.IO connection/event load test using the same `socket.io-client` protocol as the frontend.
- No Redis Socket.IO adapter is required.
- Stripe is deliberately not exercised by the load tests.

## Important

Run this only against a dedicated staging/load-test database and Redis instance. Do not use production payment or production data.

The backend's bid path requires users to be ACTIVE, email-verified, and `hasPaymentProfile=true`. The seed utility sets these fields directly; it does not call Stripe.

## Prerequisites

1. Backend deployed and reachable over HTTP(S).
2. MongoDB deployment that supports the transactions used by the bid service (Atlas or a replica set).
3. Redis reachable by the backend.
4. k6 installed for HTTP tests.
5. Node.js 20+ recommended for the Socket.IO runner and seed utility.
6. A dedicated MongoDB database and Redis database/namespace for load testing.

## Install

```bash
cd loadtest
npm install
```

Copy the environment file:

```bash
cp .env.example .env
```

Fill in `MONGO_URI`, `JWT_SECRET`, and `BASE_URL`.

`BASE_URL` should point at the API root used by the frontend. For example, if the public backend URL is `https://api.example.com/api`, use that exact value. The suite does not assume `/api` is present.

## Seed

Generate 1000 users and 200 auctions:

```bash
npm run seed
```

You can override counts:

```bash
USERS=5000 AUCTIONS=1000 npm run seed
```

The seed writes `data/users.json`, `data/auctions.json`, and `data/seed-manifest.json`.

Default generated users have:

- `role=USER`
- `isEmailVerified=true`
- `status=ACTIVE`
- `hasPaymentProfile=true`

No real Stripe customer/payment method is created.

## Smoke test

```bash
BASE_URL=https://api.example.com/api k6 run scripts/01-health.js
```

## HTTP tests

```bash
npm run k6:auctions
npm run k6:auth
npm run k6:bid
npm run k6:mixed
```

Or directly:

```bash
k6 run scripts/02-auctions.js
k6 run scripts/03-authenticated.js
k6 run scripts/04-bidding.js
k6 run scripts/05-mixed.js
```

Environment variables supported by the k6 scripts:

- `BASE_URL`
- `USERS_FILE` (default `./data/users.json`)
- `AUCTIONS_FILE` (default `./data/auctions.json`)
- `SCENARIO` for `04-bidding.js`: `distributed` or `hot`
- `TARGET_RPS` for the constant-arrival-rate tests
- `DURATION`
- `BID_RATE`

Examples:

```bash
BASE_URL=https://api.example.com/api TARGET_RPS=1000 DURATION=2m k6 run scripts/02-auctions.js
SCENARIO=hot BID_RATE=100 DURATION=2m k6 run scripts/04-bidding.js
```

## Socket.IO test

Install dependencies first:

```bash
npm install
```

Then:

```bash
BASE_URL=https://api.example.com SOCKET_URL=https://api.example.com USERS_FILE=./data/users.json AUCTION_ID=<auction-id> CLIENTS=1000 DURATION=2m npm run socket
```

The Socket.IO server in this project is mounted on the same HTTP server as Express. If your public proxy exposes Socket.IO on the same origin, `SOCKET_URL` is the origin only (do not append `/api`).

The runner authenticates with JWT using `socket.handshake.auth.token`, joins the selected auction room, and records connections, connection errors, and `new-bid` events.

## Recommended progression

1. 10 VUs health smoke test.
2. 100 -> 500 -> 1K -> 2K -> 5K RPS auction reads.
3. Authenticated `/auth/me` test.
4. Distributed bidding: 10 -> 50 -> 100 -> 500 -> 1K bid attempts/sec.
5. Hot-auction bidding: same progression against one auction.
6. Socket.IO: 100 -> 1K -> 5K -> 10K connections.
7. Mixed HTTP + bid workload.
8. Only after the single-instance capacity is known, move to distributed load generators.

## Interpreting bidding results

For the hot-auction test, many requests may intentionally fail with `Another bid is processing`, `Bid must be higher than current bid`, or other business outcomes. These are not automatically infrastructure failures.

The suite separates:

- HTTP transport failures / unexpected status codes.
- Expected business rejections.
- Successful bids.
- Bid latency.

For a correctness run, inspect the final auction's `currentBid` and count of bids in MongoDB after the test.

## Do not benchmark login at high RPS

The login endpoint performs bcrypt verification and refresh-token persistence. It is useful as a separate authentication benchmark, but it should not be part of the normal auction traffic test because it measures password hashing/database writes rather than auction throughput.

## BullMQ / auction-expiry test

The backend schedules BullMQ jobs only when an auction is created through `POST /auctions`. Therefore the included `06-bullmq-fixture.mjs` is only a database fixture and intentionally does **not** claim to enqueue jobs.

For a true BullMQ throughput test, create dedicated auctions through the authenticated API with short future `endTime` values, then observe the worker. Do this at a controlled rate because each auction can trigger database writes/notifications and, depending on winner/payment state, payment logic.
