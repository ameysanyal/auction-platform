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
      {/* FIXED: Changed bg-white to bg-gray-900 and border-gray-100 to border-gray-800 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-700 transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-800 overflow-hidden">
          {auction.images?.[0] ? (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No Image</div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {!isExpired ? (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="bg-gray-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">ENDED</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* FIXED: Kept text-white and changed hover behavior to match the dark theme */}
          <h2 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
            {auction.title}
          </h2>

          {/* FIXED: Changed border-gray-50 to border-gray-800 */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
            <div>
              {/* FIXED: Lightened label text to gray-400 for better visibility */}
              <span className="text-xs text-gray-400 block">Current bid</span>
              {/* FIXED: Changed text-gray-900 to text-white */}
              <span className="font-bold text-white flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                ${currentAmount}
              </span>
            </div>
            <div className="text-right">
              {/* FIXED: Lightened label text to gray-400 */}
              <span className="text-xs text-gray-400 block">Time left</span>
              {/* FIXED: Tweak the amber color slightly for dark mode contrast */}
              <span className={`text-sm font-semibold flex items-center gap-1 ${isExpired ? "text-gray-500" : "text-amber-400"}`}>
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