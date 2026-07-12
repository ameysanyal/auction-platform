"use client";

import { Users, Gavel, ShoppingBag, IndianRupee } from "lucide-react";

import StatCard from "@/components/admin/StatCard";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import EmptyState from "@/components/admin/EmptyState";

import { useDashboard } from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <LoadingSkeleton />;

  if (!data)
    return (
      <EmptyState
        title="No dashboard data"
        description="Dashboard statistics are unavailable."
      />
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>

        <p className="text-gray-500">Platform overview</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Users"
          value={data.stats.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />

        <StatCard
          title="Auctions"
          value={data.stats.totalAuctions}
          icon={Gavel}
          color="bg-green-500"
        />

        <StatCard
          title="Orders"
          value={data.stats.totalOrders}
          icon={ShoppingBag}
          color="bg-purple-500"
        />

        <StatCard
          title="Revenue"
          value={`₹${data.stats.totalRevenue}`}
          icon={IndianRupee}
          color="bg-orange-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-black text-lg mb-4">
            Recent Users
          </h2>

          {data.recentUsers.length === 0 ? (
            <EmptyState
              title="No Users"
              description="No registered users yet."
            />
          ) : (
            <div className="space-y-4">
              {data.recentUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>

                    <p className="text-sm text-gray-800">{user.email}</p>
                  </div>

                  <span className="text-sm bg-blue-300 px-2 py-1 rounded text-black">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold  text-black text-lg mb-4">
            Recent Auctions
          </h2>

          {data.recentAuctions.length === 0 ? (
            <EmptyState title="No Auctions" description="No auctions found." />
          ) : (
            <div className="space-y-4">
              {data.recentAuctions.map((auction: any) => (
                <div
                  key={auction._id}
                  className="flex justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{auction.title}</p>

                    <p className="text-sm text-gray-800">
                      ₹{auction.currentBid}
                    </p>
                  </div>

                  <span className="bg-green-300 rounded px-2 py-1 text-sm text-black">
                    {auction.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
