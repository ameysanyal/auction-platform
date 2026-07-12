"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";

import { useAuthStore } from "@/store/auth.store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "ADMIN") {
        router.replace("/");
      }
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <AdminNavbar />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}