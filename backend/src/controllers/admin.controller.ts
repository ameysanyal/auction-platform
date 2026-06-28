import type { Request, Response } from "express";
import User from "../models/user.model.js";
import AuctionItem from "../models/auction-item.model.js";
import Order from "../models/order.model.js";
import { appLogger } from "../config/logger.js";


// GET /api/admin/dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await AuctionItem.countDocuments();
    const activeAuctions = await AuctionItem.countDocuments({
      status: "active",
    });
    const soldAuctions = await AuctionItem.countDocuments({
      status: "completed",
    });
    const expiredAuctions = await AuctionItem.countDocuments({
      status: "expired_no_bids",
    });
    const totalOrders = await Order.countDocuments();

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentAuctions = await AuctionItem.find()
      .sort({ createdAt: -1 })
      .limit(5);
    const recentOrders = await Order.find()
      .populate("winner", "name")
      .populate("auction", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      stats: {
        totalUsers,
        totalAuctions,
        activeAuctions,
        soldAuctions,
        expiredAuctions,
        totalOrders,
        totalRevenue,
      },
      recentUsers,
      recentAuctions,
      recentOrders,
    });
  } catch (error: any) {
    appLogger.error(
      `[AdminController] getDashboardStats failed: ${error.message}`,
    );
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    // Map user to match frontend typing and add count details
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const auctionCount = await AuctionItem.countDocuments({
          seller: user._id,
        });
        const wonCount = await Order.countDocuments({
          winner: user._id,
          paymentStatus: "PAID",
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: true, // fallback property
          auctionCount,
          wonCount,
          createdAt: user.createdAt,
        };
      }),
    );

    return res.json({
      data: usersWithStats,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    appLogger.error(`[AdminController] getUsers failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/auctions
export const getAuctions = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const auctions = await AuctionItem.find()
      .populate("seller", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AuctionItem.countDocuments();

    return res.json({
      data: auctions,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    appLogger.error(`[AdminController] getAuctions failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate("winner", "name")
      .populate("auction", "title")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    return res.json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    appLogger.error(`[AdminController] getOrders failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:userId/role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (role !== "USER" && role !== "ADMIN") {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error: any) {
    appLogger.error(
      `[AdminController] updateUserRole failed: ${error.message}`,
    );
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/auctions/:auctionId/suspend
export const suspendAuction = async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.params;

    const auction = await AuctionItem.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    auction.status = "suspended" as any;
    await auction.save();

    return res.json(auction);
  } catch (error: any) {
    appLogger.error(
      `[AdminController] suspendAuction failed: ${error.message}`,
    );
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/auctions/:auctionId
export const deleteAuction = async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.params;

    const auction = await AuctionItem.findByIdAndDelete(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    return res.json({ message: "Auction deleted successfully", auction });
  } catch (error: any) {
    appLogger.error(`[AdminController] deleteAuction failed: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

