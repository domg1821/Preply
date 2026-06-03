import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * RevenueCat webhook — authoritative path for subscription state changes.
 * Configure this URL in RevenueCat → Project Settings → Webhooks:
 *   https://yourdomain.com/api/webhooks/revenuecat
 * Add REVENUECAT_WEBHOOK_SECRET to your Vercel env vars and paste it into RevenueCat.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  let event: {
    event: {
      type: string;
      app_user_id: string;
      expiration_at_ms?: number | null;
    };
  };

  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { type, app_user_id } = event.event;
  if (!app_user_id) return NextResponse.json({ received: true });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const ACTIVE_EVENTS = new Set([
    'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'TRANSFER',
  ]);
  const INACTIVE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE']);

  if (ACTIVE_EVENTS.has(type)) {
    await admin.from('profiles').update({ is_premium: true }).eq('id', app_user_id);
    console.log(`[webhook/revenuecat] ${type} → activated premium for ${app_user_id}`);
  } else if (INACTIVE_EVENTS.has(type)) {
    const expiresMs = event.event.expiration_at_ms;
    const hasExpired = expiresMs ? Date.now() > expiresMs : false;

    if (type === 'EXPIRATION' || hasExpired) {
      await admin.from('profiles').update({ is_premium: false }).eq('id', app_user_id);
      console.log(`[webhook/revenuecat] ${type} → deactivated premium for ${app_user_id}`);
    } else {
      console.log(`[webhook/revenuecat] ${type} → keeping premium until expiry for ${app_user_id}`);
    }
  }

  return NextResponse.json({ received: true });
}
