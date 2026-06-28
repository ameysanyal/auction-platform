import type { Request, Response } from "express";

import stripe from "../config/stripe.js";

import Order from "../models/order.model.js";
import AuctionItem from "../models/auction-item.model.js";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  //Ownership Check Before Payment
  if (order.winner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "You are not allowed to pay for this order",
    });
  }

  // Prevent double charging if already paid
  if (order.paymentStatus === "PAID") {
    return res.status(400).json({
      message: "This order has already been paid",
    });
  }

  // Check if we already have an active checkout session
  if (order.stripeSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );
      if (
        existingSession &&
        existingSession.status === "open" &&
        existingSession.url
      ) {
        return res.json({
          url: existingSession.url,
        });
      }
    } catch (error) {
      console.warn(
        "Could not retrieve existing Stripe session, generating new session...",
        error,
      );
    }
  }

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          quantity: 1,

          price_data: {
            currency: "usd",

            unit_amount: Math.round(order.amount * 100),

            product_data: {
              name: "Auction Item Payment",
            },
          },
        },
      ],

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,

      metadata: {
        orderId: order._id.toString(),
      },
    },
    {
      idempotencyKey: `checkout-session-order-${order._id.toString()}`,
    },
  );

  order.stripeSessionId = session.id;

  await order.save();

  return res.json({
    url: session.url,
  });
};

export const confirmPayment = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // 1. Guard Clause: If sessionId is missing, return early with a 400 Bad Request
  if (!sessionId || typeof sessionId !== "string") {
    return res
      .status(400)
      .json({ message: "Session ID parameter is required." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);

        if (order) {
          if (order.paymentStatus !== "PAID") {
            order.paymentStatus = "PAID";
            order.paidAt = new Date();
            await order.save();

            await AuctionItem.findByIdAndUpdate(order.auction, {
              status: "completed",
            });
          }
          return res.json({ success: true, order });
        }
      }
    }

    return res
      .status(400)
      .json({ message: "Payment not completed or order not found" });
  } catch (error: any) {
    console.error("Payment confirmation failed:", error.message);
    return res.status(500).json({ message: error.message });
  }
};
