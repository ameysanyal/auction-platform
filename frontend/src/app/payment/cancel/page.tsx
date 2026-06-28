"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          Your payment was not completed. No charges have been made. You can try again from your orders page.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retry Payment
          </Link>
          <Link
            href="/auctions"
            className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-black border border-gray-200 px-6 py-3 rounded-xl font-medium transition-colors hover:border-gray-400"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Auctions
          </Link>
        </div>
      </div>
    </main>
  );
}
