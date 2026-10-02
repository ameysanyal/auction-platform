import {
  Router,
} from "express";

import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createAuctionSchema } from "../validators/auction.validator.js";

import {
  createAuction,
  getAuctions,
  getAuctionById,
  checkBidEligibility,
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
  validate(createAuctionSchema),
  createAuction
);

router.post(
  "/:id/check-eligibility",
  auth,
  checkBidEligibility
);

export default router;