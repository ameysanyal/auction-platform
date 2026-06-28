"use client";

import {
  useMyBids,
} from "@/hooks/useDashboard";

import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";

export default function MyBidsPage() {
  const {
    data,
    isLoading,
    isError,
  } = useMyBids();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError) {
    return (
      <DashboardEmpty
        title="Unable to load bids"
        description="Please try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <DashboardEmpty
        title="No Bids"
        description="You haven't placed any bids yet."
      />
    );
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          My Bids
        </h1>

      </div>

      <div className="space-y-5">

        {data.map((bid: any) => (

          <div
            key={bid._id}
            className="bg-white rounded-xl border p-5 shadow-sm flex justify-between items-center"
          >

            <div>

              <h2 className="font-semibold">
                {bid.auction.title}
              </h2>

              <p className="text-gray-500 mt-1">
                Your Bid:
                {" "}
                ₹{bid.amount}
              </p>

            </div>

            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">

              {bid.auction.status}

            </span>

          </div>

        ))}

      </div>

    </div>
  );
}