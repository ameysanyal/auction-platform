export default {
  apps: [
    {
      name: "auction-api-1",
      cwd: "/var/www/auction-platform/backend",
      script: "/var/www/auction-platform/backend/dist/server.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "5051",
        ENABLE_FALLBACK_CRON: "true",
      },
      time: true,
    },
    {
      name: "auction-api-2",
      cwd: "/var/www/auction-platform/backend",
      script: "/var/www/auction-platform/backend/dist/server.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "5052",
        ENABLE_FALLBACK_CRON: "false",
      },
      time: true,
    },
  ],
};
// The explicit PM2 environment variables override matching values loaded by dotenv. 
// Ensure your code actually honors ENABLE_FALLBACK_CRON before using this configuration.