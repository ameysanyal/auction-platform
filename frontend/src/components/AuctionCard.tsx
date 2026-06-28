"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, TrendingUp } from "lucide-react";

interface Props {
  auction: any;
}

function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return timeLeft;
}

export default function AuctionCard({ auction }: Props) {
  const timeLeft = useCountdown(auction.endTime);
  const isExpired = timeLeft === "Ended";
  const currentAmount = auction.currentBid || auction.startingPrice;

  return (
    <Link href={`/auctions/${auction._id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {auction.images?.[0] ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {!isExpired ? (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="bg-gray-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">ENDED</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h2 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {auction.title}
          </h2>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div>
              <span className="text-xs text-gray-400 block">Current bid</span>
              <span className="font-bold text-gray-900 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                ${currentAmount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Time left</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${isExpired ? "text-gray-400" : "text-amber-600"}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}