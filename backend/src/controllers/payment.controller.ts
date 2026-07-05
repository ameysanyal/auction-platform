import type { Request, Response } from "express";

import stripe from "../config/stripe.js";

import Order from "../models/order.model.js";
import AuctionItem from "../models/auction-item.model.js";
import User from "../models/user.model.js";
import PaymentProfile from "../models/payment-profile.model.js";

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

export const createSetupIntent = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(req.user._id).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;

      // Update User database
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Failed to create SetupIntent:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const savePaymentProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { setupIntentId, termsAccepted, billingAddress } = req.body;

  if (!setupIntentId) {
    return res.status(400).json({ message: "SetupIntent ID is required" });
  }

  if (!termsAccepted) {
    return res.status(400).json({ message: "Terms must be accepted" });
  }

  if (!billingAddress || !billingAddress.line1 || !billingAddress.city || !billingAddress.state || !billingAddress.country || !billingAddress.postalCode) {
    return res.status(400).json({ message: "Complete billing address is required" });
  }

  try {
    const user = await User.findById(req.user._id).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve SetupIntent and expand the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
      expand: ["payment_method"],
    });

    if (setupIntent.status !== "succeeded") {
      return res.status(400).json({
        message: `SetupIntent status is ${setupIntent.status}. Expected succeeded.`,
      });
    }

    const paymentMethod = setupIntent.payment_method;
    if (!paymentMethod || typeof paymentMethod === "string") {
      return res.status(400).json({ message: "Payment method details could not be retrieved" });
    }

    const paymentMethodId = paymentMethod.id;
    const paymentMethodType = paymentMethod.type;
    const cardBrand = paymentMethod.card?.brand || "unknown";
    const last4 = paymentMethod.card?.last4 || "0000";
    const billingName = paymentMethod.billing_details?.name || user.name;
    const billingPhone = paymentMethod.billing_details?.phone || undefined;

    // Save payment profile
    const paymentProfile = await PaymentProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        stripeCustomerId: setupIntent.customer as string,
        defaultPaymentMethodId: paymentMethodId,
        paymentMethodType,
        cardBrand,
        last4,
        billingName,
        billingPhone,
        billingAddress: {
          line1: billingAddress.line1,
          line2: billingAddress.line2,
          city: billingAddress.city,
          state: billingAddress.state,
          country: billingAddress.country,
          postalCode: billingAddress.postalCode,
        },
        termsAccepted,
        termsAcceptedAt: new Date(),
        status: "ACTIVE",
      },
      { upsert: true, new: true }
    );

    // Update User document
    user.hasPaymentProfile = true;
    user.defaultPaymentMethodId = paymentMethodId;
    user.stripeCustomerId = setupIntent.customer as string;
    await user.save();

    // Emit Socket event: payment:updated
    const { io } = await import("../server.js");
    io.to(`user:${user._id.toString()}`).emit("payment:updated", {
      hasPaymentProfile: true,
      cardBrand,
      last4,
    });

    return res.json({
      success: true,
      message: "Payment profile updated successfully",
      profile: paymentProfile,
    });
  } catch (error: any) {
    console.error("Failed to save payment profile:", error);
    return res.status(500).json({ message: error.message });
  }
};

