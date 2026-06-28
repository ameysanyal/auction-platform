import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get(
  "/",
  auth,
  getNotifications
);

router.patch(
  "/read-all",
  auth,
  markAllAsRead
);

router.patch(
  "/:id/read",
  auth,
  markAsRead
);

export default router;