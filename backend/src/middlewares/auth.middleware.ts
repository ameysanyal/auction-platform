import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { IUser } from "../models/user.model.js";

// Augment Express's global Request type so req.user is available everywhere
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// 2. Define the middleware function with explicit types
const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    // Ensure JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;

    // Attach the decoded payload to the request object — cast to IUser shape
    req.user = decoded as unknown as IUser;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default authMiddleware;