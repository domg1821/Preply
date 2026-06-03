'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Crown, Check, AlertCircle, Sparkles, ShoppingCart, BookOpen,
  FileDown, Headphones, Zap, Star, ChevronDown, ChevronUp,
  Shield, Clock, Users, ChefHat, LayoutGrid, Share2, Printer, ArrowRight, LogOut, CreditCard, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useIsNative } from '@/lib/useIsNative';
import IAPPaywall from '@/components/IAPPaywall';

const PREMIUM_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Weekly Meal Plans',
    desc: 'Get a full 7-day meal plan generated in seconds based on your goals and taste.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Grocery Lists',
    desc: 'Sync your meal plan to a grocery list that\'s auto-sorted by store section.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BookOpen,
    title: 'Unlimited Recipes',
    desc: 'Build and store as many custom recipes as you want — no limits, ever.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: FileDown,
    title: 'PDF & Export',
    desc: 'Export your grocery list or meal plan as a PDF, or share it with family.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Zap,
    title: 'Multi-week Planning',
    desc: 'Plan meals weeks in advance and never scramble for dinner ideas again.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    desc: 'Skip the queue. Get help from our team within hours, not days.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: FileDown,
    title: 'Event Menu PDF Export',
    desc: 'Export polished menus with course sections, dietary labels, and scaled shopping lists.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

const COMPARE_ROWS = [
  { label: 'Meal calendar & planning', free: true, premium: true },
  { label: 'Recipe library (500+ meals)', free: true, premium: true },
  { label: 'Grocery list from meal plan', free: true, premium: true },
  { label: 'Basic macro tracking', free: true, premium: true },
  { label: 'AI weekly meal suggestions', free: false, premium: true },
  { label: 'Smart grocery auto-sort', free: false, premium: true },
  { label: 'Multi-week planning', free: false, premium: true },
  { label: 'PDF export', free: false, premium: true },
  { label: 'Unlimited custom recipes', free: false, premium: true },
  { label: 'Event menu PDF export', free: false, premium: true },
  { label: 'Priority support', free: false, premium: true },
];

const TESTIMONIALS = [
  {
    name: 'Jessica M.',
    role: 'Busy mom of 3',
    text: 'The AI meal planner saves me an hour every Sunday. I just hit generate and my whole week is done. Worth every penny.',
    stars: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Fitness enthusiast',
    text: 'Finally an app that tracks macros AND plans my meals. The grocery sync is a game changer — I stopped buying random stuff.',
    stars: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Meal prep Sunday fan',
    text: 'I\'ve tried 5 meal planners. This is the only one I\'ve stuck with. The smart grocery list alone makes it worth it.',
    stars: 5,
  },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, absolutely. Cancel anytime from your account settings. You keep Premium access until the end of your billing period.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a 7-day money-back guarantee. If you\'re not satisfied in the first week, just reach out and we\'ll refund you — no questions asked.',
  },
  {
    q: 'What\'s included in the free plan?',
    a: 'The free plan includes the full recipe library, meal calendar, and grocery list. Premium unlocks AI suggestions, smart features, export, and more.',
  },
];

