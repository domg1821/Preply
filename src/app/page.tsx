import Link from 'next/link';
import { ChefHat, CalendarDays, BarChart3, ShoppingCart, Crown, Zap, Target } from 'lucide-react';

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
];

const premiumFeatures = [
  'AI meal suggestions based on your macro goals',
  'Barcode scanner for instant ingredient macros',
  'Multi-week planning & meal history',
  'Recipe sharing & community library',
  'Export grocery lists as PDF or share link',
  'Advanced micronutrient tracking',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Preply</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-4 py-2 rounded-xl transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 gap-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-dim)]">
          <Zap size={12} className="text-[var(--primary)]" />
          Smart meal prep, zero guesswork
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-[var(--text)]">
          Prep smarter.{' '}
          <span className="text-[var(--primary)]">Eat better.</span>
        </h1>
        <p className="text-lg text-[var(--text-dim)] max-w-xl">
          Plan your meals, track your macros, and build your grocery list — all scaled perfectly to your servings.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="text-base font-semibold bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="text-base text-[var(--text-dim)] hover:text-[var(--text)] px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-2)] transition-colors"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10">Everything you need to meal prep with confidence</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 hover:border-[var(--border-2)] transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-1.5">{title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-amber-500/20 p-8 md:p-12">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={20} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Premium</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Take your prep to the next level</h2>
          <p className="text-[var(--text-muted)] mb-8 max-w-lg">
            Unlock AI-powered meal suggestions, barcode scanning, multi-week planning, and more.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {premiumFeatures.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-dim)]">
                <Target size={14} className="text-amber-400 mt-0.5 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-all active:scale-95"
          >
            <Crown size={16} />
            Get Premium
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] px-6 py-6 text-center text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} Preply. Eat with intention.
      </footer>
    </div>
  );
}
