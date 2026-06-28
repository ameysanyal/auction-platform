import {
  Router,
} from "express";

import auth from "../middlewares/auth.middleware.js";

import {
  placeBid,
} from "../controllers/bid.controller.js";

const router = Router();

router.post(
  "/:auctionId",
  auth,
  placeBid
);

export default router;