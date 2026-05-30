import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClientDirect } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Stripe sends a raw body — Next.js must NOT parse it
export const dynamic = 'force-dynamic';

async function setUserPremium(supabase: ReturnType<typeof createAdminClientDirect>, userId: string | undefined, isPremium: boolean) {
  if (!userId) return;
  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', userId);
  if (error) {
    console.error(`[webhook] Failed to update is_premium=${isPremium} for user ${userId}:`, error);
  } else {
    console.log(`[webhook] Set is_premium=${isPremium} for user ${userId}`);
  }
}

// Look up Supabase user ID from a Stripe customer ID
async function getUserIdFromCustomer(supabase: ReturnType<typeof createAdminClientDirect>, customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClientDirect();

  try {
    switch (event.type) {

      // ── Checkout completed — most reliable first-payment event ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId && session.payment_status === 'paid') {
          await setUserPremium(supabase, userId, true);
        }
        break;
      }

      // ── Subscription created or changed ──
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === 'active' || sub.status === 'trialing';

        // Prefer metadata on subscription; fall back to customer lookup
        let userId: string | undefined = sub.metadata?.supabase_user_id;
        if (!userId && sub.customer) {
          userId = (await getUserIdFromCustomer(supabase, sub.customer as string)) ?? undefined;
        }

        if (userId) {
          await setUserPremium(supabase, userId, active);
        }
        break;
      }

      // ── Subscription cancelled / expired ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        let userId: string | undefined = sub.metadata?.supabase_user_id;
        if (!userId && sub.customer) {
          userId = (await getUserIdFromCustomer(supabase, sub.customer as string)) ?? undefined;
        }

        if (userId) {
          await setUserPremium(supabase, userId, false);
        }
        break;
      }

      // ── Renewal payment succeeded — keep premium active ──
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
          const userId = await getUserIdFromCustomer(supabase, invoice.customer as string);
          if (userId) {
            await setUserPremium(supabase, userId, true);
          }
        }
        break;
      }

      // ── Payment failed — optionally downgrade ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Only revoke after final failure attempt, not on first retry
        const attempt = (invoice as Stripe.Invoice & { attempt_count?: number }).attempt_count ?? 1;
        if (attempt >= 3 && invoice.customer) {
          const userId = await getUserIdFromCustomer(supabase, invoice.customer as string);
          if (userId) {
            await setUserPremium(supabase, userId, false);
          }
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
