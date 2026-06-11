'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Plus, ShoppingCart, BookOpen, Flame, Beef, Wheat, Droplets, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { MealPlanEntry, Profile } from '@/types';
import { getMondayOfWeek, getWeekDates, formatDate, calcRecipeMacros } from '@/lib/utils';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-amber-400 bg-amber-500/10',
  lunch: 'text-[var(--primary)] bg-emerald-500/10',
  dinner: 'text-purple-400 bg-purple-500/10',
  snack: 'text-blue-400 bg-blue-500/10',
};

const quickLinks = [
  { href: '/calendar', label: 'Meal Calendar', desc: 'Plan your week', color: 'text-[var(--primary)]', bg: 'bg-emerald-500/10', Icon: CalendarDays },
  { href: '/grocery', label: 'Grocery List', desc: 'What to buy', color: 'text-amber-400', bg: 'bg-amber-500/10', Icon: ShoppingCart },
  { href: '/recipes', label: 'Recipes', desc: 'Browse & build', color: 'text-blue-400', bg: 'bg-blue-500/10', Icon: BookOpen },
  { href: '/events', label: 'Event Menus', desc: 'Plan for guests', color: 'text-purple-400', bg: 'bg-purple-500/10', Icon: PartyPopper },
];

export default function HomePage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM d');
  const monday = getMondayOfWeek(new Date());
  const weekStartStr = formatDate(monday);
  const weekEndStr = formatDate(getWeekDates(monday)[6]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [meals, setMeals] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [profileRes, mealsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch(`/api/meal-plans?week_start=${today}&week_end=${today}`),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      if (!profileRes.data.onboarding_completed) setShowOnboarding(true);
    }
    if (mealsRes.ok) setMeals((await mealsRes.json()) ?? []);
    setLoading(false);
  }, [today, weekStartStr, weekEndStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  const mealsByType = MEAL_ORDER.reduce<Record<string, MealPlanEntry[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.meal_type === type);
    return acc;
  }, {} as Record<string, MealPlanEntry[]>);

  const totals = meals.reduce((acc, entry) => {
    if (!entry.recipe) return acc;
    const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
    return { calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-8 w-44 rounded-lg bg-[var(--surface)] animate-pulse" />
        <div className="h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        <div className="h-48 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
        <div className="h-28 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
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

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">
              {firstName ? `Hey, ${firstName}` : 'Today'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <CalendarDays size={11} />
              {displayDate}
            </p>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <Plus size={13} />
            Add meal
          </Link>
        </div>

        {/* Macros bar — only shown when there are meals */}
        {meals.length > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-2xl p-3 border border-[var(--border)]"
            style={{ background: 'var(--surface)' }}>
            {[
              { label: 'Cal', val: Math.round(totals.calories), Icon: Flame, color: 'text-amber-400' },
              { label: 'Protein', val: `${Math.round(totals.protein)}g`, Icon: Beef, color: 'text-[var(--primary)]' },
              { label: 'Carbs', val: `${Math.round(totals.carbs)}g`, Icon: Wheat, color: 'text-blue-400' },
              { label: 'Fat', val: `${Math.round(totals.fat)}g`, Icon: Droplets, color: 'text-purple-400' },
            ].map(({ label, val, Icon, color }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <Icon size={12} className={color} />
                <p className={`text-sm font-bold ${color}`}>{val}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Today's meals */}
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
            <span className="text-sm font-semibold text-[var(--text)]">Meals Today</span>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors">
              <Plus size={12} /> Add
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="flex flex-col items-center py-7 gap-2 text-center px-4">
              <p className="text-sm text-[var(--text-muted)]">Nothing planned yet.</p>
              <Link href="/calendar" className="text-xs font-semibold text-[var(--primary)] hover:underline">
                Open calendar to add meals →
              </Link>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-1">
              {MEAL_ORDER.map((type) => {
                const typeMeals = mealsByType[type];
                if (typeMeals.length === 0) return null;
                return (
                  <div key={type}>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1 ${MEAL_COLORS[type]}`}>
                      {MEAL_LABELS[type]}
                    </div>
                    {typeMeals.map((entry) => (
                      <div key={entry.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl mb-1"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text)] truncate">{entry.recipe?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-[var(--text-muted)]">{entry.servings} serving{entry.servings !== 1 ? 's' : ''}</p>
                        </div>
                        {entry.recipe && (() => {
                          const m = calcRecipeMacros(entry.recipe.ingredients, entry.servings);
                          return <p className="text-xs text-amber-400 font-semibold shrink-0">{Math.round(m.calories)} cal</p>;
                        })()}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2.5">
          {quickLinks.map(({ href, label, desc, color, bg, Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-[var(--border)] p-4 flex flex-col gap-2 hover:scale-[1.02] transition-all duration-150 group"
              style={{ background: 'var(--surface)' }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={15} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
