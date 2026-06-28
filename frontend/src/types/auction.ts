import { IUser } from "./user";

export type AuctionStatus =
  | "ACTIVE"
  | "SOLD"
  | "ENDED";

export interface IAuction {
  _id: string;

  title: string;

  description: string;

  images: string[];

  startingPrice: number;

  currentBid: number;

  status: AuctionStatus;

  endTime: string;

  seller: IUser;

  highestBidder?: IUser;

  createdAt: string;

  updatedAt: string;
}