"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { usePathname } from "next/navigation";
import { dashboardMenus } from "@/constants/dashboard";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardNavbar() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  return (
    <header className="bg-white border-b px-8 py-5 flex items-center justify-between gap-6">
      {/* Left side: Greeting */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Welcome, {user?.name || "Guest"} 👋
        </h1>
        <p className="text-gray-500 text-sm hidden sm:block">
          Manage your auctions and orders.
        </p>
      </div>

      {/* Middle side: Navigation Menu */}
      <nav className="hidden lg:flex items-center gap-6">
        {dashboardMenus.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-650 ${
                isActive ? "text-blue-600 font-semibold" : "text-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href="/notifications"
          className="relative p-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell className="w-6 h-6" />
          <NotificationBell />
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            0
          </span>
        </Link>

        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || "User avatar"}
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    </header>
  );
}
