import CreateAuctionForm from "@/components/CreateAuctionForm";

export default function CreateAuctionPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Create Auction
      </h1>

      <CreateAuctionForm />
    </div>
  );
}