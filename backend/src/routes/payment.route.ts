import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

import { createCheckoutSession, confirmPayment } from "../controllers/payment.controller.js";

import { stripeWebhook } from "../controllers/stripe.webhook.js";

const router = Router();

router.post("/checkout/:orderId", auth, createCheckoutSession);

router.post("/webhook", stripeWebhook);

router.post("/confirm/:sessionId", auth, confirmPayment);

export default router;
