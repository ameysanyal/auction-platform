"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import api from "@/services/api";
import { toast } from "sonner";
import { CreditCard, Lock, ShieldCheck, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

// ── Minimal ambient types so TypeScript is happy ────────────────────────────
declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

interface StripeInstance {
  elements: (opts: { clientSecret: string; appearance?: object }) => StripeElements;
  confirmSetup: (opts: {
    elements: StripeElements;
    confirmParams: { payment_method_data?: object; return_url?: string };
    redirect: "if_required" | "always";
  }) => Promise<{ setupIntent?: { id: string; status: string }; error?: { message: string } }>;
}

interface StripeElements {
  create: (type: string, opts?: object) => StripeElement;
  getElement: (type: string) => StripeElement | null;
  submit: () => Promise<{ error?: { message: string } }>;
}

interface StripeElement {
  mount: (container: HTMLElement | string) => void;
  unmount: () => void;
  on: (event: string, handler: () => void) => void;
}
// ────────────────────────────────────────────────────────────────────────────

interface BillingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // State
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [stripeReady, setStripeReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [billing, setBilling] = useState<BillingAddress>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "IN",
    postalCode: "",
  });

  // Refs to stripe objects
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const mountedRef = useRef(false);
  const paymentElementContainerRef = useRef<HTMLDivElement>(null);

  // ── Step 1: fetch clientSecret from backend ──────────────────────────────
  useEffect(() => {
    const fetchSetupIntent = async () => {
      try {
        const res = await api.post("/payments/setup-intent");
        setClientSecret(res.data.clientSecret);
      } catch (err: any) {
        toast.error(
          "Could not initialize payment setup: " +
            (err.response?.data?.message ?? err.message)
        );
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchSetupIntent();
  }, []);

  // ── Step 2: mount Stripe Payment Element once both are ready ─────────────
  useEffect(() => {
    if (!stripeReady || !clientSecret || mountedRef.current) return;
    if (!window.Stripe) return;
    if (!paymentElementContainerRef.current) return;

    mountedRef.current = true;

    const stripe = window.Stripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
    );
    stripeRef.current = stripe;

    const appearance = {
      theme: "stripe",
      variables: {
        colorPrimary: "#000000",
        colorBackground: "#fafafa",
        colorText: "#1a1a1a",
        borderRadius: "12px",
        fontFamily: "system-ui, sans-serif",
      },
    };

    const elements = stripe.elements({ clientSecret, appearance });
    elementsRef.current = elements;

    const paymentElement = elements.create("payment", {
      layout: { type: "tabs", defaultCollapsed: false },
    });

    paymentElement.mount(paymentElementContainerRef.current);
    paymentElement.on("ready", () => setPaymentElementReady(true));

    return () => {
      if (mountedRef.current) {
        try {
          paymentElement.unmount();
        } catch (_) {}
        mountedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeReady, clientSecret]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  // ── Step 3: Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripeRef.current || !elementsRef.current) {
      toast.error("Stripe is not fully loaded yet. Please wait a moment.");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must accept the terms to save your payment profile.");
      return;
    }
    if (!billing.line1 || !billing.city || !billing.state || !billing.postalCode) {
      toast.error("Please fill in all required billing address fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit the elements form first (validates card data)
      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) {
        toast.error(submitError.message || "Payment details validation failed.");
        return;
      }

      // 2. Confirm the SetupIntent
      const { setupIntent, error } = await stripeRef.current.confirmSetup({
        elements: elementsRef.current,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              address: {
                line1: billing.line1,
                line2: billing.line2 || undefined,
                city: billing.city,
                state: billing.state,
                country: billing.country,
                postal_code: billing.postalCode,
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Failed to confirm payment setup.");
        return;
      }

      if (setupIntent?.status === "succeeded") {
        // 3. Persist profile in backend
        const res = await api.post("/payments/profile", {
          setupIntentId: setupIntent.id,
          termsAccepted: true,
          billingAddress: billing,
        });

        if (res.data.success) {
          toast.success("Payment profile saved! Redirecting you back…");
          setTimeout(() => router.push(redirectTo), 1200);
        } else {
          toast.error(res.data.message || "Failed to save payment profile.");
        }
      } else {
        toast.error(
          "Setup did not complete. Status: " + (setupIntent?.status ?? "unknown")
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Load Stripe.js from CDN */}
      <Script
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onReady={() => setStripeReady(true)}
      />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          {/* Back / Cancel */}
          <Link
            href={redirectTo}
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-black mb-8 transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Cancel and go back
          </Link>

          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
            {/* ── Header ── */}
            <div className="relative bg-neutral-950 px-8 pt-8 pb-10 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #6366f1 0%, transparent 60%)" }} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="inline-block text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold mb-2">
                    Collectible Auction Network
                  </span>
                  <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
                    <CreditCard size={22} className="text-indigo-400" />
                    Complete Payment Setup
                  </h1>
                  <p className="text-sm text-neutral-400 mt-2 max-w-sm leading-relaxed">
                    Link a payment method once. You will only be charged automatically
                    if you win an auction.
                  </p>
                </div>
                <Lock size={28} className="text-neutral-700 mt-1 flex-shrink-0" />
              </div>

              {/* Trust badges */}
              <div className="relative z-10 flex gap-4 mt-6 flex-wrap">
                {["256-bit SSL", "PCI Compliant", "Powered by Stripe"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 border border-neutral-800 rounded-full px-3 py-1"
                  >
                    <CheckCircle size={10} className="text-emerald-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="p-8">
              {isPageLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-black animate-spin" />
                  <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
                    Initializing secure form…
                  </p>
                </div>
              ) : !clientSecret ? (
                <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-red-700 font-semibold text-sm">
                    Could not initialize the payment form.
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Please ensure you are logged in and try again.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-7" noValidate>

                  {/* ── Billing Address ── */}
                  <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-2">
                      Billing Address
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          Address Line 1 <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="line1"
                          required
                          value={billing.line1}
                          onChange={handleInputChange}
                          placeholder="123 Collectible Way"
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="line2"
                          value={billing.line2}
                          onChange={handleInputChange}
                          placeholder="Apartment, suite, floor…"
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          City <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={billing.city}
                          onChange={handleInputChange}
                          placeholder="Mumbai"
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          State / Region <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          required
                          value={billing.state}
                          onChange={handleInputChange}
                          placeholder="Maharashtra"
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          Country <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="country"
                          value={billing.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white appearance-none"
                        >
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="SG">Singapore</option>
                          <option value="AE">UAE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          Postal / ZIP Code <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          value={billing.postalCode}
                          onChange={handleInputChange}
                          placeholder="400001"
                          className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </section>

                  {/* ── Stripe Payment Element ── */}
                  <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-2">
                      Payment Details
                    </h2>
                    <div
                      className="min-h-[120px] p-4 rounded-2xl border border-neutral-100 bg-slate-50 transition-all"
                      style={{ opacity: paymentElementReady ? 1 : 0.5 }}
                    >
                      {/* Stripe mounts the Payment Element here */}
                      <div ref={paymentElementContainerRef} id="stripe-payment-element" />
                      {!paymentElementReady && (
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
                          <div className="w-4 h-4 border border-neutral-300 border-t-black rounded-full animate-spin" />
                          Loading secure payment form…
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Supports Credit / Debit Cards, Apple Pay, Google Pay, and Link.
                      Your card details are encrypted and handled securely by Stripe.
                    </p>
                  </section>

                  {/* ── Terms Acceptance ── */}
                  <section>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            termsAccepted
                              ? "bg-black border-black"
                              : "border-neutral-300 bg-white group-hover:border-neutral-400"
                          }`}
                        >
                          {termsAccepted && (
                            <svg
                              viewBox="0 0 12 10"
                              fill="none"
                              className="w-3 h-2.5"
                            >
                              <path
                                d="M1 5l3.5 3.5L11 1"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500 leading-relaxed pt-0.5">
                        I authorize the Collectible Auction Network to securely store
                        this payment method and automatically charge it for the final
                        winning bid amount on any auction I win. I understand I can
                        review saved methods in my account settings.
                      </span>
                    </label>
                  </section>

                  {/* ── Submit Button ── */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !paymentElementReady || !termsAccepted}
                    className="w-full relative bg-black text-white font-semibold py-4 rounded-2xl transition-all duration-200
                      hover:bg-neutral-800 active:scale-[0.99]
                      disabled:opacity-50 disabled:pointer-events-none
                      flex items-center justify-center gap-2.5 shadow-lg shadow-black/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving payment profile…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Save Payment Profile &amp; Authorize Bidding
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer trust note */}
          <p className="text-center text-[11px] text-neutral-400 mt-6">
            Your payment information is never stored on our servers. All data is
            handled securely by{" "}
            <span className="font-semibold text-neutral-500">Stripe</span>, a
            PCI-DSS Level 1 certified payment processor.
          </p>
        </div>
      </main>
    </>
  );
}

export default function PaymentSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-12 h-12 border-2 border-slate-200 border-t-black rounded-full animate-spin" />
        </div>
      }
    >
      <SetupPageContent />
    </Suspense>
  );
}
