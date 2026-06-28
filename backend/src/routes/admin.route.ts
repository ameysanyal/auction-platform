import { Router } from "express";
import {
  getDashboardStats,
  getUsers,
  getAuctions,
  getOrders,
  updateUserRole,
  suspendAuction,
  deleteAuction
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.get("/auctions", getAuctions);
router.get("/orders", getOrders);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/auctions/:auctionId/suspend", suspendAuction);
router.delete("/auctions/:auctionId", deleteAuction);


export default router;
