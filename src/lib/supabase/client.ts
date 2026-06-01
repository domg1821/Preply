import { createBrowserClient } from '@supabase/ssr';

// 400 days — the maximum cookie lifetime browsers allow. Keeps users signed in
// on mobile (WKWebView) until they explicitly log out, instead of treating the
// auth cookie as a session cookie that's cleared when the app closes.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: true,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
