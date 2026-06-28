import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export const registerAuctionSocket = (io: Server) => {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT secret not configured on server"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id, socket.data.user);

    socket.on("register-user", (userId) => {
      socket.join(`user:${userId}`);
    });
    socket.on("join-auction", (auctionId) => {
      socket.join(auctionId);

      console.log(`${socket.id} joined ${auctionId}`);
    });

    socket.on("leave-auction", (auctionId) => {
      socket.leave(auctionId);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });
};
