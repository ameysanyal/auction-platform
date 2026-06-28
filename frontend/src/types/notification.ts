export type NotificationType =
  | "OUTBID"
  | "AUCTION_WON"
  | "PAYMENT";

export interface INotification {
  _id: string;

  title: string;

  message: string;

  type: NotificationType;

  read: boolean;

  createdAt: string;
}