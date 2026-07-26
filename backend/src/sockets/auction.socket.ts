import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/**
 * Registers Socket.io middleware and event handlers for the auction system.
 * 
 * @param io - The main Socket.io server instance.
 */
export const registerAuctionSocket = (io: Server) => {
  // ==========================================
  // Authentication Middleware
  // ==========================================
  // Runs before establishing a connection; validates incoming connection tokens.
  io.use((socket, next) => {
    // Extract JWT from handshake auth payload or HTTP Authorization header ("Bearer <token>")
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    // Reject connection if no token is provided
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      // Ensure the JWT secret key is present in environment variables
      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT secret not configured on server"));
      }

      // Verify token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach authenticated payload to socket metadata for downstream handlers
      socket.data.user = decoded;
      
      // Allow connection to proceed
      next();
    } catch (err) {
      // Reject connection if token verification fails (e.g., expired or invalid signature)
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // ==========================================
  // Socket Event Listeners
  // ==========================================
  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id, socket.data.user);

    /**
     * Join a user-specific room for targeted notifications (e.g., direct messages, outbid alerts).
     * Security note: Rely on `socket.data.user` rather than trusting client-supplied `userId` in production.
     */
    socket.on("register-user", (userId) => {
      socket.join(`user:${userId}`);
    });

    /**
     * Join a specific auction room to receive real-time updates (bids, timers, status updates).
     */
    socket.on("join-auction", (auctionId) => {
      socket.join(auctionId);
      console.log(`${socket.id} joined ${auctionId}`);
    });

    /**
     * Leave a specific auction room when a client navigates away.
     */
    socket.on("leave-auction", (auctionId) => {
      socket.leave(auctionId);
    });

    /**
     * Clean up or log when client disconnects.
     */
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};