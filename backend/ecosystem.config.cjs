/**
 * PM2 Ecosystem Configuration
 *
 * Three distinct process roles:
 *
 * ┌──────────────────────┬───────────────────┬────────────────────────────┐
 * │ auction-api          │ HTTP + Socket.IO  │ 2 instances (behind Nginx) │
 * │ auction-worker       │ BullMQ consumer   │ 1 instance (scale if slow) │
 * │ auction-scheduler    │ Fallback cron     │ ⚠️  ALWAYS exactly 1       │
 * └──────────────────────┴───────────────────┴────────────────────────────┘
 *
 * Quick reference:
 *   pm2 start ecosystem.config.cjs          # start all three roles
 *   pm2 reload auction-api                  # zero-downtime reload (API only)
 *   pm2 scale auction-api 4                 # scale API to 4 instances
 *   pm2 scale auction-worker 2              # scale workers independently
 *   pm2 logs auction-worker                 # tail worker logs
 *   pm2 save && pm2 startup                 # persist across reboots
 */

const BASE_DIR = "/var/www/auction-platform/backend";

module.exports = {
  apps: [
    // ── Role 1: API Instances ─────────────────────────────────────────────
    // HTTP server + Socket.IO. Sits behind Nginx on ports 5051 / 5052.
    // Nginx upstream block load-balances across both.
    // Scale: increase `instances` (or `pm2 scale auction-api N`) based on CPU.
    {
      name: "auction-api-1",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/server.js`,
      exec_mode: "fork",
      instances: 1,
      kill_timeout: 12000,   // ms to wait for graceful shutdown before SIGKILL
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "5051",
        ENABLE_FALLBACK_CRON: "false",  // Scheduler role owns the cron — never here
      },
    },
    {
      name: "auction-api-2",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/server.js`,
      exec_mode: "fork",
      instances: 1,
      kill_timeout: 12000,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "5052",
        ENABLE_FALLBACK_CRON: "false",
      },
    },

    // ── Role 2: BullMQ Worker ─────────────────────────────────────────────
    // Consumes "close-auction" jobs. No HTTP port opened.
    // Scale: increase instances if auction-queue lag grows.
    //        Each instance is a separate OS process, BullMQ coordinates them.
    {
      name: "auction-worker",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/worker.js`,
      exec_mode: "fork",
      instances: 1,
      kill_timeout: 20000,   // Extra time for the in-flight job to finish
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },

    // ── Role 3: Fallback Scheduler ────────────────────────────────────────
    // 15-minute safety scan for auctions BullMQ missed.
    // ⚠️  Must remain ONE process. Increase = duplicate processing.
    {
      name: "auction-scheduler",
      cwd: BASE_DIR,
      script: `${BASE_DIR}/dist/scheduler.js`,
      exec_mode: "fork",
      instances: 1,          // ⚠️ NEVER scale above 1
      kill_timeout: 10000,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};