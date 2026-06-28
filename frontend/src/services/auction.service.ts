import api from "./api";

export interface CreateAuctionDto {
  title: string;
  description: string;
  startingPrice: number;
  endTime: string;
  images: string[];
}

export const getAuctions = async (
  page = 1,
  limit = 12
) => {
  const { data } = await api.get(
    `/auctions?page=${page}&limit=${limit}`
  );

  return data;
};

export const getAuctionById = async (
  id: string
) => {
  const { data } = await api.get(
    `/auctions/${id}`
  );

  return data;
};

export const createAuction = async (
  payload: CreateAuctionDto
) => {
  const { data } = await api.post(
    "/auctions",
    payload
  );

  return data;
};