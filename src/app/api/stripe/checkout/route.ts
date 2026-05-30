import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json(); // 'monthly' | 'yearly'

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile?.email ?? user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings`,
      // metadata on the session (for checkout.session.completed)
      metadata: { supabase_user_id: user.id },
      // metadata on the subscription itself (for subscription events)
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/checkout]', err);
    const message = err instanceof Error ? err.message : 'Stripe checkout failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
