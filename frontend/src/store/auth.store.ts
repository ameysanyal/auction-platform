"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar?: string;
}


interface AuthStore {
  user: User | null;

  token: string | null;

  login: (
    user: User,
    token: string
  ) => void;

  logout: () => void;
}

export const useAuthStore =
  create<AuthStore>()(
    persist(
      set => ({
        user: null,

        token: null,

        login: (
          user,
          token
        ) => {
          set({
            user,
            token,
          });
        },

        logout: () => {
          set({
            user: null,
            token: null,
          });
        },
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(
          () => localStorage
        ),
      }
    )
  );