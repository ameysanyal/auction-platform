import { IAuction } from "./auction";
import { IUser } from "./user";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED";

export interface IOrder {
  _id: string;

  auction: IAuction;

  winner: IUser;

  amount: number;

  paymentStatus: PaymentStatus;

  createdAt: string;

  updatedAt: string;
}