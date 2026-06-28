"use client";

import {
  Gavel,
  ShoppingBag,
  Trophy,
  Hammer,
} from "lucide-react";

import {
  useDashboard,
} from "@/hooks/useDashboard";

import {IOrder} from "@/types/order"
import {IAuction} from "@/types/auction"
import DashboardCard from "@/components/dashboard/DashboardCard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";
import AuctionCard from "@/components/AuctionCard";
import OrderCard from "@/components/OrderCard";

export default function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
  } = useDashboard();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError || !data) {
    return (
      <DashboardEmpty
        title="Unable to load dashboard"
        description="Please try again later."
      />
    );
  }

  return (
    <div className="space-y-10">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome back! Here's an overview of your activity.
        </p>
      </div>

      {/* Statistics */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <DashboardCard
          title="My Auctions"
          value={data.stats.myAuctions}
          icon={Gavel}
        />

        <DashboardCard
          title="Active Auctions"
          value={data.stats.activeAuctions}
          icon={Hammer}
          color="bg-green-600"
        />

        <DashboardCard
          title="Won Auctions"
          value={data.stats.wonAuctions}
          icon={Trophy}
          color="bg-yellow-500"
        />

        <DashboardCard
          title="Orders"
          value={data.stats.orders}
          icon={ShoppingBag}
          color="bg-purple-600"
        />

      </div>

      {/* Recent Auctions */}

      <section className="space-y-5">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-semibold">
            Recent Auctions
          </h2>

        </div>

        {data.recentAuctions.length === 0 ? (
          <DashboardEmpty
            title="No Auctions Found"
            description="You haven't created any auctions yet."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {data.recentAuctions.map(
              (auction: IAuction) => (
                <AuctionCard
                  key={auction._id}
                  auction={auction}
                />
              )
            )}

          </div>
        )}

      </section>

      {/* Recent Orders */}

      <section className="space-y-5">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-semibold">
            Recent Orders
          </h2>

        </div>

        {data.recentOrders.length === 0 ? (
          <DashboardEmpty
            title="No Orders"
            description="You don't have any orders yet."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">

            {data.recentOrders.map(
              (order: IOrder) => (
                <OrderCard
                  key={order._id}
                  order={order}
                />
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}