"use client";

import {
  useMyAuctions,
} from "@/hooks/useDashboard";

import AuctionCard from "@/components/AuctionCard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";

export default function MyAuctionsPage() {
  const {
    data,
    isLoading,
    isError,
  } = useMyAuctions();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError) {
    return (
      <DashboardEmpty
        title="Unable to load auctions"
        description="Please try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <DashboardEmpty
        title="No Auctions"
        description="You haven't created any auctions yet."
      />
    );
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          My Auctions
        </h1>

        <p className="text-gray-500">
          Auctions created by you.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {data.map((auction: any) => (
          <AuctionCard
            key={auction._id}
            auction={auction}
          />
        ))}

      </div>

    </div>
  );
}