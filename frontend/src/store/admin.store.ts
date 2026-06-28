"use client";

import { create } from "zustand";

interface AdminStore {
  sidebarOpen: boolean;

  toggleSidebar: () => void;
}


export const useAdminStore =
  create<AdminStore>((set) => ({
    sidebarOpen: true,

    toggleSidebar: () =>
      set((state) => ({
        sidebarOpen: !state.sidebarOpen,
      })),
  }));