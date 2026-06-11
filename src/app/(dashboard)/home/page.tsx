'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  CalendarDays, Plus, ShoppingCart, BookOpen, Flame, Beef, Wheat, Droplets,
  PartyPopper, TrendingUp, Sparkles, BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { MealPlanEntry, Profile, DailyLog } from '@/types';
import { getMondayOfWeek, getWeekDates, formatDate, calcRecipeMacros } from '@/lib/utils';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const MEAL_DOT: Record<string, string> = {
  breakfast: '#F59E0B',
  lunch: '#10B981',
  dinner: '#8B5CF6',
  snack: '#06B6D4',
};
const MEAL_BG: Record<string, string> = {
  breakfast: 'rgba(245,158,11,0.08)',
  lunch: 'rgba(16,185,129,0.08)',
  dinner: 'rgba(139,92,246,0.08)',
  snack: 'rgba(6,182,212,0.08)',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickLinks = [
  { href: '/calendar', label: 'Meal Calendar', desc: 'Plan your week',   color: '#06B6D4', Icon: CalendarDays },
  { href: '/grocery',  label: 'Grocery List',  desc: 'What to buy',      color: '#F59E0B', Icon: ShoppingCart },
  { href: '/recipes',  label: 'Recipes',        desc: 'Browse & build',   color: '#8B5CF6', Icon: BookOpen    },
  { href: '/events',   label: 'Event Menus',    desc: 'Plan for guests',  color: '#A855F7', Icon: PartyPopper },
];

export default function HomePage() {
  const today       = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM d');
  const monday      = getMondayOfWeek(new Date());
  const weekStartStr = formatDate(monday);
  const weekEndStr   = formatDate(getWeekDates(monday)[6]);

  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [meals,       setMeals]       = useState<MealPlanEntry[]>([]);
  const [weekMeals,   setWeekMeals]   = useState<MealPlanEntry[]>([]);
  const [dailyLog,    setDailyLog]    = useState<DailyLog | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [profileRes, mealsRes, weekMealsRes, logRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch(`/api/meal-plans?week_start=${today}&week_end=${today}`),
      fetch(`/api/meal-plans?week_start=${weekStartStr}&week_end=${weekEndStr}`),
      fetch(`/api/daily-logs?date=${today}`),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      if (!profileRes.data.onboarding_completed) setShowOnboarding(true);
    }
    if (mealsRes.ok)     setMeals((await mealsRes.json()) ?? []);
    if (weekMealsRes.ok) setWeekMeals((await weekMealsRes.json()) ?? []);
    if (logRes.ok) {
      const d = await logRes.json();
      setDailyLog(Array.isArray(d) ? (d[0] ?? null) : d);
    }
    setLoading(false);
  }, [today, weekStartStr, weekEndStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleWaterUpdate(glasses: number) {
    setDailyLog(prev => prev ? { ...prev, water_glasses: glasses } : { date: today, water_glasses: glasses });
    await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, water_glasses: glasses }),
    });
  }

  const firstName   = profile?.full_name?.split(' ')[0] ?? '';
  const goals       = profile?.macro_goals;
  const daysPlanned = new Set(weekMeals.map(m => m.date)).size;

  const mealsByType = MEAL_ORDER.reduce<Record<string, MealPlanEntry[]>>((acc, type) => {
    acc[type] = meals.filter(m => m.meal_type === type);
    return acc;
  }, {} as Record<string, MealPlanEntry[]>);

  const totals = meals.reduce((acc, e) => {
    if (!e.recipe) return acc;
    const m = calcRecipeMacros(e.recipe.ingredients, e.servings);
    return { calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3">
        {[72, 90, 150, 110, 100].map((h, i) => (
          <div key={i} className="rounded-2xl shimmer" style={{ height: h }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          userName={profile?.full_name}
          onComplete={() => { setShowOnboarding(false); fetchData(); }}
        />
      )}

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 animate-fade-in">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-bold mt-0.5 text-[var(--text)]">
              {firstName || 'Welcome back'}
            </h1>
            <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}>
              <CalendarDays size={11} />{displayDate}
            </p>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-2xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
          >
            <Plus size={14} />Add meal
          </Link>
        </div>

        {/* ── Stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: 'Calories',
              val: meals.length ? Math.round(totals.calories) : '—',
              sub: goals?.calories ? `/ ${goals.calories} goal` : 'today',
              color: '#F59E0B',
              Icon: Flame,
            },
            {
              label: 'Meals',
              val: meals.length,
              sub: 'logged today',
              color: '#10B981',
              Icon: BookOpen,
            },
            {
              label: 'Week',
              val: `${daysPlanned}/7`,
              sub: 'days planned',
              color: '#8B5CF6',
              Icon: TrendingUp,
            },
          ].map(({ label, val, sub, color, Icon }) => (
            <div
              key={label}
              className="rounded-2xl p-3.5 flex flex-col gap-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-[var(--text)]">{val}</p>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--text-dim)' }}>{label}</p>
                <p className="text-[9px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Macro bars ─────────────────────────────────────── */}
        {meals.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} style={{ color: 'var(--primary)' }} />
                <p className="text-sm font-bold text-[var(--text)]">Nutrition Today</p>
              </div>
              {goals && <Link href="/macros" className="text-[10px] font-semibold" style={{ color: 'var(--primary)' }}>View all →</Link>}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Cal',    val: Math.round(totals.calories), goal: goals?.calories, unit: '',  Icon: Flame,    color: '#F59E0B' },
                { label: 'Protein', val: Math.round(totals.protein), goal: goals?.protein,  unit: 'g', Icon: Beef,     color: '#10B981' },
                { label: 'Carbs',   val: Math.round(totals.carbs),   goal: goals?.carbs,    unit: 'g', Icon: Wheat,    color: '#06B6D4' },
                { label: 'Fat',     val: Math.round(totals.fat),     goal: goals?.fat,      unit: 'g', Icon: Droplets, color: '#8B5CF6' },
              ].map(({ label, val, goal, unit, Icon, color }) => {
                const pct = goal ? Math.min((val / goal) * 100, 100) : null;
                return (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <p className="text-sm font-bold text-[var(--text)]">{val}{unit}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    {pct !== null && (
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!goals && (
              <Link href="/settings"
                className="flex items-center justify-center gap-1 mt-3 text-xs font-semibold transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <Sparkles size={11} />Set macro goals to track progress
              </Link>
            )}
          </div>
        )}

        {/* ── Today's meals ──────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-bold text-[var(--text)]">Today&apos;s Meals</span>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              <Plus size={12} />Add
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 text-center px-4">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <Sparkles size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Nothing planned yet</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Start building your meal plan for today</p>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-bold text-white px-5 py-2.5 rounded-2xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
              >
                Plan meals →
              </Link>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {MEAL_ORDER.map(type => {
                const typeMeals = mealsByType[type];
                if (typeMeals.length === 0) return null;
                const dot = MEAL_DOT[type];
                const bg  = MEAL_BG[type];
                return (
                  <div key={type}>
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold mb-1.5"
                      style={{ background: bg, color: dot, border: `1px solid ${dot}28` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                      {MEAL_LABELS[type]}
                    </div>
                    {typeMeals.map(entry => {
                      const m = entry.recipe ? calcRecipeMacros(entry.recipe.ingredients, entry.servings) : null;
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1"
                          style={{
                            background: 'var(--surface-2)',
                            border: `1px solid var(--border)`,
                            borderLeft: `3px solid ${dot}`,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text)] truncate">{entry.recipe?.name ?? 'Unknown'}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.servings} serving{entry.servings !== 1 ? 's' : ''}</p>
                          </div>
                          {m && (
                            <p className="text-xs font-bold shrink-0" style={{ color: '#F59E0B' }}>
                              {Math.round(m.calories)} cal
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Water tracker ──────────────────────────────────── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <WaterTracker
            glasses={dailyLog?.water_glasses ?? 0}
            onSet={handleWaterUpdate}
          />
        </div>

        {/* ── Quick links ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, desc, color, Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-4 flex flex-col gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}28`, boxShadow: `0 4px 12px ${color}18` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}
