"use client";

import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";

import { useAuthStore } from "@/store/auth.store";

import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } =
    useAuthStore();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN"){
    redirect("/");
  }

  return (
    <div className="flex h-screen">
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