"use client";

import { useState } from "react";
import { useAuctions, useSuspendAuction, useDeleteAuction } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Gavel, Clock, ChevronLeft, ChevronRight, Ban, Trash2 } from "lucide-react";

export default function AdminAuctionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAuctions(page);
  
  const suspendMutation = useSuspendAuction();
  const deleteMutation = useDeleteAuction();

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
        <p className="text-red-500 font-semibold">Error loading auctions. Please try again.</p>
      </div>
    );
  }

  const auctions = data.data || [];
  const totalPages = data.totalPages || 1;

  const handleSuspend = (auctionId: string) => {
    if (confirm("Are you sure you want to suspend this auction?")) {
      suspendMutation.mutate(auctionId, {
        onSuccess: () => {
          toast.success("Auction suspended successfully!");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to suspend auction");
        }
      });
    }
  };

  const handleDelete = (auctionId: string) => {
    if (confirm("Are you sure you want to delete this auction permanently?")) {
      deleteMutation.mutate(auctionId, {
        onSuccess: () => {
          toast.success("Auction deleted successfully!");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to delete auction");
        }
      });
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "expired_no_bids":
        return "bg-gray-100 text-gray-800";
      case "pending_payment":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gavel className="w-8 h-8 text-green-500" />
          Moderate Auctions
        </h1>
        <p className="text-gray-500">Monitor and suspend/delete auction listings</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Auction Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Current Bid</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ends At</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {auctions.map((auction: any) => (
              <tr key={auction._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{auction.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {auction.seller?.name || "Unknown Seller"} ({auction.seller?.email || ""})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                  ₹{auction.currentBid || auction.startingPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusClass(auction.status)}`}>
                    {auction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(auction.endTime).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex justify-end gap-3">
                    {auction.status === "active" && (
                      <button
                        onClick={() => handleSuspend(auction._id)}
                        disabled={suspendMutation.isPending}
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-900 font-medium transition"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(auction._id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 font-medium transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
