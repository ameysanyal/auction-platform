"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyOrders, createCheckoutSession } from "@/services/order.service";
import { toast } from "sonner";
import { Package, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrders,
  });

  const checkoutMutation = useMutation({
    mutationFn: (orderId: string) => createCheckoutSession(orderId),
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to initiate checkout");
    },
  });

  const getStatusIcon = (status: string) => {
    if (status === "PAID") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === "FAILED") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "PAID")
      return "bg-emerald-100 text-emerald-800";
    if (status === "FAILED")
      return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-7 h-7 text-white" />
        <h1 className="text-3xl font-bold text-white">My Orders</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-500 mb-2">No orders yet</h2>
          <p className="text-gray-800 text-sm mb-6">Win an auction to see your orders here.</p>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order._id}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.paymentStatus)}
                    <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${getStatusBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mt-1">
                    {order.auction?.title || "Auction Item"}
                  </h2>
                  <p className="text-sm text-gray-800">
                    Winning bid: <span className="font-semibold text-gray-800">${order.amount}</span>
                  </p>
                  <p className="text-xs text-gray-800">
                    Order ID: <span className="font-mono">{order._id}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  {order.paymentStatus === "PENDING" && (
                    <button
                      onClick={() => checkoutMutation.mutate(order._id)}
                      disabled={checkoutMutation.isPending}
                      className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {checkoutMutation.isPending ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Pay Now
                    </button>
                  )}
                  {order.paymentStatus === "PAID" && order.paidAt && (
                    <p className="text-xs text-gray-800">
                      Paid {new Date(order.paidAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
