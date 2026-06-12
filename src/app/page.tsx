import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  ChefHat, CalendarDays, BarChart3, ShoppingCart,
  Sparkles, Check, PartyPopper, BookOpen, Droplets, ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    title: 'Weekly Meal Planner',
    desc: 'Plan any meal on any day. See your whole week at a glance and adjust servings instantly.',
    color: '#06B6D4',
  },
  {
    icon: BarChart3,
    title: 'Macro Tracking',
    desc: 'Auto-calculated calories, protein, carbs & fat per meal and per day based on your actual servings.',
    color: '#EC4899',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Grocery List',
    desc: 'One click to generate a consolidated grocery list from your whole week plan.',
    color: '#F59E0B',
  },
  {
    icon: BookOpen,
    title: 'Recipe Builder',
    desc: 'Save any recipe with exact ingredient amounts per serving. Scale up or down on the fly.',
    color: '#8B5CF6',
  },
  {
    icon: PartyPopper,
    title: 'Event Menus',
    desc: 'Plan menus for parties or catering. Set guest count and get a perfectly scaled shopping list.',
    color: '#A855F7',
  },
  {
    icon: Droplets,
    title: 'Hydration Tracker',
    desc: 'Track your daily water intake alongside your food to stay on top of your goals.',
    color: '#06B6D4',
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'rgba(7,9,14,0.85)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
          >
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Preply</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-bold px-4 py-2 rounded-2xl transition-all active:scale-95 text-white"
            style={{
              background: 'linear-gradient(135deg, #10B981, #06B6D4)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)', filter: 'blur(20px)' }} />
          <div style={{ position: 'absolute', top: 0, right: '-15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        </div>

        <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 gap-7 max-w-3xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--primary-light)',
            }}
          >
            <Sparkles size={11} />
            AI-powered meal planning
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text)]"
            style={{ lineHeight: 1.12 }}
          >
            Prep smarter.{' '}
            <span className="gradient-text" style={{ display: 'inline-block' }}>
              Eat better.
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Plan your meals, track your macros, and generate your grocery list — all auto-scaled to your exact servings.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-bold px-8 py-3.5 rounded-2xl transition-all active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                boxShadow: '0 6px 28px rgba(16,185,129,0.4)',
              }}
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-base font-medium px-7 py-3.5 rounded-2xl border transition-all text-center"
              style={{ color: 'var(--text-dim)', borderColor: 'var(--border-2)' }}
            >
              Sign in
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['Free forever', 'No credit card', 'Available on iOS'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={12} style={{ color: 'var(--primary)' }} />{t}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
            Everything included
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            One app. All your meal prep needs.
          </h2>
          <p className="mt-3 text-sm max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            Every feature is free — no subscriptions, no paywalls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <div
          className="relative rounded-3xl overflow-hidden p-8 md:p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 100%)' }}
          />
          <div className="relative">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                boxShadow: '0 8px 28px rgba(16,185,129,0.4)',
              }}
            >
              <ChefHat size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-3">
              Ready to take control of your meals?
            </h2>
            <p className="max-w-md mx-auto mb-7 text-sm" style={{ color: 'var(--text-dim)' }}>
              Join thousands of people who plan smarter with Preply. It&apos;s free, always.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-base font-bold px-8 py-3.5 rounded-2xl text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                boxShadow: '0 6px 28px rgba(16,185,129,0.4)',
              }}
            >
              Get started — it&apos;s free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="mt-auto border-t px-6 py-6 text-center text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
          >
            <ChefHat size={12} className="text-white" />
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-dim)' }}>Preply</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs mb-2">
          <Link href="/privacy" className="hover:text-[var(--text-dim)] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[var(--text-dim)] transition-colors">Terms of Use</Link>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} Preply · Eat with intention.</p>
      </footer>
    </div>
  );
}
