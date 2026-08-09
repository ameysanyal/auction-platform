import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift()?.trim();
    if (name) {
      const value = parts.join("=").trim();
      list[name] = decodeURIComponent(value);
    }
  });

  return list;
};

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
    const cookies = parseCookies(socket.handshake.headers?.cookie);
    
    // Extract JWT from cookies, handshake auth payload, or HTTP Authorization header ("Bearer <token>")
    const token =
      cookies.accessToken ||
      cookies.token ||
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

    // Derive user ID securely from authenticated socket metadata
    const authenticatedUserId = socket.data.user?._id || socket.data.user?.userId;

    if (authenticatedUserId) {
      const userRoom = `user:${authenticatedUserId}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} automatically joined derived user room: ${userRoom}`);
    }

    /**
     * User room registration is derived from socket.data.user on connection.
     * Legacy handler retains safety by forcing room join to authenticated user ID only.
     */
    socket.on("register-user", () => {
      if (authenticatedUserId) {
        socket.join(`user:${authenticatedUserId}`);
      }
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