import AuctionCard from "./AuctionCard";

interface Props {
  auctions: any[];
}

export default function AuctionGrid({
  auctions,
}: Props) {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      {auctions.map(
        auction => (
          <AuctionCard
            key={
              auction._id
            }
            auction={
              auction
            }
          />
        )
      )}
    </div>
  );
}