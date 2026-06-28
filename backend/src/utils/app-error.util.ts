class AppError extends Error {
  // 1. Explicitly type and declare the custom property
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    // 2. Call the parent Error constructor
    super(message);

    this.statusCode = statusCode;

    // 3. Capture the clean stack trace, excluding the constructor itself
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;