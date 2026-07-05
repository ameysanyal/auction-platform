import type { Request, Response } from "express";

import auctionService from "../services/auction.service.js";
import User from "../models/user.model.js";

export const createAuction = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  console.log(req.user)

  const auction =
    await auctionService.createAuction({
      ...req.body,
      seller: req.user._id,
    });

  return res.status(201).json(
    auction
  );
};

export const getAuctions = async (
  req: Request,
  res: Response
) => {
  const page =
    Number(req.query.page) || 1;

  const limit =
    Number(req.query.limit) || 10;

  const result =
    await auctionService.getActiveAuctions(
      page,
      limit
    );

  return res.status(200).json(
    result
  );
};

export const getAuctionById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const auction = await auctionService.getAuctionById(req.params.id);

  return res.json(auction);
};

export const checkBidEligibility = async (
  req: Request<{ id: string }, any, { amount?: number }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Please login to bid.",
    });
  }

  const user = await User.findById(req.user._id).exec();
  if (!user) {
    return res.status(404).json({
      success: false,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    });
  }

  // 1. Check email verification
  if (user.isEmailVerified === false) {
    return res.status(400).json({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address before bidding.",
    });
  }

  // 2. Check account active
  if (user.status !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      code: "ACCOUNT_INACTIVE",
      message: "Your account is not active.",
    });
  }

  // 3. Find Auction
  const auction = await auctionService.getAuctionById(req.params.id);
  if (!auction) {
    return res.status(404).json({
      success: false,
      code: "AUCTION_NOT_FOUND",
      message: "Auction not found.",
    });
  }

  // 4. Check status is active
  if (auction.status !== "active") {
    return res.status(400).json({
      success: false,
      code: "AUCTION_NOT_ACTIVE",
      message: `Bidding is closed. Auction status is "${auction.status}".`,
    });
  }

  // 5. Check auction has not ended
  if (new Date() > new Date(auction.endTime)) {
    return res.status(400).json({
      success: false,
      code: "AUCTION_ENDED",
      message: "This auction has ended.",
    });
  }

  // 6. Check user is not the seller
  const sellerId = (auction.seller._id || auction.seller).toString();
  if (sellerId === user._id.toString()) {
    return res.status(400).json({
      success: false,
      code: "SELLER_CANNOT_BID",
      message: "You cannot bid on your own auction.",
    });
  }

  // 7. Validate bid amount if provided
  if (req.body.amount !== undefined) {
    const amount = Number(req.body.amount);
    const minBid = auction.currentBid || auction.startingPrice;
    if (isNaN(amount) || amount <= minBid) {
      return res.status(400).json({
        success: false,
        code: "BID_TOO_LOW",
        message: `Bid must be higher than current bid of $${minBid}.`,
      });
    }
  }

  // 8. Check if payment profile exists
  if (!user.hasPaymentProfile) {
    return res.status(400).json({
      success: false,
      code: "PAYMENT_PROFILE_REQUIRED",
      message: "Please add a payment method before placing bids.",
    });
  }

  return res.json({
    success: true,
    canBid: true,
  });
};


/*
The Request type from Express accepts generics in this exact order:

ParamsDictionary (URL params)

ResBody (Response body)

ReqBody (Request body)

ReqQuery (Query string params)
*/
