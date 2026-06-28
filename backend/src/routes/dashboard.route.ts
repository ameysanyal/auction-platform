import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getDashboard,
  getMyAuctions,
  getMyBids,
  getWonAuctions,
  getOrders,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard", auth, getDashboard);
router.get("/auction/my", auth, getMyAuctions);
router.get("/bid/my", auth, getMyBids);
router.get("/order/won", auth, getWonAuctions);
router.get("/order/my", auth, getOrders);

export default router;
