"use client";

import {
  useWonAuctions,
} from "@/hooks/useDashboard";

import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";

import Link from "next/link";

export default function WonAuctionsPage() {
  const {
    data,
    isLoading,
    isError,
  } = useWonAuctions();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError) {
    return (
      <DashboardEmpty
        title="Unable to load won auctions"
        description="Please try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <DashboardEmpty
        title="No Won Auctions"
        description="You haven't won any auctions."
      />
    );
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Won Auctions
      </h1>

      {data.map((order: any) => (

        <div
          key={order._id}
          className="bg-white rounded-xl border p-5 shadow-sm flex justify-between items-center"
        >

          <div>

            <h2 className="font-semibold">
              {order.auction.title}
            </h2>

            <p className="mt-1">
              ₹{order.amount}
            </p>

          </div>

          <div className="flex items-center gap-4">

            <span
              className={`px-3 py-1 rounded-full

              ${
                order.paymentStatus ===
                "PAID"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {order.paymentStatus}
            </span>

            {order.paymentStatus ===
              "PENDING" && (
              <Link
                href={`/payment/${order._id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Pay Now
              </Link>
            )}

          </div>

        </div>

      ))}

    </div>
  );
}