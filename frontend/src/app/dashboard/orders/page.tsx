"use client";

import {
  useOrders,
} from "@/hooks/useDashboard";

import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardEmpty from "@/components/dashboard/DashboardEmpty";

import OrderCard from "@/components/OrderCard";

export default function OrdersPage() {
  const {
    data,
    isLoading,
    isError,
  } = useOrders();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError) {
    return (
      <DashboardEmpty
        title="Unable to load orders"
        description="Please try again."
      />
    );
  }

  if (!data?.length) {
    return (
      <DashboardEmpty
        title="No Orders"
        description="No orders available."
      />
    );
  }

  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          My Orders
        </h1>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {data.map((order: any) => (

          <OrderCard
            key={order._id}
            order={order}
          />

        ))}

      </div>

    </div>
  );
}