// Features shown to premium users with step-by-step how-to
const PREMIUM_FEATURES_HUB = [
  {
    icon: Sparkles,
    title: 'AI Meal Suggestions',
    desc: 'Generate a full week of meals in 60 seconds, personalised to your taste.',
    how: 'Calendar → tap "AI Suggest" button (top right)',
    href: '/calendar',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    borderColor: 'rgba(168,85,247,0.2)',
  },
  {
    icon: LayoutGrid,
    title: 'Month View Calendar',
    desc: 'See all 4 weeks at once — perfect for big batches or event catering.',
    how: 'Calendar → tap the grid icon next to "AI Suggest"',
    href: '/calendar',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  {
    icon: Zap,
    title: 'AI Grocery Organizer',
    desc: 'Auto-sort your grocery list by store section — no more criss-crossing the aisles.',
    how: 'Grocery List → tap "AI Organize" at the top of the list',
    href: '/grocery',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    borderColor: 'rgba(245,158,11,0.2)',
  },
  {
    icon: Share2,
    title: 'Share Grocery List',
    desc: 'Send a live grocery list to anyone — no account needed on their end.',
    how: 'Grocery List → tap the Share icon in the toolbar',
    href: '/grocery',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  {
    icon: Printer,
    title: 'Print & PDF Export',
    desc: 'Print your grocery list or download it as a PDF for offline shopping.',
    how: 'Grocery List → tap the Print icon in the toolbar',
    href: '/grocery',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    borderColor: 'rgba(6,182,212,0.2)',
  },
  {
    icon: ShoppingCart,
    title: 'Order Groceries Online',
    desc: 'Send your whole list to Instacart or Walmart in one tap.',
    how: 'Grocery List → tap "Order Online" in the toolbar',
    href: '/grocery',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    borderColor: 'rgba(244,63,94,0.2)',
  },
  {
    icon: FileDown,
    title: 'Event Menu PDF Export',
    desc: 'Export polished, print-ready menus with course sections, dietary labels, and shopping lists.',
    how: 'Event Menus → open an event → tap "Export PDF"',
    href: '/events',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    borderColor: 'rgba(139,92,246,0.2)',
  },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const native = useIsNative();
  const justUpgraded = searchParams.get('success') === 'true';

  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (justUpgraded) {
      // Show premium UI immediately while we confirm in the background
      setIsPremium(true);

      // Call confirm endpoint to set is_premium = true in the DB
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        }).then((res) => {
          if (!res.ok) console.warn('[settings] Premium confirm failed');
          else console.log('[settings] Premium confirmed in DB');
        });
      }
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? '');
      supabase.from('profiles').select('is_premium').eq('id', user.id).single().then(({ data }) => {
        if (data?.is_premium) setIsPremium(true);
      });

      // Configure RevenueCat for IAP on iOS
      if (native) {
        try {
          const { configureRevenueCat } = await import('@/lib/revenuecat');
          await configureRevenueCat(user.id);
        } catch (e) {
          console.warn('[settings] RevenueCat configure failed:', e);
        }
      }
    });
  }, [justUpgraded, searchParams, native]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const supabase = createClient();
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Could not delete account.');
      }
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong.');
      setDeleteLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    setPortalError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not open billing portal.');
      if (!data.url || !data.url.startsWith('https://')) {
        throw new Error('Invalid portal URL received. Please try again.');
      }
      const { openUrl } = await import('@/lib/capacitor');
      await openUrl(data.url);
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      // Always parse JSON safely — a crashed route can return an empty body
      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server error — could not start checkout. Please try again.');
      }

      if (!res.ok) throw new Error(data.error ?? 'Payment setup failed. Please try again.');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not start checkout. Please check your Stripe configuration.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Settings</h1>

      {/* Post-checkout success banner */}
      {justUpgraded && (
        <div className="rounded-2xl border border-emerald-500/30 p-4 mb-5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))' }}>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Check size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text)]">Welcome to Premium! 🎉</p>
            <p className="text-sm text-[var(--text-muted)]">Your account is being activated — all features will unlock within a few seconds.</p>
          </div>
        </div>
      )}

      {isPremium ? (
        /* ── Premium Hub ── */
        <div className="mb-6 space-y-4">

          {/* Status header */}
          <div className="rounded-2xl border border-amber-500/30 p-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <Crown size={20} className="text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-[var(--text)]">Preply Premium</p>
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Check size={9} /> ACTIVE
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                All {PREMIUM_FEATURES_HUB.length} premium features are unlocked. Tap any tile below to jump straight to it.
              </p>
            </div>
          </div>

          {/* Feature tiles */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 px-0.5">
              Your Premium Features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREMIUM_FEATURES_HUB.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="rounded-2xl border p-4 flex gap-3 hover:scale-[1.01] transition-all duration-150 group"
                  style={{ background: 'var(--surface)', borderColor: feature.borderColor }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feature.bg}`}>
                    <feature.icon size={17} className={feature.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--text)] leading-tight">{feature.title}</p>
                      <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">{feature.desc}</p>
                    <p className="text-[11px] font-semibold text-[var(--primary)] opacity-80">
                      {feature.how}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tips banner */}
          <div className="rounded-2xl border border-[var(--border)] p-4 flex items-start gap-3"
            style={{ background: 'var(--surface)' }}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-0.5">Quick tip</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Start with <span className="font-semibold text-[var(--text)]">AI Meal Suggestions</span> on the Calendar —
                it fills your whole week in one shot, then your grocery list builds itself automatically.
              </p>
            </div>
          </div>

          {/* Manage subscription — hidden in the iOS app (Stripe portal is web-only) */}
          {!native && (
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-4 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Subscription</p>
              </div>
              <div className="p-5">
                <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                  Cancel, pause, or update your payment method through the Stripe billing portal.
                </p>
                {portalError && (
                  <p className="text-xs text-red-400 mb-3">{portalError}</p>
                )}
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all disabled:opacity-50"
                >
                  {portalLoading ? (
                    <span className="w-4 h-4 border-2 border-[var(--border-2)] border-t-[var(--primary)] rounded-full animate-spin" />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  {portalLoading ? 'Opening portal…' : 'Manage Subscription'}
                </button>
              </div>
            </div>
          )}

        </div>
      ) : native ? (
        /* ── iOS free — show IAP paywall (Apple 3.1.1 compliant) ── */
        <IAPPaywall onPremiumActivated={() => setIsPremium(true)} />
      ) : (
        /* ── Premium Upgrade Section (web only) ── */
        <div className="mb-6 space-y-4">

          {/* Hero */}
          <div className="rounded-2xl overflow-hidden border border-amber-500/20"
            style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #161c28 100%)' }}>

            {/* Top banner */}
            <div className="px-6 py-5 text-center border-b border-amber-500/10"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02))' }}>
              {/* Urgency badge */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/25 mb-3">
                <Zap size={10} />
                LAUNCH PRICING — LOCK IN $3.50/MO FOREVER
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Stop guessing what to cook.<br />
                <span className="text-amber-400">Let AI plan it for you.</span>
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                Join 2,400+ people who plan their entire week in under 60 seconds.
              </p>
              {/* Competitor anchor */}
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-xs border"
                style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <span className="text-[var(--text-muted)]">Most meal apps charge</span>
                <span className="line-through text-red-400 font-semibold">$7–13/mo</span>
                <span className="text-[var(--text-muted)]">· We charge</span>
                <span className="text-emerald-400 font-bold">$3.50/mo</span>
              </div>
              {/* Social proof row */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Users size={12} className="text-amber-400" />
                  2,400+ members
                </div>
                <div className="w-px h-3 bg-[var(--border)]" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  4.9 rating
                </div>
                <div className="w-px h-3 bg-[var(--border)]" />
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Shield size={12} className="text-emerald-400" />
                  7-day guarantee
                </div>
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border-b border-[var(--border)]"
              style={{ background: 'var(--border)' }}>
              {PREMIUM_FEATURES.map((f) => (
                <div key={f.title} className="p-4 flex flex-col gap-2"
                  style={{ background: '#161c28' }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.bg}`}>
                    <f.icon size={15} className={f.color} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">{f.title}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="p-6">
              {/* Toggle */}
              <div className="max-w-sm mx-auto mb-5">
                <div className="flex rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 relative">
                  <button
                    onClick={() => setPlan('yearly')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                      plan === 'yearly' ? 'text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                    style={plan === 'yearly' ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' } : {}}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${plan === 'yearly' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-400'}`}>
                        BEST VALUE
                      </span>
                      Yearly
                    </span>
                    <span className={`text-[11px] font-bold ${plan === 'yearly' ? 'text-black/70' : 'text-amber-400'}`}>$3.50/mo</span>
                  </button>
                  <button
                    onClick={() => setPlan('monthly')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                      plan === 'monthly' ? 'text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                    style={plan === 'monthly' ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)' } : {}}
                  >
                    <span>Monthly</span>
                    <span className={`text-[11px] font-semibold ${plan === 'monthly' ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>$4.99/mo</span>
                  </button>
                </div>
                {plan === 'monthly' && (
                  <p className="text-center text-xs text-amber-400 mt-1.5 flex items-center justify-center gap-1">
                    <AlertCircle size={11} />
                    Switch to yearly and save $17.89/year
                  </p>
                )}
              </div>

              {/* Price display */}
              <div className="text-center mb-5">
                {plan === 'yearly' ? (
                  <>
                    <div className="flex items-end justify-center gap-1 mb-0.5">
                      <span className="text-5xl font-bold text-white">$3.50</span>
                      <span className="text-[var(--text-muted)] text-sm mb-2">/month</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Billed as <span className="font-semibold text-[var(--text)]">$41.99/year</span>
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <Check size={11} /> Save $17.89 vs monthly
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">· Less than 1 coffee/mo</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-center gap-1 mb-0.5">
                      <span className="text-5xl font-bold text-white">$4.99</span>
                      <span className="text-[var(--text-muted)] text-sm mb-2">/month</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Billed monthly · cancel anytime</p>
                    <button
                      onClick={() => setPlan('yearly')}
                      className="mt-2 text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
                    >
                      Switch to yearly — save $17.89 →
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-base text-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 24px rgba(245,158,11,0.35)' }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown size={16} />
                    {plan === 'yearly'
                      ? 'Get Premium — $3.50/mo, billed yearly'
                      : 'Get Premium — $4.99/mo'}
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-3 mt-2.5 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Shield size={11} className="text-emerald-400" /> 7-day guarantee</span>
                <span>·</span>
                <span>Cancel anytime</span>
                <span>·</span>
                <span>Instant access</span>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--surface)' }}>
            <div className="grid grid-cols-3 px-4 py-3 border-b border-[var(--border)]"
              style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Feature</p>
              <p className="text-xs font-semibold text-[var(--text-muted)] text-center uppercase tracking-wider">Free</p>
              <p className="text-xs font-semibold text-amber-400 text-center uppercase tracking-wider flex items-center justify-center gap-1">
                <Crown size={10} /> Premium
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {COMPARE_ROWS.map((row) => (
                <div key={row.label} className="grid grid-cols-3 px-4 py-2.5 items-center">
                  <p className="text-sm text-[var(--text)]">{row.label}</p>
                  <div className="flex justify-center">
                    {row.free
                      ? <Check size={15} className="text-emerald-400" />
                      : <span className="text-[var(--text-muted)] text-lg leading-none">—</span>}
                  </div>
                  <div className="flex justify-center">
                    <Check size={15} className="text-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-[var(--border)] p-4 flex flex-col gap-2"
                style={{ background: 'var(--surface)' }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text)] leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--surface)' }}>
            <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider px-5 pt-4 pb-2">
              Common questions
            </p>
            <div className="divide-y divide-[var(--border)]">
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span className="text-sm font-medium text-[var(--text)]">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp size={15} className="text-[var(--text-muted)] shrink-0" />
                      : <ChevronDown size={15} className="text-[var(--text-muted)] shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="rounded-2xl border border-amber-500/20 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <ChefHat size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">$3.50/mo — less than one Starbucks.</p>
                <p className="text-xs text-[var(--text-muted)]">Most meal apps charge $7–13/mo. Lock in our launch price today.</p>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm text-black whitespace-nowrap hover:opacity-90 transition-all flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              <Crown size={14} />
              Get Premium — $3.50/mo
            </button>
          </div>

        </div>
      )}

      {/* Account section */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Account</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Signed in as</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{userEmail || '—'}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <LogOut size={14} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="px-6 pb-6">
          <div className="border-t border-[var(--border)] pt-5">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
                Delete account
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                <p className="text-sm font-semibold text-red-400 mb-1">Delete your account?</p>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  This permanently deletes all your recipes, meal plans, grocery lists, and account data. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-xs text-red-400 mb-3">{deleteError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                    disabled={deleteLoading}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
