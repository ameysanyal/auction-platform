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
import morgan from 'morgan';

const app: Application = express();

// 1. Choose format based on environment
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// 2. Mount the middleware
app.use(morgan(morganFormat));

// Middleware
app.use(cors());
app.use(helmet());

// Note = Stripe webhooks break if json parser runs first.
app.use(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  })
);

app.use(express.json());

// Base Route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Auction API Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", auth, admin, adminRoutes);
app.use("/api", dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
