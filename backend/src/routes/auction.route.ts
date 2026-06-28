import {
  Router,
} from "express";

import auth from "../middlewares/auth.middleware.js";

import {
  createAuction,
  getAuctions,
  getAuctionById,
} from "../controllers/auction.controller.js";

const router = Router();

router.get(
  "/",
  getAuctions
);

router.get(
  "/:id",
  getAuctionById
);

router.post(
  "/",
  auth,
  createAuction
);

export default router;