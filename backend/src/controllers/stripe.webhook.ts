import Order from "../models/order.model.js";
import AuctionItem from "../models/auction-item.model.js";
import stripe from "../config/stripe.js";
import type { Request, Response } from "express";
import Stripe from "stripe";

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook secret is missing from environment variables");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;

  console.log(`[Stripe Webhook] Received event: ${event.type} for Order: ${orderId || "none"}`);

  if (!orderId) {
    return res.json({ received: true, message: "No order ID in metadata" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(`[Stripe Webhook] Order ${orderId} not found`);
      return res.status(404).send("Order not found");
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // Only mark PAID if stripe confirms payment is settled
        if (session.payment_status === "paid") {
          if (order.paymentStatus !== "PAID") {
            order.paymentStatus = "PAID";
            order.paidAt = new Date();
            await order.save();

            await AuctionItem.findByIdAndUpdate(order.auction, {
              status: "completed",
            });
            console.log(`[Stripe Webhook] Order ${orderId} successfully marked as PAID`);
          } else {
            console.log(`[Stripe Webhook] Order ${orderId} was already marked PAID`);
          }
        } else {
          console.log(`[Stripe Webhook] Session completed but payment status is: ${session.payment_status}`);
        }
        break;

      case "checkout.session.async_payment_failed":
        order.paymentStatus = "FAILED";
        await order.save();
        console.log(`[Stripe Webhook] Order ${orderId} payment failed (async)`);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing webhook event:`, err.message);
    return res.status(500).send("Internal processing error");
  }

  return res.json({ received: true });
};