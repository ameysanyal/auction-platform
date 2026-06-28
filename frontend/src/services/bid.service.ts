import api from "./api";

export const placeBid = async (auctionId: string, amount: number) => {
  const response = await api.post(`/bids/${auctionId}`, { amount });
  return response.data;
};
