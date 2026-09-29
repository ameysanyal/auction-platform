import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import auctionRoutes from "./routes/auction.route.js";
import bidRoutes from "./routes/bid.route.js";

import paymentRoutes from "./routes/payment.route.js";
import orderRoutes from "./routes/order.route.js";
import notificationRoutes from "./routes/notification.route.js";
import uploadRoutes from "./routes/upload.route.js";
import adminRoutes from "./routes/admin.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";

import auth from "./middlewares/auth.middleware.js";
import admin from "./middlewares/admin.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import morgan from "morgan";

import cookieParser from "cookie-parser";

const app: Application = express();

// 1. Choose format based on environment
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

// 2. Mount the middleware
app.use(morgan(morganFormat));

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(helmet());

// Note = Stripe webhooks break if json parser runs first.
app.use(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
);

app.use(express.json());

// Base Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "auction-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);
app.use("/payments", paymentRoutes);
app.use("/orders", orderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/notification", notificationRoutes);
app.use("/uploads", uploadRoutes);
app.use("/admin", auth, admin, adminRoutes);
app.use("/", dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
