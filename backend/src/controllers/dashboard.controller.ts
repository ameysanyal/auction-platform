import type { Request, Response } from "express";
import User from "../models/user.model.js";
import AuctionItem from "../models/auction-item.model.js";
import Order from "../models/order.model.js";
import Bid from "../models/bid.model.js";
import { appLogger } from "../config/logger.js";

// GET /api/dashboard
export const getDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id;

    const myAuctions = await AuctionItem.countDocuments({ seller: userId });
    const activeAuctions = await AuctionItem.countDocuments({ seller: userId, status: "active" });
    const wonAuctions = await Order.countDocuments({ winner: userId });
    const orders = await Order.countDocuments({ winner: userId });

    const recentAuctions = await AuctionItem.find({ seller: userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentOrders = await Order.find({ winner: userId })
      .populate("auction")
      .sort({ createdAt: -1 })
      .limit(2);

    return res.json({
      stats: {
        myAuctions,
        activeAuctions,
        wonAuctions,
        orders,
      },
      recentAuctions,
      recentOrders,
    });
  } catch (error: any) {
    appLogger.error(`[DashboardController] getDashboard failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/auction/my
export const getMyAuctions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const auctions = await AuctionItem.find({ seller: req.user._id }).sort({ createdAt: -1 });
    return res.json(auctions);
  } catch (error: any) {
    appLogger.error(`[DashboardController] getMyAuctions failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/bid/my
export const getMyBids = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Find all bids placed by the user, populated with the auction details
    const bids = await Bid.find({ bidder: req.user._id })
      .populate("auction")
      .sort({ createdAt: -1 });

    // Filter out duplicates so the user sees their highest bid per auction (or simply return unique auctions, but the frontend maps bids directly)
    // The frontend maps `bid.auction.title` and `bid.amount`. So we can just return all bids.
    return res.json(bids);
  } catch (error: any) {
    appLogger.error(`[DashboardController] getMyBids failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/order/won
export const getWonAuctions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const orders = await Order.find({ winner: req.user._id })
      .populate("auction")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error: any) {
    appLogger.error(`[DashboardController] getWonAuctions failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/order/my
export const getOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const orders = await Order.find({ winner: req.user._id })
      .populate("auction")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error: any) {
    appLogger.error(`[DashboardController] getOrders failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};
