import winston from 'winston';

// Define custom log levels if needed (optional)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define custom colors for development (optional, requires 'winston/lib/winston/config')
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};
winston.addColors(colors); // Apply colors to Winston

// Define the format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // Conditionally add colorization for console in development
  winston.format.colorize({ all: process.env.NODE_ENV === 'development' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  // For production, you might want JSON format for easier parsing by log aggregators
  // winston.format.json()
);

// Configure the Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'http', // More verbose in dev, less in prod
  levels, // Use custom levels
  format: logFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console(),
    // File transport for production/staging (optional but recommended)
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  // Optional: Handle uncaught exceptions and unhandled rejections
  // exceptionHandlers: [
  //   new winston.transports.File({ filename: 'logs/exceptions.log' }),
  // ],
  // rejectionHandlers: [
  //   new winston.transports.File({ filename: 'logs/rejections.log' }),
  // ],
  exitOnError: false, // Do not exit on handled exceptions
});

// --- Wrapper Class for Dependency Injection ---
// This is the class that will be injected into your services.
export class Logger {
  private loggerInstance: winston.Logger;

  constructor(loggerInstance: winston.Logger) {
    this.loggerInstance = loggerInstance;
  }

  // Define methods corresponding to Winston's log levels
  info(message: string, ...meta: any[]) {
    this.loggerInstance.info(message, ...meta);
  }

  warn(message: string, ...meta: any[]) {
    this.loggerInstance.warn(message, ...meta);
  }

  error(message: string, ...meta: any[]) {
    this.loggerInstance.error(message, ...meta);
  }

  debug(message: string, ...meta: any[]) {
    if (process.env.NODE_ENV === 'development') {
      // Only log debug in dev environment
      this.loggerInstance.debug(message, ...meta);
    }
  }

  http(message: string, ...meta: any[]) {
    this.loggerInstance.http(message, ...meta);
  }

  // Add more methods for other levels (verbose, silly, etc.) as needed
}

// Export a singleton instance of your Logger wrapper to be used across your application
// This is the actual instance you'll pass during dependency injection.
export const appLogger = new Logger(winstonLogger);

// Optionally, you might export the winstonLogger directly for global error handlers
export { winstonLogger };