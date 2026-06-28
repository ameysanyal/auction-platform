"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Package, Loader2, XCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { confirmPaymentSession } from "@/services/order.service";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("success");
      return;
    }

    const verifyPayment = async () => {
      try {
        await confirmPaymentSession(sessionId);
        setStatus("success");
      } catch (err: any) {
        console.error("Verification failed:", err);
        setErrorMsg(err.response?.data?.message || err.message || "Failed to verify payment status.");
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        {status === "verifying" && (
          <div className="py-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              We are confirming your payment status with Stripe. Please do not close or refresh this page.
            </p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-emerald-600 animate-bounce" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-2 text-sm leading-relaxed">
              Your payment has been processed and the item is now yours. The seller has been notified.
            </p>

            {sessionId && (
              <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 mb-6 break-all">
                Session: {sessionId}
              </p>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                <Package className="w-4 h-4" /> View My Orders
              </Link>
              <Link
                href="/auctions"
                className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-black border border-gray-200 px-6 py-3 rounded-xl font-medium transition-colors hover:border-gray-400"
              >
                Browse More Auctions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-4 text-sm leading-relaxed">
              {errorMsg || "We encountered an issue confirming your payment. Your payment might have succeeded, but we couldn't automatically update your order."}
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                Go to My Orders
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-black border border-gray-200 px-6 py-3 rounded-xl font-medium transition-colors hover:border-gray-400"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
