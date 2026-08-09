"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5050";

    const clientSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      console.log("Socket.IO connected to backend successfully:", clientSocket.id);
      setSocket(clientSocket);
    });

    clientSocket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
    });

    return () => {
      clientSocket.disconnect();
    };
  }, [user]);

  return socket;
};
