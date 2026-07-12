"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({
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
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <DashboardSidebar />

      <div className="flex-1 flex flex-col">

        <DashboardNavbar />

        <main className="flex-1 p-8">

          {children}

        </main>

      </div>

    </div>
  );
}