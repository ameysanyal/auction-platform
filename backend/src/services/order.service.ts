import Order from "../models/order.model.js";
import AuctionItem from "../models/auction-item.model.js";
import { Types } from "mongoose";
import { appLogger } from "../config/logger.js";

// Define an enum for payment statuses for type-safety
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

// Interface for the createOrder input parameters
interface ICreateOrderInput {
  auctionId: string | Types.ObjectId;
  winnerId: string | Types.ObjectId;
  amount: number;
}

class OrderService {
  /**
   * Creates a new pending order for an auction winner
   */
  async createOrder({
    auctionId,
    winnerId,
    amount,
  }: ICreateOrderInput) {
    appLogger.info(
      `[OrderService] Creating order — auctionId=${auctionId} winnerId=${winnerId} amount=$${amount}`
    );

    const auction = await AuctionItem.findById(auctionId).exec();
    if (!auction) {
      appLogger.warn(`[OrderService] Auction ${auctionId} not found when creating order`);
      throw new Error("Auction not found");
    }

    const order = await Order.create({
      auction: auctionId,
      winner: winnerId,
      seller: auction.seller,
      amount,
      paymentStatus: PaymentStatus.PENDING,
    });

    appLogger.info(
      `[OrderService] Order ${order._id} created — winner=${winnerId} seller=${auction.seller} amount=$${amount}`
    );

    return order;
  }

  /**
   * Marks an order's payment status as PAID
   */
  async markPaid(orderId: string | Types.ObjectId) {
    appLogger.info(`[OrderService] Marking order ${orderId} as PAID`);

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: PaymentStatus.PAID },
      { new: true }
    ).exec();

    if (!order) {
      appLogger.warn(`[OrderService] Order ${orderId} not found when attempting markPaid`);
    } else {
      appLogger.info(`[OrderService] Order ${orderId} successfully marked as PAID`);
    }

    return order;
  }
}

// Export a singleton instance of the service
export default new OrderService();