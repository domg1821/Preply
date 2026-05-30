import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * Called by the app after a successful Stripe checkout redirect.
 * Verifies the session with Stripe, then sets is_premium = true in the DB.
 * This works in local dev where webhooks can't reach localhost.
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify the session with Stripe
    const session = await getStripe().checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.supabase_user_id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID in session metadata' }, { status: 400 });
    }

    // Verify the logged-in user matches the session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set premium
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', userId);

    if (error) {
      console.error('[stripe/confirm] DB update failed:', error);
      return NextResponse.json({ error: 'Failed to activate premium' }, { status: 500 });
    }

    console.log('[stripe/confirm] Premium activated for user', userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[stripe/confirm] Error:', err);
    const message = err instanceof Error ? err.message : 'Confirmation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
