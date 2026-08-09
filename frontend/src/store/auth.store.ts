"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  login: (user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => {
        set({ user });
      },
      setUser: (user) => {
        set({ user });
      },
      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);