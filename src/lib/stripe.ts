import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY ?? '';
    // Debug: log key length and first 12 chars so we can verify it's loading
    console.log('[stripe] key loaded:', key.slice(0, 12) + '...', 'length:', key.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  premium_monthly: process.env.STRIPE_PRICE_MONTHLY!,
  premium_yearly: process.env.STRIPE_PRICE_YEARLY!,
};
