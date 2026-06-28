import type { Request, Response } from "express";

import bidService from "../services/bid.service.js";

export const placeBid = async (
  req: Request<{ auctionId: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const bid = await bidService.placeBid({
    auctionId: req.params.auctionId,

    bidderId: req.user._id.toString(),

    amount: Number(req.body.amount),
  });

  return res.status(201).json(bid);
};
