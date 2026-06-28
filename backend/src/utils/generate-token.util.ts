import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// 1. Define an interface for the user payload minimal requirement
export interface TokenUserPayload {
  _id: string | mongoose.Types.ObjectId;
  email: string;
  role: string;
}

// 2. Define the token generation function with strict types
export const generateToken = (user: TokenUserPayload): string => {
  // Ensure JWT_SECRET is present at runtime
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
  }

  return jwt.sign(
    {
      _id: user._id.toString(), // Convert ObjectId to string for the payload consistency
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const generateRefreshToken = (
  userId: string
) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined in the environment variables");
  }
  return jwt.sign(
    { _id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );
};