"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { Gavel, LogOut, Plus, Package, LogIn, UserPlus } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-2xl text-gray-900 hover:text-black transition-colors">
          <Gavel className="w-5 h-5 text-indigo-600" />
          <span>BidLive</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/auctions"
            className="text-lg font-medium text-gray-800 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Auctions
          </Link>
          {user && (
            <>
              <Link
                href="/orders"
                className="text-lg font-medium text-gray-800 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Package className="w-4 h-4" /> Orders
              </Link>
              <Link
                href="/auctions/create"
                className="text-lg font-medium text-gray-800 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> List Item
              </Link>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-lg font-medium text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-lg font-medium text-gray-800 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-lg font-medium text-gray-800 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-lg font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}