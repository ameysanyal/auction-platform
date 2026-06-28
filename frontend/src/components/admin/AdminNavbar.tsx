"use client";

import { Bell, Search } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";

export default function AdminNavbar() {
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <Search size={18} />

        <input
          placeholder="Search..."
          className="border rounded-lg px-3 py-2 w-72"
        />
      </div>

      <div className="flex items-center gap-5">
        <Bell size={22} />

        <div className="font-medium">{user?.name}</div>
      </div>
    </header>
  );
}
