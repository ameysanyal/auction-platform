import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

import {
  getMyOrders,
} from "../controllers/order.controller.js";

const router = Router();

router.get(
  "/my-orders",
  auth,
  getMyOrders
);

router.get(
  "/",
  auth,
  getMyOrders
);

export default router;