/**
 * PM2 Ecosystem Configuration — All-Core Cluster Mode
 *
 * ┌──────────────────────┬───────────────────┬────────────────────────────────────┐
 * │ auction-api          │ HTTP + Socket.IO  │ 1 instance per CPU core (cluster)  │
 * │ auction-worker       │ BullMQ consumer   │ 1 instance (scale if queue lags)   │
 * │ auction-scheduler    │ Fallback cron     │ ⚠️  ALWAYS exactly 1 instance      │
 * └──────────────────────┴───────────────────┴────────────────────────────────────┘
 *
 * Cluster mode: PM2 spawns one worker per CPU core, all sharing port 5050.
 * The OS kernel distributes incoming connections across workers (SO_REUSEPORT).
 * The Socket.IO Redis adapter ensures cross-worker event delivery.
 *
 * Quick reference:
 *   pm2 start ecosystem.config.cjs          # start everything
 *   pm2 reload auction-api                  # zero-downtime rolling reload (all cores)
 *   pm2 scale auction-api +2                # add 2 more workers at runtime
 *   pm2 scale auction-api max               # set workers = number of CPU cores
 *   pm2 logs auction-api                    # tail logs across all workers
 *   pm2 monit                               # live CPU/memory per process
 *   pm2 save && pm2 startup                 # persist across reboots
 */

const BASE_DIR = "/var/www/auction-platform/backend";

module.exports = {
  apps: [
    // ── Role 1: API Cluster (all CPU cores) ──────────────────────────────────
    // instances: "max" → PM2 detects CPU count and spawns exactly that many workers.
    // All workers share port 5050. Nginx only needs one upstream entry.
    // Redis adapter ensures Socket.IO events cross worker boundaries.
    {
      name: "auction-api",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/server.js`,
      exec_mode: "cluster",        // ← cluster mode: shared port, all cores used
      instances: "max",            // ← "max" = one worker per logical CPU core
      kill_timeout: 12000,
      wait_ready: false,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "5050",              // ← single port shared across all workers
        ENABLE_FALLBACK_CRON: "false",
      },
    },

    // ── Role 2: BullMQ Worker ────────────────────────────────────────────────
    // Runs in fork mode (not cluster) — each worker is an independent consumer.
    // Increase instances if the auction-queue depth grows.
    {
      name: "auction-worker",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/worker.js`,
      exec_mode: "fork",
      instances: 1,
      kill_timeout: 20000,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },

    // ── Role 3: Fallback Scheduler ───────────────────────────────────────────
    // ⚠️  Must remain exactly ONE process across the entire deployment.
    {
      name: "auction-scheduler",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/scheduler.js`,
      exec_mode: "fork",
      instances: 1,               // ⚠️ NEVER increase above 1
      kill_timeout: 10000,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};