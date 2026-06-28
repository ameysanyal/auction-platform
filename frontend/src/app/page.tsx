"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Gavel, Zap, Shield, Clock, TrendingUp, ArrowRight, Star } from "lucide-react";

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Bidding",
      desc: "Live price updates via Socket.IO — no page refresh needed.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Atomic Transactions",
      desc: "Redis locks + Mongoose transactions prevent race conditions.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Auto Auction Closure",
      desc: "BullMQ jobs close auctions on time, with a 15-min fallback sweep.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Secure Payments",
      desc: "Idempotent Stripe checkout ensures you're never double-charged.",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8 backdrop-blur-sm">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white/80">Live Collectibles Marketplace</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[1.05]">
            Bid Live.<br />Win Rare.
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A real-time auction platform built for collectors. Place bids instantly,
            get outbid alerts, and checkout securely — all without a single page refresh.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auctions"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Gavel className="w-5 h-5" /> Browse Auctions
            </Link>

            {mounted && !user ? (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white border border-white/20 px-7 py-3.5 rounded-xl transition-colors hover:border-white/40"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
            ) : mounted && user ? (
              <Link
                href="/auctions/create"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white border border-white/20 px-7 py-3.5 rounded-xl transition-colors hover:border-white/40"
              >
                List an Item <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Built for Speed & Fairness
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Every layer of this platform is designed so that the best bid always wins — fairly and instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <div className="w-11 h-11 bg-gray-900 text-white rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start bidding?
          </h2>
          <p className="text-white/50 mb-8 text-lg">
            Join the platform and discover rare collectibles from verified sellers.
          </p>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Gavel className="w-5 h-5" /> Explore Auctions
          </Link>
        </div>
      </section>
    </main>
  );
}