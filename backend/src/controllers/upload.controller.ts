import type { Request, Response } from "express";

import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "No image uploaded",
    });
  }

  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "auction-items",
  });

  return res.json({
    url: result.secure_url,
  });
};
