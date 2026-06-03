import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Fast-path IAP verification — called by the iOS app right after a successful
 * RevenueCat purchase, before the webhook arrives.
 * The webhook at /api/webhooks/revenuecat is the durable/authoritative path.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const rcApiKey = process.env.REVENUECAT_API_KEY;
  if (!rcApiKey) {
    return NextResponse.json({ error: 'IAP not configured.' }, { status: 500 });
  }

  try {
    const rcRes = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      {
        headers: {
          Authorization: `Bearer ${rcApiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!rcRes.ok) {
      return NextResponse.json({ isPremium: false, error: 'Verification failed.' }, { status: 502 });
    }

    const data = await rcRes.json() as {
      subscriber: {
        entitlements: Record<string, { expires_date: string | null }>;
      };
    };

    const entitlement = data.subscriber?.entitlements?.['premium'];
    const isPremium = !!entitlement && (
      entitlement.expires_date === null ||
      new Date(entitlement.expires_date) > new Date()
    );

    if (isPremium) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      await admin.from('profiles').update({ is_premium: true }).eq('id', user.id);
    }

    return NextResponse.json({ isPremium });
  } catch (err) {
    console.error('[iap/verify] error:', err);
    return NextResponse.json({ isPremium: false, error: 'Verification failed.' }, { status: 500 });
  }
}
