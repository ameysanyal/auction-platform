"use client";

import Link from "next/link";

import { Bell } from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { data } =
    useNotifications();

  const unread =
    data?.filter(
      (n: any) => !n.read
    ).length ?? 0;

  return (
    <Link
      href="/notifications"
      className="relative"
    >
      <Bell size={22} />

      {unread > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unread}
        </span>
      )}
    </Link>
  );
}