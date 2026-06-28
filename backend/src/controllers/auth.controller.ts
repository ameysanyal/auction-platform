import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { appLogger } from '../config/logger.js';

import User from "../models/user.model.js";
import {
  generateToken,
  generateRefreshToken,
} from "../utils/generate-token.util.js";

import jwt from "jsonwebtoken";


export const register = async (req: Request, res: Response) => {

  appLogger.info(`reached register route`);
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return res.status(201).json({
    user,
    token: generateToken(user),
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  // 1. Generate access token
  const token = generateToken(user);

  // 2. Generate refresh token using the stringified user ID
  const refreshToken = generateRefreshToken(user._id.toString());

  // 3. Persist the refresh token to the user document in MongoDB
  user.refreshToken = refreshToken;
  await user.save();

  // 4. Return the access token and refresh token in the response payload
  return res.json({
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
export const me = async (req: Request, res: Response) => {
  return res.json(req.user);
};

export const logout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


export const adminSignUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password} = req.body;

    // 1. Basic Validation
    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: "All fields, including adminSecret, are required." });
      return;
    }


    // 3. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists." });
      return;
    }

    // 4. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Create the Admin User
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN", // Explicitly setting role to ADMIN
      avatar: "",
      refreshToken: "",
    });

    // 6. Save to Database
    await adminUser.save();

    // 7. Optional: Generate a JWT Token right away so they are logged in
    const token = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );

    // 8. Respond (Do not send the password back!)
    res.status(201).json({
      message: "🚀 Admin account created successfully!",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

