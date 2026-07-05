"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuction } from "@/hooks/useAuctions";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth.store";
import { placeBid } from "@/services/bid.service";
import api from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Clock, Shield, TrendingUp, Award, User } from "lucide-react";
import Link from "next/link";

export default function AuctionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const { data: auction, isLoading, error } = useAuction(auctionId);
  const socket = useSocket();
  const { user } = useAuthStore();

  const [currentBid, setCurrentBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<any>(null);
  const [status, setStatus] = useState<string>("active");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Synchronize local states when react-query data completes
  useEffect(() => {
    if (auction) {
      setCurrentBid(auction.currentBid || auction.startingPrice);
      setHighestBidder(auction.highestBidder);
      setStatus(auction.status);
    }
  }, [auction]);

  // Real-time Countdown Timer
  useEffect(() => {
    if (!auction?.endTime) return;

    const calculateTime = () => {
      const diff = new Date(auction.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [auction?.endTime]);

  // Socket.IO Event Listeners
  useEffect(() => {
    if (!socket || !auction) return;

    // Join the auction socket room
    socket.emit("join-auction", auctionId);
    console.log(`Joined room: ${auctionId}`);

    // Register authenticated user for targeted outbid events
    if (user?._id) {
      socket.emit("register-user", user._id);
      console.log(`Registered user: ${user._id}`);
    }

    // Live Bid updates
    socket.on("new-bid", (data: any) => {
      console.log("Socket: new-bid", data);
      if (data.auctionId === auctionId) {
        setCurrentBid(data.amount);
        setHighestBidder(data.bidderId);
        toast.info(`New bid placed: $${data.amount}`);
      }
    });

    // Auction End updates
    socket.on("auction-ended", (data: any) => {
      console.log("Socket: auction-ended", data);
      if (data.auctionId === auctionId) {
        setStatus("pending_payment");
        toast.success(`Auction finished! Winning bid: $${data.amount}`);
      }
    });

    // Auction Expired updates
    socket.on("auction-expired", (data: any) => {
      console.log("Socket: auction-expired", data);
      if (data.auctionId === auctionId) {
        setStatus("expired_no_bids");
        toast.warning("Auction expired with no bids.");
      }
    });

    // Outbid Notification
    socket.on("outbid", (data: any) => {
      console.log("Socket: outbid alert", data);
      if (data.auctionId === auctionId) {
        toast.error("You have been outbid by another bidder!");
      }
    });

    return () => {
      socket.emit("leave-auction", auctionId);
      socket.off("new-bid");
      socket.off("auction-ended");
      socket.off("auction-expired");
      socket.off("outbid");
    };
  }, [socket, auction, auctionId, user]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to place a bid.");
      router.push("/login");
      return;
    }

    const amount = Number(bidAmount);
    const minBid = currentBid || auction?.startingPrice || 0;

    if (isNaN(amount) || amount <= minBid) {
      toast.error(`Bid must be higher than the current bid of $${minBid}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Perform eligibility check
      const checkResponse = await api.post(`/auctions/${auctionId}/check-eligibility`, { amount });

      if (checkResponse.data.success) {
        // 2. Perform the actual bid placement
        await placeBid(auctionId, amount);
        toast.success(`Your bid of $${amount} was successfully placed!`);
        setBidAmount("");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.code === "PAYMENT_PROFILE_REQUIRED") {
        toast.error("Please complete your payment setup before bidding.");
        router.push(`/payment/setup?redirect=/auctions/${auctionId}`);
      } else {
        toast.error(errorData?.message || err.message || "Failed to place bid");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error loading auction</h2>
        <p className="text-gray-600 mb-6">The auction item could not be found or fetched.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded">
          <ArrowLeft size={16} /> Back to Auctions
        </Link>
      </div>
    );
  }

  const isSeller = user && auction.seller && (auction.seller._id === user._id || auction.seller === user._id);
  const isExpired = status !== "active" || timeLeft === "Ended";
  const minRequiredBid = currentBid ? currentBid + 1 : auction.startingPrice + 1;

  // Status Badge Helper
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide animate-pulse">Live</span>;
      case "pending_payment":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide">Pending Payment</span>;
      case "completed":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide">Completed</span>;
      case "expired_no_bids":
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide">Expired (No Bids)</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wide">{status}</span>;
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-black mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Auctions
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Image */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm aspect-video md:aspect-[4/3] flex items-center justify-center">
            {auction.images && auction.images.length > 0 ? (
              <img
                src={auction.images[0]}
                alt={auction.title}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
              />
            ) : (
              <div className="text-gray-400">No Image Available</div>
            )}
          </div>
          
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-gray-500" /> Secure Collectible Platform
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every bid on our platform is secured with atomic transaction locks. Payments are processed via encrypted Stripe checkout to ensure maximum transparency.
            </p>
          </div>
        </div>

        {/* Right Column: Details & Bidding panel */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {getStatusBadge()}
              <span className="text-white text-sm">Ends {new Date(auction.endTime).toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{auction.title}</h1>
            <p className="text-sm text-white mt-2 flex items-center gap-1.5">
              <User size={14} /> Listed by <span className="font-medium text-white">{auction.seller?.name || "Seller"}</span>
            </p>
          </div>

          <div className="border-t border-b border-gray-100 py-6 space-y-4">
            <h2 className="text-lg font-semibold uppercase tracking-wider text-white">Item Description</h2>
            <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{auction.description || "No description provided."}</p>
          </div>

          {/* Bidding Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Current Bid</span>
                <span className="text-2xl font-bold text-gray-900">${currentBid}</span>
                <span className="text-xs text-gray-500 block mt-1">Starting: ${auction.startingPrice}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block flex items-center gap-1">
                  <Clock size={12} /> Time Remaining
                </span>
                <span className={`text-2xl font-bold block ${timeLeft === "Ended" ? "text-red-500" : "text-gray-950"}`}>
                  {timeLeft}
                </span>
                <span className="text-xs text-gray-500 block mt-1">
                  {timeLeft === "Ended" ? "Auction closed" : "Live bidding in progress"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {isExpired ? (
                <div className="bg-red-50 text-red-800 text-sm p-4 rounded-xl border border-red-100 text-center font-medium">
                  Bidding is closed for this item.
                </div>
              ) : isSeller ? (
                <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl border border-amber-100 text-center font-medium">
                  This is your listed collectible. You cannot bid on your own auctions.
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-3">
                  <label htmlFor="bid" className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                    Place Your Bid
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <span className="text-gray-500 font-semibold">$</span>
                    </div>
                    <input
                      type="number"
                      name="bid"
                      id="bid"
                      required
                      min={minRequiredBid}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Enter $${minRequiredBid} or more`}
                      className="block w-full rounded-xl border border-gray-200 py-3 pl-8 pr-12 focus:border-black focus:ring-1 focus:ring-black outline-none text-base"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <span className="text-gray-400 text-xs font-medium">USD</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-neutral-800 active:scale-[0.98] py-3.5 px-4 rounded-xl font-semibold shadow transition-all duration-150 flex items-center justify-center gap-2 disabled:bg-neutral-400 disabled:scale-100 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <TrendingUp size={18} /> Place Bid
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Highest Bidder details */}
              {highestBidder && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Award size={14} className="text-amber-500" /> Current Leader:
                  </span>
                  <span className="font-semibold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {highestBidder.name || (typeof highestBidder === "object" ? highestBidder._id : highestBidder)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}