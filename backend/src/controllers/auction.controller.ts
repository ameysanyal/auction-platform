import type { Request, Response } from "express";

import auctionService from "../services/auction.service.js";

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

/*
The Request type from Express accepts generics in this exact order:

ParamsDictionary (URL params)

ResBody (Response body)

ReqBody (Request body)

ReqQuery (Query string params)
*/
