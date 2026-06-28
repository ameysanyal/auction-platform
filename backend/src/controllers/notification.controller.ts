import type { Request, Response } from "express";

import Notification from "../models/notification.model.js";

export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 20;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find({
    user: req.user._id,
  })
    .skip(skip)
    .limit(limit)
    .sort({
      createdAt: -1,
    });
  return res.json(notifications);
};


export const markAsRead = async (req: Request, res: Response) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      isRead: true,
    },
    {
      new: true,
    },
  );

  return res.json(notification);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  return res.json({ success: true, message: "All notifications marked as read" });
};
