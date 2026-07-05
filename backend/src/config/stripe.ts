import Stripe from 'stripe';
import { appLogger } from './logger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use the latest stable API version
  apiVersion: '2025-04-30.basil' as any,
});

appLogger.info('[Stripe] Real Stripe client initialized');

export default stripe;