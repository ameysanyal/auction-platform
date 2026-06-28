import type { Request, Response } from "express";

import Order from "../models/order.model.js";

export const getMyOrders = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const orders = await Order.find({
    winner: req.user._id,
  })
    .populate("auction")
    .sort({
      createdAt: -1,
    });

  return res.json(orders);
};
