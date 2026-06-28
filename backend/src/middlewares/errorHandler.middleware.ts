import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// 1. Optional but recommended: Create an interface or class for custom operational errors
export interface CustomError extends Error {
  statusCode?: number;
}

// 2. Define the global error handler middleware
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // Express identifies error middleware specifically by having 4 arguments.
  // Do not omit the 'next' parameter even if it's unused.
  next: NextFunction
): void => {
  console.error("Error caught by global handler:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.issues.map((e: any) => ({
        path: (e.path as any[]).join("."),
        message: e.message as string,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;