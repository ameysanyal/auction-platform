"use client";

import { useState } from "react";
import AuctionGrid from "@/components/AuctionGrid";
import { useAuctions } from "@/hooks/useAuctions";
import { Gavel, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function AuctionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuctions(page);
  const { user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const auctions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Gavel className="w-8 h-8 text-indigo-600" />
            Live Auctions
          </h1>
          <p className="text-lg text-white mt-1">
            Place bids in real-time on verified authentic collectibles.
          </p>
        </div>

        {user && (
          <Link
            href="/auctions/create"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200"
          >
            List an Item
          </Link>
        )}
      </div>

      {/* Grid */}
      {auctions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-500 mb-2">
            No active auctions
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Check back later or list the first item yourself!
          </p>
          {user && (
            <Link
              href="/auctions/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              List an Item
            </Link>
          )}
        </div>
      ) : (
        <>
          <AuctionGrid auctions={auctions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-gray-100">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-600 px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
