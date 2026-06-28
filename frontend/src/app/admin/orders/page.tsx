"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/useAdmin";
import { ShoppingBag, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle } from "lucide-react";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useOrders(page);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-semibold">Error loading orders. Please try again.</p>
      </div>
    );
  }

  const orders = data.data || [];
  const totalPages = data.totalPages || 1;

  const getStatusIcon = (status: string) => {
    if (status === "PAID") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === "FAILED") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const getStatusClass = (status: string) => {
    if (status === "PAID") return "bg-emerald-100 text-emerald-800";
    if (status === "FAILED") return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-purple-500" />
          All Orders
        </h1>
        <p className="text-gray-500">Monitor all platform orders and payment statuses</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Auction</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Winner</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                    {order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {order.auction?.title || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {order.winner?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    ₹{order.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(order.paymentStatus)}`}>
                      {getStatusIcon(order.paymentStatus)}
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-t">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border bg-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border bg-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
