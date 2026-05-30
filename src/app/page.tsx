import Link from 'next/link';
import { ChefHat, CalendarDays, BarChart3, ShoppingCart, Crown, Sparkles, Check, PartyPopper } from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    title: 'Weekly Meal Planner',
    desc: 'Drag meals onto any day. See your week at a glance and adjust servings instantly.',
  },
  {
    icon: BarChart3,
    title: 'Macro Tracking',
    desc: 'Auto-calculated calories, protein, carbs & fat per meal and per day based on your actual servings.',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Grocery List',
    desc: 'One click to generate a consolidated grocery list. Link directly to Walmart or Publix cart.',
  },
  {
    icon: ChefHat,
    title: 'Recipe Builder',
    desc: 'Save any recipe with exact ingredient amounts per serving. Scale up or down on the fly.',
  },
  {
    icon: PartyPopper,
    title: 'Event Menu Planner',
    desc: 'Plan menus for parties or catering. Set guest count and get a perfectly scaled shopping list.',
  },
];

const premiumFeatures = [
  'AI meal suggestions personalized to your goals',
  'AI grocery list auto-sorted by store section',
  'Month-view calendar for multi-week planning',
  'Event menu PDF export with course sections & dietary labels',
  'Share grocery lists with family (no account needed)',
  'Priority support with same-day response',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[var(--border)]"
        style={{ background: 'rgba(14,17,23,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center glow-primary"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text">Preply</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff' }}
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full">
        {/* Glow orb — sits in a full-width wrapper so it never clips text */}
        <div className="absolute inset-x-0 top-0 h-80 pointer-events-none overflow-hidden">
          <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.10) 0%, transparent 65%)' }} />
        </div>
        <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-16 gap-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', color: 'var(--primary-light)' }}>
            <Sparkles size={11} />
            AI-powered meal planning
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text)]" style={{ lineHeight: '1.15' }}>
            Prep smarter.{' '}
            <span className="gradient-text" style={{ paddingBottom: '0.05em', display: 'inline-block' }}>Eat better.</span>
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-dim)] max-w-xl leading-relaxed">
            Plan your meals, track your macros, and generate your grocery list — all auto-scaled to your exact servings.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto text-base font-bold px-7 py-3 rounded-xl transition-all active:scale-95 shadow-xl glow-primary text-center"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff' }}
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-base text-[var(--text-dim)] hover:text-[var(--text)] px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-2)] transition-colors text-center"
            >
              Sign in →
            </Link>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[var(--primary)]" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[var(--primary)]" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[var(--primary)]" /> Cancel anytime</span>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-widest mb-2">Features</p>
          <h2 className="text-2xl font-bold">Everything you need to meal prep with confidence</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border p-6 hover:border-[var(--primary)]/30 transition-all duration-200 card-highlight"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--primary)]/15 transition-colors">
                <Icon size={20} className="text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/25 p-8 md:p-12"
          style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #16202e 60%, #1a1c28 100%)' }}>
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Premium</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Take your prep to the next level</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-lg">
              Unlock AI-powered meal suggestions, smart grocery sorting, multi-week planning, and more — from $3.50/mo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {premiumFeatures.map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-dim)]">
                  <Check size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}
            >
              <Crown size={16} />
              Get Premium — from $3.50/mo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] px-6 py-6 text-center text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} Preply · Eat with intention.
      </footer>
    </div>
  );
}
