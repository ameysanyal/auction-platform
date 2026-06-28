import { IAuction } from "./auction";
import { IOrder } from "./order";

export interface DashboardStats {
  myAuctions: number;
  activeAuctions: number;
  wonAuctions: number;
  orders: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentAuctions: IAuction[];
  recentOrders: IOrder[];
}

export interface MyBid {
  _id: string;

  auction: IAuction;

  amount: number;

  createdAt: string;
}