import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

import {
  createCheckoutSession,
  confirmPayment,
  createSetupIntent,
  savePaymentProfile,
} from "../controllers/payment.controller.js";

import { stripeWebhook } from "../controllers/stripe.webhook.js";

const router = Router();

router.post("/checkout/:orderId", auth, createCheckoutSession);

router.post("/webhook", stripeWebhook);

router.post("/confirm/:sessionId", auth, confirmPayment);

router.post("/setup-intent", auth, createSetupIntent);

router.post("/profile", auth, savePaymentProfile);

export default router;
